import logging
from datetime import datetime, timedelta

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, or_, and_

from models.user import User
from models.pickup import PickupRequest
from models.item import EWasteItem
from models.notification import Notification
from models.pickup_note import PickupNote
from extensions import db

from utils.email_sender import send_email
from utils.email_templates import render_pickup_status_update

print("collector_routes loaded")

collector_bp = Blueprint(
    "collector",
    __name__,
    url_prefix="/api/collector"
)
logger = logging.getLogger(__name__)

# ---------------- HELPERS ----------------

def require_collector(user_id):
    user = User.query.get(user_id)
    return user if user and user.role == "COLLECTOR" else None


def pickup_to_dict(p):
    """Convert PickupRequest to dictionary for JSON response"""
    # Get user info
    user = User.query.get(p.user_id) if p.user_id else None
    
    # Get items
    items = EWasteItem.query.filter_by(pickup_id=p.id).all()
    
    latest_note = (
        PickupNote.query.filter_by(pickup_id=p.id)
        .order_by(PickupNote.created_at.desc())
        .first()
    )

    return {
        "id": p.id,
        "status": p.status,
        "address": p.address,
        "scheduledDate": str(p.scheduled_date) if p.scheduled_date else None,
        "scheduledTimeSlot": p.time_slot or "",
        "totalWeight": float(p.total_weight or 0),
        "priority": p.priority or "NORMAL",
        "userName": user.name if user else "Unknown",
        "userPhone": user.phone if user else "",
        "notes": latest_note.note if latest_note else None,
        "createdAt": str(p.created_at) if p.created_at else None,
        "latitude": float(p.latitude) if getattr(p, "latitude", None) is not None else None,
        "longitude": float(p.longitude) if getattr(p, "longitude", None) is not None else None,
        "items": [
            {
                "id": item.id,
                "category": item.category or "",
                "quantity": int(item.quantity or 1),
                "estimatedWeight": float(item.estimated_weight or 0)
            }
            for item in items
        ]
    }


# ---------------- PROFILE ----------------

@collector_bp.route("/profile", methods=["GET"])
@jwt_required()
def profile():
    user_id = get_jwt_identity()
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    if user.role != "COLLECTOR":
        return jsonify({"error": "Collector access required"}), 403
    
    return jsonify({
        "user_id": user_id,
        "email": user.email,
        "name": user.name,
        "role": user.role
    }), 200


# ---------------- PICKUPS ----------------

@collector_bp.route("/pickups", methods=["GET"])
@jwt_required()
def get_pickups():
    """Get pickups visible to the current collector.

    Rules:
    - All pickups explicitly assigned to this collector (collector_id == user_id)
    - PLUS unassigned pickup requests with status REQUESTED (collector_id is NULL)
    """
    user_id = get_jwt_identity()
    
    if not require_collector(user_id):
        return jsonify({"error": "Collector access required"}), 403
    
    # Pickups assigned to this collector OR unassigned requested pickups
    pickups = PickupRequest.query.filter(
        or_(
            PickupRequest.collector_id == user_id,
            and_(
                PickupRequest.collector_id.is_(None),
                PickupRequest.status == "REQUESTED",
            ),
        )
    ).order_by(PickupRequest.created_at.desc()).all()
    
    return jsonify({
        "data": [pickup_to_dict(p) for p in pickups],
        "count": len(pickups)
    }), 200


@collector_bp.route("/pickups/<pickup_id>/notes", methods=["PUT"])
@jwt_required()
def add_pickup_notes(pickup_id):
    """Add/update notes for a pickup (collector)."""
    user_id = get_jwt_identity()

    if not require_collector(user_id):
        return jsonify({"error": "Collector access required"}), 403

    pickup = PickupRequest.query.get_or_404(pickup_id)

    # Only assigned collector can add notes
    if pickup.collector_id != user_id:
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json() or {}
    notes = data.get("notes")
    if not isinstance(notes, str):
        return jsonify({"error": "notes is required"}), 400

    notes = notes.strip()
    if not notes:
        return jsonify({"error": "notes is required"}), 400

    n = PickupNote(pickup_id=pickup.id, author_id=str(user_id), note=notes)

    try:
        db.session.add(n)
        db.session.commit()
        return jsonify({"message": "Notes saved", "pickup": pickup_to_dict(pickup)}), 200
    except Exception:
        db.session.rollback()
        logger.exception("Failed to save pickup notes")
        return jsonify({"error": "Failed to save notes"}), 500


