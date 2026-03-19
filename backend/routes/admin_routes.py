from flask import Blueprint, jsonify, current_app, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from models.user import User
from models.collector import CollectorProfile
from models.recycler import RecyclerProfile
from models.pickup import PickupRequest
from models.certificate import RecyclingCertificate
from models.item import EWasteItem
from models.notification import Notification
from models.password_reset import PasswordResetToken
from models.feedback import Feedback
from extensions import db
from utils.email_sender import send_email
from utils.email_templates import render_approval_decision

admin_bp = Blueprint("admin", __name__)

# Device category → Material type mapping for E-Waste by Category chart
DEVICE_TO_MATERIAL = {
    "TV": "E-Waste",
    "LAPTOP": "E-Waste",
    "COMPUTER": "E-Waste",
    "MONITOR": "E-Waste",
    "MOBILE": "E-Waste",
    "TABLET": "E-Waste",
    "PRINTER": "E-Waste",
    "CABLE": "E-Waste",
    "BATTERY": "E-Waste",
    "REFRIGERATOR": "Metal",
    "WASHING_MACHINE": "Metal",
    "AC": "Metal",
    "MICROWAVE": "Plastic",
    "OTHER": "Others",
}


def require_admin(user_id):
    user = User.query.get(user_id)
    return user and user.role == "ADMIN"


@admin_bp.route("/pending", methods=["GET"])
@jwt_required()
def get_pending_accounts():
    admin_id = get_jwt_identity()

    if not require_admin(admin_id):
        return {"error": "Admin access required"}, 403

    pending_collectors = CollectorProfile.query.filter_by(approval_status="PENDING").all()
    pending_recyclers = RecyclerProfile.query.filter_by(approval_status="PENDING").all()

    collectors_data = []
    for profile in pending_collectors:
        user = User.query.get(profile.user_id)
        if user:
            collectors_data.append({
                "id": profile.id,
                "user_id": user.id,
                "name": user.name,
                "email": user.email,
                "phone": user.phone,
                "address": user.address,
                "vehicle_type": profile.vehicle_type,
                "license_number": profile.license_number,
                "approval_status": profile.approval_status,
                "created_at": user.created_at.isoformat() if user.created_at else None,
                "role": "COLLECTOR"
            })

    recyclers_data = []
    for profile in pending_recyclers:
        user = User.query.get(profile.user_id)
        if user:
            recyclers_data.append({
                "id": profile.id,
                "user_id": user.id,
                "name": user.name,
                "email": user.email,
                "phone": user.phone,
                "address": user.address,
                "facility_name": profile.facility_name,
                "certification": profile.certification,
                "approval_status": profile.approval_status,
                "created_at": user.created_at.isoformat() if user.created_at else None,
                "role": "RECYCLER"
            })

    return {
        "collectors": collectors_data,
        "recyclers": recyclers_data,
        "total": len(collectors_data) + len(recyclers_data)
    }, 200


@admin_bp.route("/approve/collector/<user_id>", methods=["PATCH"])
@jwt_required()
def approve_collector(user_id):
    admin_id = get_jwt_identity()

    if not require_admin(admin_id):
        return {"error": "Admin access required"}, 403

    profile = CollectorProfile.query.filter_by(user_id=user_id).first_or_404()

    profile.approval_status = "APPROVED"
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return {"error": "Failed to approve"}, 500

    user = User.query.get(user_id)
    if user and user.email:
        frontend_url = (current_app.config.get("FRONTEND_URL") or "").rstrip("/")
        login_url = f"{frontend_url}/login" if frontend_url else ""
        subj, html, text = render_approval_decision(
            user_name=user.name or "User",
            approved=True,
            role_label="Collector",
            login_url=login_url,
        )
        send_email(user.email, subj, html_body=html, text_body=text)

    return {"message": "Collector approved"}, 200


@admin_bp.route("/approve/recycler/<user_id>", methods=["PATCH"])
@jwt_required()
def approve_recycler(user_id):
    admin_id = get_jwt_identity()

    if not require_admin(admin_id):
        return {"error": "Admin access required"}, 403

    profile = RecyclerProfile.query.filter_by(user_id=user_id).first_or_404()

    profile.approval_status = "APPROVED"
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return {"error": "Failed to approve"}, 500

    user = User.query.get(user_id)
    if user and user.email:
        frontend_url = (current_app.config.get("FRONTEND_URL") or "").rstrip("/")
        login_url = f"{frontend_url}/login" if frontend_url else ""
        subj, html, text = render_approval_decision(
            user_name=user.name or "User",
            approved=True,
            role_label="Recycler",
            login_url=login_url,
        )
        send_email(user.email, subj, html_body=html, text_body=text)

    return {"message": "Recycler approved"}, 200


