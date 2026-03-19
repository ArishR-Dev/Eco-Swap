from flask import Blueprint, request, jsonify
from extensions import db
from models.pickup import PickupRequest
from models.item import EWasteItem
from models.user import User
from models.feedback import Feedback
from models.notification import Notification
from flask_jwt_extended import jwt_required, get_jwt_identity

from utils.email_sender import send_email
from utils.email_templates import (
    render_pickup_confirmation,
    render_pickup_status_update,
)

pickup_bp = Blueprint("pickups", __name__)


def serialize_pickup(pickup, include_collector=True, include_recycler=False):
    """
    Serialize PickupRequest to JSON format with items and total_weight.
    Ensures items array and total_weight are always included.
    """
    # Get items using relationship if available, otherwise query
    # Check if relationship exists (even if empty list)
    if hasattr(pickup, 'items'):
        items_list = list(pickup.items)  # Convert to list to ensure it's iterable
    else:
        # Fallback: query items if relationship not loaded
        items_list = EWasteItem.query.filter_by(pickup_id=pickup.id).all()
    
    # Calculate total_weight: use stored value or calculate from items
    total_weight = float(pickup.total_weight or 0)
    if not total_weight and items_list:
        total_weight = sum(
            float(item.estimated_weight or 0) * int(item.quantity or 1)
            for item in items_list
        )
    
    # Serialize items
    items_serialized = [
        {
            "id": item.id,
            "category": item.category or "",
            "quantity": int(item.quantity or 1),
            "estimatedWeight": float(item.estimated_weight or 0),
            "description": getattr(item, 'description', None) or None
        }
        for item in items_list
    ]
    
    # Base pickup data
    pickup_dict = {
        "id": pickup.id,
        "status": pickup.status or "REQUESTED",
        "address": pickup.address or "",
        "scheduledDate": str(pickup.scheduled_date) if pickup.scheduled_date else None,
        "scheduledTimeSlot": pickup.time_slot or "",
        "totalWeight": total_weight,  # Always include, even if 0
        "priority": pickup.priority or "NORMAL",
        "items": items_serialized,  # Always include array, even if empty
        "createdAt": str(pickup.created_at) if pickup.created_at else None,
        "latitude": float(pickup.latitude) if getattr(pickup, "latitude", None) is not None else None,
        "longitude": float(pickup.longitude) if getattr(pickup, "longitude", None) is not None else None,
    }
    
    # Add collector info if requested
    if include_collector and pickup.collector_id:
        collector = User.query.get(pickup.collector_id)
        if collector:
            pickup_dict["collectorId"] = pickup.collector_id
            pickup_dict["collectorName"] = collector.name
    
    # Add recycler info if requested
    if include_recycler and pickup.recycler_id:
        recycler = User.query.get(pickup.recycler_id)
        if recycler:
            pickup_dict["recyclerId"] = pickup.recycler_id
            pickup_dict["recyclerName"] = recycler.name
    
    return pickup_dict


def _safe_create_notification(user_id: str, message: str, type_: str = "INFO") -> None:
    """
    Helper to create notifications without impacting primary business logic.
    Failures are swallowed to keep existing flows working.
    """
    try:
        notification = Notification(user_id=user_id, message=message, type=type_)
        db.session.add(notification)
        db.session.commit()
    except Exception:
        db.session.rollback()