@collector_bp.route("/pickups/today", methods=["GET"])
@jwt_required()
def get_todays_pickups():
    """Get today's pickups visible to the current collector.

    Rules:
    - Same visibility as /collector/pickups but restricted to today's scheduled_date.
    """
    user_id = get_jwt_identity()
    
    if not require_collector(user_id):
        return jsonify({"error": "Collector access required"}), 403
    
    today = datetime.utcnow().date()
    pickups = PickupRequest.query.filter(
        PickupRequest.scheduled_date == today,
        or_(
            PickupRequest.collector_id == user_id,
            and_(
                PickupRequest.collector_id.is_(None),
                PickupRequest.status == "REQUESTED",
            ),
        ),
    ).order_by(PickupRequest.created_at.asc()).all()
    
    return jsonify({
        "data": [pickup_to_dict(p) for p in pickups],
        "count": len(pickups)
    }), 200


@collector_bp.route("/pickups/completed", methods=["GET"])
@jwt_required()
def get_completed_pickups():
    """Get completed pickups for the current collector"""
    user_id = get_jwt_identity()
    
    if not require_collector(user_id):
        return jsonify({"error": "Collector access required"}), 403
    
    # Pickups that are COLLECTED or HANDED_TO_RECYCLER
    pickups = PickupRequest.query.filter(
        PickupRequest.collector_id == user_id,
        PickupRequest.status.in_(["COLLECTED", "HANDED_TO_RECYCLER", "RECYCLED"])
    ).order_by(PickupRequest.created_at.desc()).all()
    
    return jsonify({
        "data": [pickup_to_dict(p) for p in pickups],
        "count": len(pickups)
    }), 200


# ---------------- PICKUP ACTIONS ----------------

@collector_bp.route("/pickups/<pickup_id>/accept", methods=["POST"])
@jwt_required()
def accept_pickup(pickup_id):
    current_id = str(get_jwt_identity())

    pickup = PickupRequest.query.get_or_404(pickup_id)

    # Only allow accepting unassigned REQUESTED pickups
    if pickup.status != "REQUESTED" or pickup.collector_id:
        return {"error": "Pickup cannot be accepted"}, 400

    pickup.collector_id = current_id
    pickup.status = "ASSIGNED"

    try:
        db.session.commit()
        n = Notification(
            user_id=current_id,
            message=f"New pickup assigned at {pickup.address or 'address'}. Status: ASSIGNED",
            type="INFO",
        )
        db.session.add(n)
        if pickup.user_id:
            n_user = Notification(
                user_id=pickup.user_id,
                message="A collector has been assigned to your pickup.",
                type="INFO",
            )
            db.session.add(n_user)
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise

    # Transactional email: notify pickup owner about ASSIGNED status
    try:
        if pickup.user_id:
            user = User.query.get(pickup.user_id)
            if user and user.email:
                scheduled = str(pickup.scheduled_date) if pickup.scheduled_date else None
                subj, html, text = render_pickup_status_update(
                    user_name=user.name or "User",
                    pickup_id=pickup.id,
                    status="ASSIGNED",
                    address=pickup.address or "",
                    scheduled_date=scheduled,
                    time_slot=pickup.time_slot,
                    status_message="A collector has been assigned to your pickup and will arrive at your scheduled time.",
                )
                send_email(user.email, subj, html_body=html, text_body=text)
    except Exception as e:
        print(f"[MAIL] Assign status email failed: {e}")

    return {"message": "Pickup accepted"}, 200


@collector_bp.route("/pickups/<pickup_id>/start", methods=["PUT"])
@jwt_required()
def start_pickup(pickup_id):
    """Start pickup - change status from ASSIGNED to EN_ROUTE"""
    user_id = get_jwt_identity()
    
    if not require_collector(user_id):
        return jsonify({"error": "Collector access required"}), 403
    
    pickup = PickupRequest.query.get_or_404(pickup_id)
    
    if pickup.collector_id != user_id:
        return jsonify({"error": "Forbidden"}), 403
    
    if pickup.status != "ASSIGNED":
        return jsonify({"error": "Invalid transition. Pickup must be ASSIGNED"}), 400
    
    pickup.status = "EN_ROUTE"
    
    try:
        db.session.commit()
        return jsonify({"message": "Pickup started", "pickup": pickup_to_dict(pickup)}), 200
    except Exception as e:
        db.session.rollback()
        logger.exception("Failed to start pickup")
        return jsonify({"error": "Failed to update status"}), 500