@admin_bp.route("/reject/collector/<user_id>", methods=["PATCH"])
@jwt_required()
def reject_collector(user_id):
    admin_id = get_jwt_identity()

    if not require_admin(admin_id):
        return {"error": "Admin access required"}, 403

    profile = CollectorProfile.query.filter_by(user_id=user_id).first_or_404()

    profile.approval_status = "REJECTED"
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return {"error": "Failed to reject"}, 500

    user = User.query.get(user_id)
    if user and user.email:
        frontend_url = (current_app.config.get("FRONTEND_URL") or "").rstrip("/")
        login_url = f"{frontend_url}/login" if frontend_url else ""
        subj, html, text = render_approval_decision(
            user_name=user.name or "User",
            approved=False,
            role_label="Collector",
            login_url=login_url,
        )
        send_email(user.email, subj, html_body=html, text_body=text)

    return {"message": "Collector rejected"}, 200


@admin_bp.route("/reject/recycler/<user_id>", methods=["PATCH"])
@jwt_required()
def reject_recycler(user_id):
    admin_id = get_jwt_identity()

    if not require_admin(admin_id):
        return {"error": "Admin access required"}, 403

    profile = RecyclerProfile.query.filter_by(user_id=user_id).first_or_404()

    profile.approval_status = "REJECTED"
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return {"error": "Failed to reject"}, 500

    user = User.query.get(user_id)
    if user and user.email:
        frontend_url = (current_app.config.get("FRONTEND_URL") or "").rstrip("/")
        login_url = f"{frontend_url}/login" if frontend_url else ""
        subj, html, text = render_approval_decision(
            user_name=user.name or "User",
            approved=False,
            role_label="Recycler",
            login_url=login_url,
        )
        send_email(user.email, subj, html_body=html, text_body=text)

    return {"message": "Recycler rejected"}, 200


@admin_bp.route("/dashboard", methods=["GET"])
@jwt_required()
def get_dashboard_stats():
    """Get aggregated dashboard statistics - ADMIN only"""
    admin_id = get_jwt_identity()

    if not require_admin(admin_id):
        return {"error": "Admin access required"}, 403

    try:
        # Efficient COUNT queries only
        total_users = db.session.query(func.count(User.id)).filter(
            User.role == "USER"
        ).scalar() or 0

        total_collectors = db.session.query(func.count(User.id)).filter(
            User.role == "COLLECTOR"
        ).scalar() or 0

        total_recyclers = db.session.query(func.count(User.id)).filter(
            User.role == "RECYCLER"
        ).scalar() or 0

        pending_pickups = db.session.query(func.count(PickupRequest.id)).filter(
            PickupRequest.status == "REQUESTED"
        ).scalar() or 0

        unassigned_pickups = db.session.query(func.count(PickupRequest.id)).filter(
            PickupRequest.status == "REQUESTED",
            PickupRequest.collector_id.is_(None)
        ).scalar() or 0

        # Active statuses: ASSIGNED, EN_ROUTE, COLLECTED, HANDED_TO_RECYCLER, PROCESSING
        active_pickups = db.session.query(func.count(PickupRequest.id)).filter(
            PickupRequest.status.in_([
                "ASSIGNED", "EN_ROUTE", "COLLECTED", 
                "HANDED_TO_RECYCLER", "PROCESSING"
            ])
        ).scalar() or 0

        completed_pickups = db.session.query(func.count(PickupRequest.id)).filter(
            PickupRequest.status == "RECYCLED"
        ).scalar() or 0

        total_certificates = db.session.query(func.count(RecyclingCertificate.id)).scalar() or 0

        return jsonify({
            "users": int(total_users),
            "collectors": int(total_collectors),
            "recyclers": int(total_recyclers),
            "pending_pickups": int(pending_pickups),
            "unassigned_pickups": int(unassigned_pickups),
            "active_pickups": int(active_pickups),
            "completed_pickups": int(completed_pickups),
            "certificates": int(total_certificates)
        }), 200

    except Exception as e:
        print(f"Dashboard stats error: {str(e)}")
        return jsonify({"error": "Failed to fetch dashboard stats"}), 500


