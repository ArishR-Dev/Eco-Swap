import logging
import os

from flask import Blueprint, jsonify, request, send_file, current_app

from utils.pdf_builder import build_certificate_pdf
from utils.email_sender import send_email
from utils.email_templates import render_certificate_dispatch
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from sqlalchemy import func
from sqlalchemy.orm import joinedload
from datetime import timezone

from models.user import User
from models.pickup import PickupRequest
from models.item import EWasteItem
from models.certificate import RecyclingCertificate
from models.feedback import Feedback
from models.notification import Notification
from extensions import db

# PDF generation handled by helper

recycler_bp = Blueprint("recycler", __name__)
logger = logging.getLogger(__name__)

# ---------------- HELPERS ----------------

def require_recycler(user_id):
    user = User.query.get(user_id)
    return user if user and user.role == "RECYCLER" else None


def iso_z(dt):
    """Return ISO-8601 UTC timestamp with 'Z' suffix.

    Important: many models store naive UTC datetimes (datetime.utcnow). If we
    serialize them without timezone, browsers parse them as local time, which
    shifts the relative-time display by the user's UTC offset.
    """
    if not dt:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def _item_to_dict(it):
    return {
        "id": getattr(it, "id", None),
        "category": getattr(it, "category", None) or "OTHER",
        "quantity": int(getattr(it, "quantity", 1) or 1),
        "estimated_weight": float(getattr(it, "estimated_weight", 0) or 0),
    }


def pickup_to_dict(p):
    # Prefer stored total_weight, but fall back to recomputing from items
    total_weight = float(p.total_weight or 0)
    items_list = list(getattr(p, "items", []) or []) or EWasteItem.query.filter_by(
        pickup_id=p.id
    ).all()
    if total_weight <= 0 and items_list:
        try:
            total_weight = sum(
                float(item.estimated_weight or 0)
                * int(getattr(item, "quantity", 1) or 1)
                for item in items_list
            )
        except Exception:
            total_weight = float(p.total_weight or 0)

    return {
        "id": p.id,
        "status": p.status,
        "address": p.address,
        "scheduled_date": str(p.scheduled_date) if p.scheduled_date else None,
        "total_weight": float(total_weight or 0),
        "created_at": str(p.created_at),
        "items": [_item_to_dict(it) for it in items_list],
    }


def cert_to_dict(c):
    return {
        "id": c.id,
        "pickup_id": c.pickup_id,
        "total_weight": float(c.total_weight or 0),
        "co2_saved": float(c.co2_saved or 0),
        "issued_at": iso_z(c.issued_at) or str(c.issued_at)
    }


# ---------------- PROFILE ----------------

@recycler_bp.route("/profile", methods=["GET"])
@jwt_required()
def profile():
    print("=" * 60)
    print("[RECYCLER DEBUG] Profile endpoint called")
    print(f"  - Path: {request.path}")
    print(f"  - Method: {request.method}")
    
    try:
        user_id = get_jwt_identity()
        jwt_data = get_jwt()
        
        print(f"  - JWT identity (get_jwt_identity()): {user_id}")
        print(f"  - JWT identity type: {type(user_id)}")
        print(f"  - JWT payload (get_jwt()): {jwt_data}")
        
        auth_header = request.headers.get('Authorization', 'NOT PRESENT')
        print(f"  - Authorization header present: {auth_header != 'NOT PRESENT'}")
        if auth_header != 'NOT PRESENT':
            print(f"  - Header value: {auth_header[:80]}...")
        
        # Check expiration
        exp = jwt_data.get("exp")
        if exp:
            import time
            current_time = time.time()
            is_expired = exp < current_time
            time_until_expiry = exp - current_time
            print(f"  - Token expiration check:")
            print(f"    * exp claim: {exp}")
            print(f"    * current time: {current_time}")
            print(f"    * expired: {is_expired}")
            if not is_expired:
                print(f"    * expires in: {time_until_expiry:.0f} seconds ({time_until_expiry/3600:.1f} hours)")
        
        # Verify user exists
        print(f"  - Looking up user with id: {user_id}")
        user = User.query.get(user_id)
        if not user:
            print(f"  - ERROR: User {user_id} not found in database")
            print("=" * 60)
            return jsonify({"error": "User not found"}), 404
        
        print(f"  - User found: {user.email}, role: {user.role}")
        print(f"  - User ID matches: {str(user.id) == str(user_id)}")
        print("=" * 60)
        return jsonify({
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone or "",
            "address": user.address or "",
            "role": user.role,
            "facilityName": user.facility_name or "",
            "certification": user.certification or "",
            "createdAt": user.created_at.isoformat() if user.created_at else None,
        }), 200
        
    except Exception as e:
        print(f"  - EXCEPTION in profile endpoint: {e}")
        import traceback
        traceback.print_exc()
        print("=" * 60)
        return jsonify({"error": "Internal server error", "details": str(e)}), 500