@collector_bp.route("/pickups/<pickup_id>/collect", methods=["PUT"])
@jwt_required()
def mark_collected(pickup_id):
    """Mark pickup as collected - change status from EN_ROUTE to COLLECTED"""
    user_id = get_jwt_identity()
    
    if not require_collector(user_id):
        return jsonify({"error": "Collector access required"}), 403
    
    pickup = PickupRequest.query.get_or_404(pickup_id)
    
    if pickup.collector_id != user_id:
        return jsonify({"error": "Forbidden"}), 403
    
    if pickup.status != "EN_ROUTE":
        return jsonify({"error": "Invalid transition. Pickup must be EN_ROUTE"}), 400
    
    data = request.get_json() or {}
    
    pickup.status = "COLLECTED"
    # Store notes if provided (you might want to add a notes field to the model)
    
    try:
        db.session.commit()
        return jsonify({"message": "Pickup marked as collected", "pickup": pickup_to_dict(pickup)}), 200
    except Exception as e:
        db.session.rollback()
        logger.exception("Failed to mark pickup as collected")
        return jsonify({"error": "Failed to update status"}), 500


@collector_bp.route("/pickups/<pickup_id>/handover", methods=["PUT"])
@jwt_required()
def handover_to_recycler(pickup_id):
    """Hand pickup to recycler - change status from COLLECTED to HANDED_TO_RECYCLER"""
    user_id = get_jwt_identity()
    
    if not require_collector(user_id):
        return jsonify({"error": "Collector access required"}), 403
    
    pickup = PickupRequest.query.get_or_404(pickup_id)
    
    if pickup.collector_id != user_id:
        return jsonify({"error": "Forbidden"}), 403
    
    if pickup.status != "COLLECTED":
        return jsonify({"error": "Invalid transition. Pickup must be COLLECTED"}), 400
    
    data = request.get_json() or {}
    recycler_id = data.get("recyclerId")
    
    if not recycler_id:
        return jsonify({"error": "recyclerId is required"}), 400
    
    # Verify recycler exists
    recycler = User.query.get(recycler_id)
    if not recycler or recycler.role != "RECYCLER":
        return jsonify({"error": "Invalid recycler"}), 400
    
    pickup.status = "HANDED_TO_RECYCLER"
    pickup.recycler_id = recycler_id
    
    try:
        db.session.commit()
        # Notify recycler: upcoming/incoming batch to process (shows in bell + Incoming list)
        n = Notification(
            user_id=recycler_id,
            message=f"Upcoming: New batch (Pickup #{pickup.id[:8]}) handed to you for processing. Check Incoming to receive & verify.",
            type="INFO",
        )
        db.session.add(n)
        db.session.commit()
        return jsonify({"message": "Pickup handed to recycler", "pickup": pickup_to_dict(pickup)}), 200
    except Exception as e:
        db.session.rollback()
        logger.exception("Failed to handover pickup")
        return jsonify({"error": "Failed to update status"}), 500


# ---------------- STATS ----------------