@admin_bp.route("/pickups", methods=["GET"])
@jwt_required()
def get_admin_pickups():
    """Get all pickups for admin pickup management - ADMIN only. Returns full list for assign/filter."""
    admin_id = get_jwt_identity()
    if not require_admin(admin_id):
        return jsonify({"error": "Admin access required"}), 403

    try:
        from routes.pickup_routes import serialize_pickup
        pickups = PickupRequest.query.order_by(PickupRequest.created_at.desc()).all()
        out = []
        for p in pickups:
            row = serialize_pickup(p, include_collector=True, include_recycler=True)
            user = User.query.get(p.user_id) if p.user_id else None
            row["userName"] = user.name if user else "Unknown"
            row["userPhone"] = getattr(user, "phone", None) or ""
            row["userId"] = str(p.user_id) if p.user_id else None
            out.append(row)
        return jsonify(out), 200
    except Exception as e:
        print(f"Admin pickups list error: {str(e)}")
        return jsonify({"error": "Failed to fetch pickups"}), 500


@admin_bp.route("/pickups/live", methods=["GET"])
@jwt_required()
def get_live_pickups():
    """Get active pickups for admin operations control panel - ADMIN only"""
    admin_id = get_jwt_identity()

    if not require_admin(admin_id):
        return {"error": "Admin access required"}, 403

    try:
        # Active statuses: REQUESTED, ASSIGNED, EN_ROUTE, COLLECTED, HANDED_TO_RECYCLER, PROCESSING
        active_statuses = [
            "REQUESTED",
            "ASSIGNED",
            "EN_ROUTE",
            "COLLECTED",
            "HANDED_TO_RECYCLER",
            "PROCESSING"
        ]

        pickups = PickupRequest.query.filter(
            PickupRequest.status.in_(active_statuses)
        ).order_by(PickupRequest.created_at.desc()).all()

        pickups_data = []

        for pickup in pickups:
            # Get user name
            user = User.query.get(pickup.user_id) if pickup.user_id else None
            user_name = user.name if user else "Unknown"

            # Get collector name if assigned
            collector_name = None
            if pickup.collector_id:
                collector = User.query.get(pickup.collector_id)
                collector_name = collector.name if collector else None

            # Get primary device type from first item
            device_type = "Unknown"
            if pickup.items and len(pickup.items) > 0:
                device_type = pickup.items[0].category or "Unknown"

            pickups_data.append({
                "id": pickup.id,
                "user_name": user_name,
                "device_type": device_type,
                "status": pickup.status,
                "address": pickup.address or "",
                "collector_name": collector_name,
                "created_at": pickup.created_at.isoformat() if pickup.created_at else None
            })

        return jsonify(pickups_data), 200

    except Exception as e:
        print(f"Live pickups error: {str(e)}")
        return jsonify({"error": "Failed to fetch live pickups"}), 500


@admin_bp.route("/pickups/<pickup_id>/assign", methods=["PATCH"])
@jwt_required()
def assign_collector_to_pickup(pickup_id):
    """Admin assigns or reassigns a collector to a pickup. Sets status to ASSIGNED and notifies user + collector."""
    admin_id = get_jwt_identity()
    if not require_admin(admin_id):
        return jsonify({"error": "Admin access required"}), 403

    data = request.get_json(silent=True) or {}
    collector_id = data.get("collector_id") or data.get("collectorId")
    if not collector_id:
        return jsonify({"error": "collector_id required"}), 400

    pickup = PickupRequest.query.get_or_404(pickup_id)
    collector_user = User.query.get(collector_id)
    if not collector_user or collector_user.role != "COLLECTOR":
        return jsonify({"error": "Invalid collector"}), 400

    pickup.collector_id = str(collector_id)
    pickup.status = "ASSIGNED"

    try:
        db.session.commit()
        # Notify pickup owner
        if pickup.user_id:
            n_user = Notification(
                user_id=pickup.user_id,
                message="A collector has been assigned to your pickup.",
                type="INFO",
            )
            db.session.add(n_user)
        # Notify collector
        n_collector = Notification(
            user_id=collector_id,
            message=f"New pickup assigned at {pickup.address or 'address'}. Status: ASSIGNED",
            type="INFO",
        )
        db.session.add(n_collector)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Failed to assign collector"}), 500

    return jsonify({"message": "Collector assigned", "pickup_id": pickup_id}), 200


# ------------------
# Additional admin endpoints
# ------------------