# ======================
# CREATE PICKUP (USER)
# ======================
@pickup_bp.route("", methods=["POST"])
@jwt_required()
def create_pickup():
    user_id = str(get_jwt_identity())
    data = request.get_json() or {}

    if not (data.get("address") or "").strip():
        return jsonify({"error": "Address is required"}), 400
    if not data.get("scheduled_date"):
        return jsonify({"error": "Scheduled date is required"}), 400

    # Calculate total weight from items if provided, otherwise use weight/total_weight field
    total_weight = 0
    if data.get("items") and isinstance(data.get("items"), list):
        # Calculate from items array
        for item in data.get("items", []):
            item_weight = float(item.get("estimated_weight") or item.get("weight") or 0)
            quantity = int(item.get("quantity") or 1)
            total_weight += item_weight * quantity
    else:
        # Use weight field if provided
        total_weight = float(data.get("weight") or data.get("total_weight") or 0)

    latitude = data.get("latitude")
    longitude = data.get("longitude")

    pickup = PickupRequest(
        user_id=user_id,
        address=data.get("address"),
        scheduled_date=data.get("scheduled_date"),
        time_slot=data.get("time_slot"),
        priority=data.get("priority", "NORMAL"),
        total_weight=total_weight if total_weight > 0 else None,
        latitude=float(latitude) if latitude is not None else None,
        longitude=float(longitude) if longitude is not None else None,
    )

    db.session.add(pickup)
    db.session.flush()  # Flush to get pickup.id before adding items

    # Add items if provided
    if data.get("items") and isinstance(data.get("items"), list):
        for item_data in data.get("items", []):
            category = item_data.get("category")
            if not category:
                continue
            item = EWasteItem(
                pickup_id=pickup.id,
                category=category,
                quantity=int(item_data.get("quantity") or 1),
                estimated_weight=float(item_data.get("estimated_weight") or item_data.get("weight") or 0),
            )
            db.session.add(item)

    db.session.commit()

    # Fire-and-forget notification for user
    _safe_create_notification(
        user_id,
        f"Pickup request {pickup.id} created successfully.",
        type_="SUCCESS",
    )

    # Transactional email: pickup confirmation
    try:
        user = User.query.get(user_id)
        if user and user.email:
            scheduled = str(pickup.scheduled_date) if pickup.scheduled_date else None
            total = pickup.total_weight
            if total is None and pickup.items:
                total = sum(
                    float(item.estimated_weight or 0) * int(item.quantity or 1)
                    for item in pickup.items
                )
            subj, html, text = render_pickup_confirmation(
                user_name=user.name or "User",
                pickup_id=pickup.id,
                address=pickup.address or "",
                scheduled_date=scheduled or "—",
                time_slot=pickup.time_slot,
                total_weight=total,
            )
            send_email(user.email, subj, html_body=html, text_body=text)
    except Exception as e:
        print(f"[MAIL] Pickup confirmation failed: {e}")

    return {
        "message": "Pickup created",
        "pickup_id": pickup.id
    }, 201


# ======================
# GET MY PICKUPS (USER)
# ======================
@pickup_bp.route("", methods=["GET"])
@jwt_required()
def my_pickups():
    user_id = str(get_jwt_identity())

    pickups = PickupRequest.query.filter_by(user_id=user_id).all()
    
    # Use serializer to ensure items and total_weight are included
    result = [serialize_pickup(p, include_collector=True, include_recycler=False) for p in pickups]
    
    return jsonify(result), 200


# ======================
# GET PICKUP BY ID
# ======================
@pickup_bp.route("/<pickup_id>", methods=["GET"])
@jwt_required()
def get_pickup_by_id(pickup_id):
    current_id = str(get_jwt_identity())

    pickup = PickupRequest.query.get(pickup_id)

    if not pickup:
        return jsonify({"error": "Pickup not found"}), 404

    user = User.query.get(current_id)

    allowed = False

    # Owner
    if pickup.user_id == current_id:
        allowed = True

    # Assigned collector
    if pickup.collector_id == current_id:
        allowed = True

    # Collector can view unassigned requested pickups
    if user and user.role == "COLLECTOR" and pickup.status == "REQUESTED":
        allowed = True

    # Admin override
    if user and user.role == "ADMIN":
        allowed = True

    if not allowed:
        return jsonify({"error": "Forbidden"}), 403

    pickup_dict = serialize_pickup(
        pickup,
        include_collector=True,
        include_recycler=True
    )

    return jsonify(pickup_dict), 200
    
# ======================
# ADD ITEMS TO PICKUP
# ======================
@pickup_bp.route("/<pickup_id>/items", methods=["POST"])
@jwt_required()
def add_items(pickup_id):
    data = request.get_json() or {}
    current_id = str(get_jwt_identity())

    pickup = PickupRequest.query.get_or_404(pickup_id)
    if pickup.user_id != current_id:
        return {"error": "Forbidden"}, 403

    for item in data.get("items", []):
        category = item.get("category")
        if not category:
            continue
        db.session.add(EWasteItem(
            pickup_id=pickup_id,
            category=category,
            quantity=item.get("quantity", 1),
            estimated_weight=item.get("estimated_weight", 0)
        ))

    db.session.commit()

    return {"message": "Items added"}, 201