# ---------------- RECYCLER LIST ----------------

@recycler_bp.route("/list", methods=["GET"])
@jwt_required()
def list_recyclers():
    """List all users with RECYCLER role for collector handover dropdown."""
    current_id = str(get_jwt_identity())

    recyclers = User.query.filter_by(role="RECYCLER").all()
    print("RECYCLERS FOUND:", len(recyclers))

    return jsonify([
        {
            "id": str(r.id),
            "name": r.name,
            "email": r.email,
        }
        for r in recyclers
    ]), 200

# ---------------- STATS ----------------

@recycler_bp.route("/<recycler_id>/stats", methods=["GET"])
@jwt_required()
def stats(recycler_id):
    print("[RECYCLER DEBUG] Stats endpoint called")
    user_id = get_jwt_identity()
    jwt_data = get_jwt()
    print(f"  - JWT identity: {user_id}")
    print(f"  - Path param recycler_id: {recycler_id}")
    print(f"  - JWT payload: {jwt_data}")

    if not require_recycler(user_id):
        print(f"  - ERROR: User {user_id} is not a recycler")
        user = User.query.get(user_id)
        if user:
            print(f"  - User role: {user.role}")
        return jsonify({"error": "Recycler access required"}), 403

    try:
        total_weight = db.session.query(
            func.coalesce(func.sum(RecyclingCertificate.total_weight), 0)
        ).filter(RecyclingCertificate.recycler_id == user_id).scalar()

        pickups_handled = db.session.query(
            func.count(PickupRequest.id)
        ).filter(PickupRequest.recycler_id == user_id).scalar()

        items_processed = db.session.query(
            func.coalesce(func.sum(EWasteItem.quantity), 0)
        ).join(PickupRequest, EWasteItem.pickup_id == PickupRequest.id
        ).filter(PickupRequest.recycler_id == user_id).scalar()

        certificates = db.session.query(
            func.count(RecyclingCertificate.id)
        ).filter(RecyclingCertificate.recycler_id == user_id).scalar()

        return jsonify({
            "total_weight": float(total_weight or 0),
            "pickups_handled": int(pickups_handled or 0),
            "items_processed": int(items_processed or 0),
            "certificates": int(certificates or 0)
        }), 200

    except Exception:
        logger.exception("Stats failure")
        db.session.rollback()

        return jsonify({
            "total_weight": 0,
            "pickups_handled": 0,
            "items_processed": 0,
            "certificates": 0
        }), 200

# ---------------- LISTS ----------------

@recycler_bp.route("/<recycler_id>/incoming", methods=["GET"])
@jwt_required()
def incoming(recycler_id):
    current_id = str(get_jwt_identity())

    pickups = PickupRequest.query.options(joinedload(PickupRequest.items)).filter_by(
        recycler_id=current_id,
        status="HANDED_TO_RECYCLER"
    ).all()
    print("Incoming pickups:", len(pickups))

    return jsonify({
        "data": [pickup_to_dict(p) for p in pickups],
        "count": len(pickups)
    }), 200


@recycler_bp.route("/<recycler_id>/processing", methods=["GET"])
@jwt_required()
def processing(recycler_id):
    current_id = str(get_jwt_identity())

    pickups = PickupRequest.query.options(joinedload(PickupRequest.items)).filter_by(
        recycler_id=current_id,
        status="PROCESSING"
    ).all()
    print("Recycler processing for:", current_id, "Found pickups:", len(pickups))

    return jsonify({
        "data": [pickup_to_dict(p) for p in pickups],
        "count": len(pickups)
    }), 200


@recycler_bp.route("/<recycler_id>/completed", methods=["GET"])
@jwt_required()
def completed(recycler_id):
    current_id = str(get_jwt_identity())

    pickups = PickupRequest.query.filter_by(
        recycler_id=current_id,
        status="RECYCLED"
    ).all()
    print("Recycler completed for:", current_id, "Found pickups:", len(pickups))

    return jsonify({
        "data": [pickup_to_dict(p) for p in pickups],
        "count": len(pickups)
    }), 200

# ---------------- CERTIFICATES ----------------

@recycler_bp.route("/<recycler_id>/certificates", methods=["GET"])
@jwt_required()
def certificates(recycler_id):
    user_id = get_jwt_identity()

    certs = RecyclingCertificate.query.filter_by(
        recycler_id=user_id
    ).order_by(
        RecyclingCertificate.issued_at.desc()
    ).all()

    return jsonify({
        "data": [cert_to_dict(c) for c in certs],
        "count": len(certs)
    }), 200