@admin_bp.route("/users", methods=["GET"])
@jwt_required()
def get_all_users():
    """List all users for admin user management."""
    admin_id = get_jwt_identity()
    if not require_admin(admin_id):
        return {"error": "Admin access required"}, 403

    users = User.query.all()
    users_data = []
    for u in users:
        approval_status = None
        if u.role == "COLLECTOR":
            profile = CollectorProfile.query.filter_by(user_id=u.id).first()
            if profile:
                approval_status = profile.approval_status
        elif u.role == "RECYCLER":
            profile = RecyclerProfile.query.filter_by(user_id=u.id).first()
            if profile:
                approval_status = profile.approval_status

        users_data.append(
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "role": u.role,
                "isActive": bool(u.is_active),
                "approvalStatus": approval_status,
                "createdAt": u.created_at.isoformat() if u.created_at else None,
            }
        )
    return jsonify(users_data), 200


@admin_bp.route("/users/<user_id>/suspend", methods=["PATCH"])
@jwt_required()
def suspend_user(user_id):
    """Suspend a user account (set is_active = False)."""
    admin_id = get_jwt_identity()
    if not require_admin(admin_id):
        return {"error": "Admin access required"}, 403

    user = User.query.get_or_404(user_id)
    if user.role == "ADMIN":
        return {"error": "Cannot suspend an admin account"}, 400

    user.is_active = False
    try:
        db.session.commit()
        return {"message": "User suspended", "id": user.id, "isActive": user.is_active}, 200
    except Exception:
        db.session.rollback()
        return {"error": "Failed to suspend user"}, 500


@admin_bp.route("/users/<user_id>/activate", methods=["PATCH"])
@jwt_required()
def activate_user(user_id):
    """Activate a user account (set is_active = True)."""
    admin_id = get_jwt_identity()
    if not require_admin(admin_id):
        return {"error": "Admin access required"}, 403

    user = User.query.get_or_404(user_id)
    user.is_active = True
    try:
        db.session.commit()
        return {"message": "User activated", "id": user.id, "isActive": user.is_active}, 200
    except Exception:
        db.session.rollback()
        return {"error": "Failed to activate user"}, 500


@admin_bp.route("/users/<user_id>", methods=["DELETE"])
@jwt_required()
def delete_user(user_id):
    """Delete a user and their related data."""
    admin_id = get_jwt_identity()
    if not require_admin(admin_id):
        return {"error": "Admin access required"}, 403

    user = User.query.get_or_404(user_id)
    if user.role == "ADMIN":
        return {"error": "Cannot delete an admin account"}, 400

    try:
        # Collect all pickups where this user is involved
        pickups = PickupRequest.query.filter(
            (PickupRequest.user_id == user_id)
            | (PickupRequest.collector_id == user_id)
            | (PickupRequest.recycler_id == user_id)
        ).all()
        pickup_ids = [p.id for p in pickups]

        # Delete feedback linked to this user or their pickups
        Feedback.query.filter_by(user_id=user_id).delete(synchronize_session=False)
        if pickup_ids:
            Feedback.query.filter(Feedback.pickup_id.in_(pickup_ids)).delete(
                synchronize_session=False
            )

        # Delete notifications and password reset tokens
        Notification.query.filter_by(user_id=user_id).delete(synchronize_session=False)
        PasswordResetToken.query.filter_by(user_id=user_id).delete(
            synchronize_session=False
        )

        # Delete collector/recycler profiles if present
        CollectorProfile.query.filter_by(user_id=user_id).delete(
            synchronize_session=False
        )
        RecyclerProfile.query.filter_by(user_id=user_id).delete(
            synchronize_session=False
        )

        # Delete certificates involving this user
        RecyclingCertificate.query.filter(
            (RecyclingCertificate.user_id == user_id)
            | (RecyclingCertificate.recycler_id == user_id)
        ).delete(synchronize_session=False)

        # Delete pickups (will cascade to EWasteItem via relationship)
        for p in pickups:
            db.session.delete(p)

        # Finally delete the user
        db.session.delete(user)

        db.session.commit()
        return {"message": "User and related data deleted", "id": user_id}, 200
    except Exception as e:
        print(f"[ADMIN] Failed to delete user {user_id}: {e}")
        db.session.rollback()
        return {"error": "Failed to delete user"}, 500


@admin_bp.route("/notifications", methods=["GET"])
@jwt_required()
def get_admin_notifications():
    admin_id = get_jwt_identity()
    if not require_admin(admin_id):
        return {"error": "Admin access required"}, 403

    notifs = Notification.query.order_by(Notification.created_at.desc()).all()
    data = []
    for n in notifs:
        data.append({
            "id": n.id,
            "message": n.message,
            "type": n.type.lower(),
            "read": n.is_read,
            "isRead": n.is_read,
            "timestamp": n.created_at.isoformat() if n.created_at else None,
        })
    return jsonify(data), 200