# ======================
# UPDATE STATUS (COLLECTOR)
# ======================
@pickup_bp.route("/<pickup_id>/status", methods=["PATCH"])
@jwt_required()
def update_status(pickup_id):
    data = request.get_json() or {}
    current_id = str(get_jwt_identity())

    pickup = PickupRequest.query.get_or_404(pickup_id)
    if pickup.collector_id != current_id:
        user = User.query.get(current_id)
        if not user or user.role != "ADMIN":
            return {"error": "Forbidden"}, 403
    pickup.status = data.get("status")

    db.session.commit()

    # Notify owner about status change (in-app + transactional email)
    if pickup.user_id:
        _safe_create_notification(
            pickup.user_id,
            f"Pickup {pickup.id} status updated to {pickup.status}.",
            type_="INFO",
        )
        try:
            user = User.query.get(pickup.user_id)
            if user and user.email:
                scheduled = str(pickup.scheduled_date) if pickup.scheduled_date else None
                subj, html, text = render_pickup_status_update(
                    user_name=user.name or "User",
                    pickup_id=pickup.id,
                    status=pickup.status,
                    address=pickup.address or "",
                    scheduled_date=scheduled,
                    time_slot=pickup.time_slot,
                    status_message=f"Your pickup has been updated to {pickup.status}.",
                )
                send_email(user.email, subj, html_body=html, text_body=text)
        except Exception as e:
            print(f"[MAIL] Status update email failed: {e}")

    return {"message": "Status updated"}, 200


# ======================
# CANCEL PICKUP (USER)
# ======================
@pickup_bp.route("/<pickup_id>/cancel", methods=["PUT"])
@jwt_required()
def cancel_pickup(pickup_id):
    """
    PUT /api/pickups/<pickup_id>/cancel
    Cancel a pickup request (only owner can cancel).
    """
    user_id = str(get_jwt_identity())
    
    # Find pickup and verify ownership
    pickup = PickupRequest.query.filter_by(
        id=pickup_id,
        user_id=user_id
    ).first()
    
    if not pickup:
        return jsonify({"error": "Pickup not found"}), 404
    
    # Only allow canceling if status is REQUESTED or ASSIGNED
    if pickup.status not in ["REQUESTED", "ASSIGNED"]:
        return jsonify({
            "error": f"Cannot cancel pickup with status {pickup.status}"
        }), 400
    
    # Update status to CANCELLED
    pickup.status = "CANCELLED"
    
    db.session.commit()
    
    # Notify user about cancellation (in-app + transactional email)
    _safe_create_notification(
        user_id,
        f"Pickup {pickup.id} has been cancelled.",
        type_="INFO",
    )
    try:
        user = User.query.get(user_id)
        if user and user.email:
            subj, html, text = render_pickup_status_update(
                user_name=user.name or "User",
                pickup_id=pickup.id,
                status="CANCELLED",
                address=pickup.address or "",
                scheduled_date=str(pickup.scheduled_date) if pickup.scheduled_date else None,
                time_slot=pickup.time_slot,
                status_message="Your pickup request has been cancelled.",
            )
            send_email(user.email, subj, html_body=html, text_body=text)
    except Exception as e:
        print(f"[MAIL] Cancellation email failed: {e}")
    
    return jsonify({
        "message": "Pickup cancelled successfully",
        "pickup_id": pickup.id,
        "status": pickup.status
    }), 200


# ======================
# ADD FEEDBACK (USER)
# ======================
@pickup_bp.route("/<pickup_id>/feedback", methods=["POST"])
@jwt_required()
def add_feedback(pickup_id):
    """
    POST /api/pickups/<pickup_id>/feedback
    Only the pickup owner can submit feedback, and only after completion.
    """
    current_id = str(get_jwt_identity())
    data = request.get_json() or {}

    rating = data.get("rating")
    comment = data.get("comment") or ""

    if rating is None:
        return {"error": "Rating is required"}, 400

    try:
        rating = int(rating)
    except (TypeError, ValueError):
        return {"error": "Rating must be an integer"}, 400

    if rating < 1 or rating > 5:
        return {"error": "Rating must be between 1 and 5"}, 400

    pickup = PickupRequest.query.get_or_404(pickup_id)

    if pickup.user_id != current_id:
        return {"error": "Forbidden"}, 403

    # Prevent duplicate feedback for the same pickup by the same user
    existing = Feedback.query.filter_by(
        pickup_id=pickup_id,
        user_id=current_id,
    ).first()
    if existing:
        return {
            "error": "Feedback already submitted for this pickup"
        }, 400

    if pickup.status != "RECYCLED":
        return {"error": "Feedback allowed only for completed pickups"}, 400

    feedback = Feedback(
        pickup_id=pickup_id,
        user_id=current_id,
        rating=rating,
        comment=comment,
    )

    db.session.add(feedback)
    db.session.commit()

    # Optional notification to collector/recycler could go here; keep user-focused for now

    return {
        "id": feedback.id,
        "pickup_id": feedback.pickup_id,
        "user_id": feedback.user_id,
        "rating": feedback.rating,
        "comment": feedback.comment,
        "created_at": feedback.created_at.isoformat() if feedback.created_at else None,
    }, 201
