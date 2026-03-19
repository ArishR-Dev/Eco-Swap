from flask import Blueprint
from extensions import db
from models import PickupRequest, RecyclingCertificate, Feedback, Notification
from flask_jwt_extended import jwt_required, get_jwt_identity


user_bp = Blueprint("user", __name__)


@user_bp.route("/stats", methods=["GET"])
@jwt_required()
def user_stats():
    """
    GET /api/user/stats
    Aggregated stats for the authenticated user based on pickup lifecycle.
    """
    user_id = str(get_jwt_identity())

    pickups = PickupRequest.query.filter_by(user_id=user_id).all()
    total_pickups = len(pickups)

    pending_statuses = {"REQUESTED", "ASSIGNED", "EN_ROUTE"}
    processing_statuses = {"HANDED_TO_RECYCLER", "PROCESSING"}

    pending = sum(1 for p in pickups if p.status in pending_statuses)
    collected = sum(1 for p in pickups if p.status == "COLLECTED")
    processing = sum(1 for p in pickups if p.status in processing_statuses)
    completed = sum(1 for p in pickups if p.status == "RECYCLED")

    certificates = (
        db.session.query(RecyclingCertificate)
        .filter_by(user_id=user_id)
        .count()
    )

    return {
        "total_pickups": total_pickups,
        "pending": pending,
        "collected": collected,
        "processing": processing,
        "completed": completed,
        "certificates": certificates,
    }, 200


@user_bp.route("/notifications", methods=["GET"])
@jwt_required()
def user_notifications():
    """
    GET /api/user/notifications
    Returns notifications for the authenticated user, newest first.
    """
    user_id = str(get_jwt_identity())

    notifications = (
        Notification.query.filter_by(user_id=user_id)
        .order_by(Notification.created_at.desc())
        .limit(50)
        .all()
    )

    result = [
        {
            "id": n.id,
            "message": n.message,
            "type": n.type,
            "isRead": bool(n.is_read),
            "createdAt": n.created_at.isoformat() if n.created_at else None,
        }
        for n in notifications
    ]

    return result, 200


@user_bp.route("/notifications/<notif_id>/read", methods=["PATCH"])
@jwt_required()
def mark_user_notification_read(notif_id):
    """Mark a notification as read - only for current user's notifications"""
    user_id = str(get_jwt_identity())
    notif = Notification.query.filter_by(id=notif_id, user_id=user_id).first_or_404()
    notif.is_read = True
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return {"error": "Failed to update notification"}, 500
    return {"success": True}, 200


@user_bp.route("/notifications/<notif_id>", methods=["DELETE"])
@jwt_required()
def delete_user_notification(notif_id):
    """Delete a notification - only for current user's notifications"""
    user_id = str(get_jwt_identity())
    notif = Notification.query.filter_by(id=notif_id, user_id=user_id).first_or_404()
    try:
        db.session.delete(notif)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return {"error": "Failed to delete notification"}, 500
    return {"success": True}, 200


@user_bp.route("/feedback", methods=["GET"])
@jwt_required()
def user_feedback():
    """
    GET /api/user/feedback
    Returns feedback entries submitted by the authenticated user.
    """
    user_id = str(get_jwt_identity())

    feedback_entries = Feedback.query.filter_by(user_id=user_id).order_by(
        Feedback.created_at.desc()
    )

    # Optional enrichment: collector name per pickup
    pickup_ids = {f.pickup_id for f in feedback_entries}
    pickups = (
        PickupRequest.query.filter(PickupRequest.id.in_(pickup_ids)).all()
        if pickup_ids
        else []
    )
    pickups_by_id = {p.id: p for p in pickups}

    result = []
    for f in feedback_entries:
        pickup = pickups_by_id.get(f.pickup_id)
        collector_name = getattr(pickup, "collector_id", None)
        result.append(
            {
                "id": f.id,
                "pickupId": f.pickup_id,
                "rating": f.rating,
                "comment": f.comment or "",
                "createdAt": f.created_at.isoformat() if f.created_at else None,
                "collectorName": collector_name,
            }
        )

    return result, 200