@collector_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_stats():
    """Get performance stats for the current collector"""
    user_id = get_jwt_identity()
    
    if not require_collector(user_id):
        return jsonify({"error": "Collector access required"}), 403
    
    try:
        # Total pickups
        total_pickups = db.session.query(
            func.count(PickupRequest.id)
        ).filter(PickupRequest.collector_id == user_id).scalar()
        
        # Completed this week
        week_ago = datetime.utcnow() - timedelta(days=7)
        completed_this_week = db.session.query(
            func.count(PickupRequest.id)
        ).filter(
            PickupRequest.collector_id == user_id,
            PickupRequest.status.in_(["COLLECTED", "HANDED_TO_RECYCLER", "RECYCLED"]),
            PickupRequest.created_at >= week_ago
        ).scalar()
        
        # Completed this month
        month_ago = datetime.utcnow() - timedelta(days=30)
        completed_this_month = db.session.query(
            func.count(PickupRequest.id)
        ).filter(
            PickupRequest.collector_id == user_id,
            PickupRequest.status.in_(["COLLECTED", "HANDED_TO_RECYCLER", "RECYCLED"]),
            PickupRequest.created_at >= month_ago
        ).scalar()
        
        # Total weight collected
        total_weight = db.session.query(
            func.coalesce(func.sum(PickupRequest.total_weight), 0)
        ).filter(
            PickupRequest.collector_id == user_id,
            PickupRequest.status.in_(["COLLECTED", "HANDED_TO_RECYCLER", "RECYCLED"])
        ).scalar()
        
        # Average rating (placeholder - you'd need a feedback/rating model)
        average_rating = 4.5  # TODO: Calculate from feedback model
        
        # On-time rate (placeholder - would need scheduled vs actual time)
        on_time_rate = 90.0  # TODO: Calculate based on scheduled vs actual
        
        return jsonify({
            "totalPickups": int(total_pickups or 0),
            "completedThisWeek": int(completed_this_week or 0),
            "completedThisMonth": int(completed_this_month or 0),
            "averageRating": float(average_rating),
            "totalWeight": float(total_weight or 0),
            "onTimeRate": float(on_time_rate)
        }), 200
        
    except Exception as e:
        logger.exception("Stats error")
        db.session.rollback()
        return jsonify({
            "totalPickups": 0,
            "completedThisWeek": 0,
            "completedThisMonth": 0,
            "averageRating": 0,
            "totalWeight": 0,
            "onTimeRate": 0
        }), 200


# ---------------- NOTIFICATIONS ----------------

@collector_bp.route("/notifications", methods=["GET"])
@jwt_required()
def get_notifications():
    """Get notifications for the current collector from Notification model"""
    user_id = get_jwt_identity()
    
    if not require_collector(user_id):
        return jsonify({"error": "Collector access required"}), 403
    
    notifs = Notification.query.filter_by(user_id=user_id).order_by(
        Notification.created_at.desc()
    ).limit(50).all()
    
    data = [
        {
            "id": n.id,
            "title": "Notification",
            "message": n.message,
            "type": "assignment" if "pickup" in (n.message or "").lower() else "status",
            "isRead": n.is_read,
            "createdAt": n.created_at.isoformat() if n.created_at else None,
        }
        for n in notifs
    ]
    
    return jsonify({"data": data}), 200


@collector_bp.route("/notifications/<notif_id>/read", methods=["PATCH"])
@jwt_required()
def mark_collector_notification_read(notif_id):
    """Mark notification as read - only for current collector's notifications"""
    user_id = get_jwt_identity()
    if not require_collector(user_id):
        return jsonify({"error": "Collector access required"}), 403
    notif = Notification.query.filter_by(id=notif_id, user_id=user_id).first_or_404()
    notif.is_read = True
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Failed to update notification"}), 500
    return jsonify({"success": True}), 200


@collector_bp.route("/notifications/<notif_id>", methods=["DELETE"])
@jwt_required()
def delete_collector_notification(notif_id):
    """Delete notification - only for current collector's notifications"""
    user_id = get_jwt_identity()
    if not require_collector(user_id):
        return jsonify({"error": "Collector access required"}), 403
    notif = Notification.query.filter_by(id=notif_id, user_id=user_id).first_or_404()
    try:
        db.session.delete(notif)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Failed to delete notification"}), 500
    return jsonify({"success": True}), 200


# ---------------- AVAILABLE COLLECTORS ----------------
@collector_bp.route("/available", methods=["GET", "OPTIONS"])
@jwt_required(optional=True)
def get_available_collectors():

    # Handle CORS preflight
    if request.method == "OPTIONS":
        return jsonify({"ok": True}), 200

    try:
        collectors = User.query.filter_by(role="COLLECTOR").all()

        data = [
            {
                "id": c.id,
                "name": c.name,
                "email": c.email,
            }
            for c in collectors
        ]

        return jsonify({"collectors": data}), 200

    except Exception as e:
        print(f"[COLLECTOR ROUTE ERROR] {e}")
        return jsonify({"error": "Failed to fetch collectors"}), 500