@recycler_bp.route("/certificate/<certificate_id>/download", methods=["GET"])
@jwt_required()
def download_certificate(certificate_id):
    """Download a recycling certificate as PDF"""
    cert = RecyclingCertificate.query.get_or_404(certificate_id)

    base_dir = os.path.join(current_app.root_path, "generated_certificates")
    os.makedirs(base_dir, exist_ok=True)

    output_path = os.path.join(
        base_dir,
        f"certificate_{cert.id}.pdf"
    )

    # ALWAYS regenerate styled PDF regardless of existing file
    try:
        build_certificate_pdf(cert, output_path)
        cert.file_path = os.path.abspath(output_path)
        db.session.commit()
        print("[CERT DEBUG] PDF regenerated:", output_path)
    except Exception as e:
        db.session.rollback()
        print("Failed to regenerate certificate PDF:", e)
        return jsonify({"error": "Failed to generate certificate PDF"}), 500

    # verify output exists before sending
    exists = os.path.exists(output_path)
    print("PDF GENERATED:", output_path)
    print("FILE EXISTS:", exists)
    if not exists:
        return jsonify({"error": "PDF generation failed"}), 500

    return send_file(
        output_path,
        mimetype="application/pdf",
        as_attachment=True,
        download_name="recycling_certificate.pdf"
    )

# ---------------- LIFECYCLE ENGINE ----------------

@recycler_bp.route("/pickup/<pickup_id>/start", methods=["PUT"])
@jwt_required()
def start_processing(pickup_id):
    user_id = get_jwt_identity()
    pickup = PickupRequest.query.options(joinedload(PickupRequest.items)).get_or_404(pickup_id)

    if pickup.recycler_id != user_id:
        return jsonify({"error": "Forbidden"}), 403

    if pickup.status != "HANDED_TO_RECYCLER":
        return jsonify({"error": "Invalid transition"}), 400

    pickup.status = "PROCESSING"

    # If stored total_weight is missing or zero, compute from items and persist
    if not pickup.total_weight or float(pickup.total_weight) <= 0:
        items = list(getattr(pickup, "items", []) or []) or EWasteItem.query.filter_by(pickup_id=pickup.id).all()
        if items:
            computed = sum(
                float(item.estimated_weight or 0) * int(getattr(item, "quantity", 1) or 1)
                for item in items
            )
            if computed > 0:
                pickup.total_weight = computed

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Failed to update status"}), 500

    return jsonify({"message": "Processing started"}), 200


@recycler_bp.route("/pickup/<pickup_id>/complete", methods=["PUT"])
@jwt_required()
def complete_pickup(pickup_id):
    user_id = get_jwt_identity()
    pickup = PickupRequest.query.get_or_404(pickup_id)

    if pickup.recycler_id != user_id:
        return jsonify({"error": "Forbidden"}), 403

    if pickup.status != "PROCESSING":
        return jsonify({"error": "Invalid transition"}), 400

    pickup.status = "RECYCLED"

    total_weight = db.session.query(
        func.coalesce(
            func.sum(EWasteItem.estimated_weight * func.coalesce(EWasteItem.quantity, 1)),
            0
        )
    ).filter(EWasteItem.pickup_id == pickup.id).scalar()

    total_weight = float(total_weight or 0)
    if total_weight <= 0:
        total_weight = float(pickup.total_weight or 0)

    # Keep pickup.total_weight in sync so recycler log and stats match certificates
    pickup.total_weight = total_weight

    cert = RecyclingCertificate(
        pickup_id=pickup.id,
        user_id=pickup.user_id,
        recycler_id=user_id,
        total_weight=total_weight,
        co2_saved=total_weight * 0.5
    )

    try:
        db.session.add(cert)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Certificate creation failed"}), 500

    # Generate styled PDF and save file_path
    try:
        BASE_DIR = os.path.abspath(os.path.dirname(__file__))
        CERT_DIR = os.path.join(BASE_DIR, "..", "generated_certificates")
        os.makedirs(CERT_DIR, exist_ok=True)

        file_path = os.path.join(CERT_DIR, f"certificate_{cert.id}.pdf")
        build_certificate_pdf(cert, file_path)
        cert.file_path = os.path.abspath(file_path)
        db.session.commit()
        print("Certificate PDF saved at:", cert.file_path)
    except Exception as e:
        db.session.rollback()
        print("Failed to generate PDF for certificate:", e)

    # Notify user and recycler (in-app)
    try:
        n_user = Notification(
            user_id=pickup.user_id,
            message=f"Pickup {pickup.id} status: RECYCLED",
            type="SUCCESS",
        )
        db.session.add(n_user)
        n_recycler = Notification(
            user_id=user_id,
            message=f"Pickup {pickup.id} status: RECYCLED",
            type="SUCCESS",
        )
        db.session.add(n_recycler)
        db.session.commit()
    except Exception:
        db.session.rollback()

    # Transactional email: certificate dispatch (includes recycled confirmation)
    try:
        if pickup.user_id:
            user = User.query.get(pickup.user_id)
            if user and user.email:
                co2 = float(cert.co2_saved or total_weight * 2.5)
                subj, html, text = render_certificate_dispatch(
                    user_name=user.name or "User",
                    pickup_id=pickup.id,
                    certificate_id=cert.id,
                    total_weight=total_weight,
                    co2_saved=co2,
                )
                send_email(user.email, subj, html_body=html, text_body=text)
    except Exception as e:
        print(f"[MAIL] Certificate dispatch failed: {e}")

    return jsonify({"message": "Pickup recycled"}), 200