@admin_bp.route("/notifications/<notif_id>/read", methods=["PATCH"])
@jwt_required()
def mark_admin_notification_read(notif_id):
    admin_id = get_jwt_identity()
    if not require_admin(admin_id):
        return {"error": "Admin access required"}, 403

    notif = Notification.query.get_or_404(notif_id)
    notif.is_read = True
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return {"error": "Failed to update notification"}, 500
    return {"success": True}, 200


@admin_bp.route("/reports", methods=["GET"])
@jwt_required()
def get_admin_reports():
    """Get reports and analytics data - ADMIN only"""
    from datetime import datetime, timedelta

    admin_id = get_jwt_identity()
    if not require_admin(admin_id):
        return {"error": "Admin access required"}, 403

    try:
        total_pickups = db.session.query(func.count(PickupRequest.id)).scalar() or 0
        total_weight = db.session.query(func.coalesce(func.sum(PickupRequest.total_weight), 0)).filter(
            PickupRequest.status == "RECYCLED"
        ).scalar() or 0
        active_users = db.session.query(func.count(User.id)).filter(
            User.role.in_(["USER", "COLLECTOR", "RECYCLER"])
        ).scalar() or 0

        # Real weekly pickups: completed (RECYCLED) in last 7 days, grouped by weekday
        week_ago = datetime.utcnow() - timedelta(days=7)
        completed = PickupRequest.query.filter(
            PickupRequest.status == "RECYCLED",
            PickupRequest.created_at >= week_ago
        ).all()
        days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        weekly_counts = [0] * 7
        for p in completed:
            if p.created_at:
                weekday = p.created_at.weekday()  # Mon=0, Sun=6
                weekly_counts[weekday] += 1
        weekly = [{"day": days[i], "name": days[i], "pickups": weekly_counts[i], "weight": 0} for i in range(7)]

        # Real category data: aggregate by material type (E-Waste, Plastic, Metal, Others)
        cat_rows = (
            db.session.query(EWasteItem.category, func.coalesce(func.sum(EWasteItem.quantity), 0).label("qty"))
            .join(PickupRequest, EWasteItem.pickup_id == PickupRequest.id)
            .filter(PickupRequest.status == "RECYCLED")
            .group_by(EWasteItem.category)
            .all()
        )
        material_totals = {"E-Waste": 0, "Plastic": 0, "Metal": 0, "Others": 0}
        for r in cat_rows:
            device_cat = (r.category or "OTHER").strip().upper()
            material = DEVICE_TO_MATERIAL.get(device_cat, "Others")
            material_totals[material] = material_totals.get(material, 0) + int(r.qty or 0)
        total_qty = sum(material_totals.values())
        category_data = []
        for name, qty in material_totals.items():
            if qty > 0:
                pct = round(qty / total_qty * 100) if total_qty else 0
                category_data.append({"name": name, "value": pct})

        collector_performance = []
        for profile in CollectorProfile.query.filter_by(approval_status="APPROVED").all():
            user = User.query.get(profile.user_id)
            if user:
                pickups_count = db.session.query(func.count(PickupRequest.id)).filter(
                    PickupRequest.collector_id == user.id,
                    PickupRequest.status == "RECYCLED"
                ).scalar() or 0
                collector_performance.append({
                    "name": user.name,
                    "pickups": int(pickups_count),
                    "weight": f"{pickups_count * 5}",
                    "rating": 4.5
                })

        months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
        monthly_trend = [{"month": m, "collected": 0, "recycled": 0} for m in months]

        return jsonify({
            "summary": {
                "total_pickups": int(total_pickups),
                "total_weight": float(total_weight),
                "co2_saved": float(total_weight) * 2.5,
                "active_users": int(active_users)
            },
            "weeklyPickups": weekly,
            "categoryData": category_data,
            "monthlyTrend": monthly_trend,
            "collector_performance": collector_performance
        }), 200
    except Exception as e:
        print(f"Reports error: {str(e)}")
        return jsonify({"error": "Failed to fetch reports"}), 500


@admin_bp.route("/notifications/<notif_id>", methods=["DELETE"])
@jwt_required()
def delete_admin_notification(notif_id):
    admin_id = get_jwt_identity()
    if not require_admin(admin_id):
        return {"error": "Admin access required"}, 403

    notif = Notification.query.get_or_404(notif_id)
    try:
        db.session.delete(notif)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return {"error": "Failed to delete notification"}, 500
    return {"success": True}, 200