# ---------------- REPORTS ----------------

@recycler_bp.route("/<recycler_id>/reports", methods=["GET"])
@jwt_required()
def reports(recycler_id):
    user_id = get_jwt_identity()

    total_weight = db.session.query(
        func.coalesce(func.sum(RecyclingCertificate.total_weight), 0)
    ).filter(RecyclingCertificate.recycler_id == user_id).scalar()

    certificates = db.session.query(
        func.count(RecyclingCertificate.id)
    ).filter(RecyclingCertificate.recycler_id == user_id).scalar()

    total_weight = float(total_weight or 0)

    return jsonify({
        "summary": {
            "total_weight": total_weight,
            "certificates": int(certificates or 0),
            "co2_saved": total_weight * 0.5
        },
        "charts": {}
    }), 200

# ---------------- NOTIFICATIONS ----------------

@recycler_bp.route("/notifications", methods=["GET"])
@jwt_required()
def notifications():
    """Get notifications for the current recycler from Notification model"""
    user_id = get_jwt_identity()
    if not require_recycler(user_id):
        return jsonify({"error": "Recycler access required"}), 403

    notifs = Notification.query.filter_by(user_id=user_id).order_by(
        Notification.created_at.desc()
    ).limit(50).all()

    data = [
        {
            "id": n.id,
            "message": n.message,
            "type": n.type.lower() if n.type else "info",
            "isRead": n.is_read,
            "timestamp": iso_z(n.created_at) if n.created_at else None,
        }
        for n in notifs
    ]
    return jsonify({"data": data}), 200


@recycler_bp.route("/notifications/<notif_id>/read", methods=["PATCH"])
@jwt_required()
def mark_recycler_notification_read(notif_id):
    """Mark notification as read - only for current recycler's notifications"""
    user_id = get_jwt_identity()
    if not require_recycler(user_id):
        return jsonify({"error": "Recycler access required"}), 403
    notif = Notification.query.filter_by(id=notif_id, user_id=user_id).first_or_404()
    notif.is_read = True
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Failed to update notification"}), 500
    return jsonify({"success": True}), 200


@recycler_bp.route("/notifications/<notif_id>", methods=["DELETE"])
@jwt_required()
def delete_recycler_notification(notif_id):
    """Delete notification - only for current recycler's notifications"""
    user_id = get_jwt_identity()
    if not require_recycler(user_id):
        return jsonify({"error": "Recycler access required"}), 403
    notif = Notification.query.filter_by(id=notif_id, user_id=user_id).first_or_404()
    try:
        db.session.delete(notif)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Failed to delete notification"}), 500
    return jsonify({"success": True}), 200


# ---------------- REVIEWS & FEEDBACK ----------------

@recycler_bp.route("/<recycler_id>/reviews", methods=["GET"])
@jwt_required()
def get_recycler_reviews(recycler_id):
    """Get reviews/feedback for a specific recycler from completed pickups"""
    current_id = str(get_jwt_identity())

    # Get all pickups where this recycler was assigned
    pickups = PickupRequest.query.filter(
        PickupRequest.recycler_id == current_id
    ).all()

    pickup_ids = [p.id for p in pickups]

    # Get all feedback for these pickups
    reviews = Feedback.query.filter(
        Feedback.pickup_id.in_(pickup_ids)
    ).all() if pickup_ids else []

    return jsonify([
        {
            "rating": r.rating,
            "feedback": r.comment,
            "user": r.user.name if r.user else "Unknown",
            "created_at": str(r.created_at) if r.created_at else None
        }
        for r in reviews
    ]), 200