from flask import Blueprint, current_app, send_file
from extensions import db
from models.certificate import RecyclingCertificate
from models.pickup import PickupRequest
from models.item import EWasteItem
from models.user import User
from models.notification import Notification
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import os

from utils.pdf_builder import build_certificate_pdf
from utils.email_sender import send_email
from utils.email_templates import render_certificate_dispatch

certificate_bp = Blueprint("certificates", __name__)

@certificate_bp.route("/generate/<pickup_id>", methods=["POST"])
@jwt_required()
def generate_certificate(pickup_id):
    pickup = PickupRequest.query.get_or_404(pickup_id)

    if pickup.status != "RECYCLED":
        return {"error": "Pickup not recycled yet"}, 400

    items = EWasteItem.query.filter_by(pickup_id=pickup_id).all()
    total_weight = sum(item.estimated_weight or 0 for item in items)

    certificate = RecyclingCertificate(
        pickup_id=pickup_id,
        user_id=pickup.user_id,
        recycler_id=get_jwt_identity(),
        total_weight=total_weight,
        issued_at=datetime.utcnow()
    )

    db.session.add(certificate)
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return {"error": "Failed to generate certificate"}, 500
    # Generate PDF file for the certificate and persist file_path
    try:
        os.makedirs("generated_certificates", exist_ok=True)
        pdf_path = os.path.join("generated_certificates", f"{certificate.id}.pdf")
        # build styled PDF using shared helper
        build_certificate_pdf(certificate, pdf_path)
        certificate.file_path = pdf_path
        db.session.commit()
        print("Certificate saved at:", pdf_path)
    except Exception as e:
        db.session.rollback()
        print("Failed to generate PDF for certificate:", e)

    # Fire-and-forget notifications for user and recycler
    recycler_id = get_jwt_identity()
    try:
        n_user = Notification(
            user_id=pickup.user_id,
            message=f"Recycling certificate {certificate.id} issued for pickup {pickup.id}.",
            type="SUCCESS",
        )
        db.session.add(n_user)
        n_recycler = Notification(
            user_id=recycler_id,
            message=f"Certificate issued for pickup {pickup.id}",
            type="SUCCESS",
        )
        db.session.add(n_recycler)
        db.session.commit()
    except Exception:
        db.session.rollback()

    # Transactional email: certificate dispatch to user
    try:
        user = User.query.get(pickup.user_id)
        if user and user.email:
            tw = float(certificate.total_weight or total_weight)
            co2 = float(getattr(certificate, "co2_saved", None) or tw * 2.5)
            subj, html, text = render_certificate_dispatch(
                user_name=user.name or "User",
                pickup_id=pickup.id,
                certificate_id=certificate.id,
                total_weight=tw,
                co2_saved=co2,
            )
            send_email(user.email, subj, html_body=html, text_body=text)
    except Exception as e:
        print(f"[MAIL] Certificate dispatch failed: {e}")

    return {
        "message": "Recycling certificate generated",
        "certificate_id": certificate.id
    }, 201


# ======================
# GET MY CERTIFICATES (USER)
# ======================
@certificate_bp.route("/my", methods=["GET"])
@jwt_required()
def my_certificates():
    user_id = get_jwt_identity()

    certs = RecyclingCertificate.query.filter_by(user_id=user_id).order_by(RecyclingCertificate.issued_at.desc()).all()

    return [
        {
            "id": c.id,
            "pickup_id": c.pickup_id,
            "total_weight": c.total_weight,
            "issued_at": str(c.issued_at)
        } for c in certs
    ], 200


# ======================
# DOWNLOAD CERTIFICATE BY PICKUP ID (USER DASHBOARD)
# ======================
@certificate_bp.route("/download-by-pickup/<pickup_id>", methods=["GET"])
@jwt_required()
def download_certificate_by_pickup(pickup_id):
    """Download certificate PDF for a pickup; caller must be the pickup owner, recycler, or admin."""
    current_id = str(get_jwt_identity())
    pickup = PickupRequest.query.get_or_404(pickup_id)

    cert = RecyclingCertificate.query.filter_by(pickup_id=pickup_id).first()
    if not cert:
        return {"error": "No certificate found for this pickup"}, 404

    if str(cert.user_id) != current_id and str(cert.recycler_id) != current_id:
        user = User.query.get(current_id)
        if not user or user.role != "ADMIN":
            return {"error": "Forbidden"}, 403

    base_dir = os.path.join(current_app.root_path, "generated_certificates")
    os.makedirs(base_dir, exist_ok=True)
    output_path = os.path.join(base_dir, f"certificate_{cert.id}.pdf")

    try:
        build_certificate_pdf(cert, output_path)
        cert.file_path = os.path.abspath(output_path)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print("Failed to generate certificate PDF:", e)
        return {"error": "Failed to generate certificate PDF"}, 500

    if not os.path.exists(output_path):
        return {"error": "PDF generation failed"}, 500

    return send_file(
        output_path,
        mimetype="application/pdf",
        as_attachment=True,
        download_name=f"recycling_certificate_{pickup_id}.pdf",
    )


# ======================
# GET CERTIFICATE DETAILS
# ======================
@certificate_bp.route("/<cert_id>", methods=["GET"])
@jwt_required()
def get_certificate(cert_id):
    cert = RecyclingCertificate.query.get_or_404(cert_id)
    current_id = get_jwt_identity()

    if cert.user_id != current_id and cert.recycler_id != current_id:
        user = User.query.get(current_id)
        if not user or user.role != "ADMIN":
            return {"error": "Forbidden"}, 403

    return {
        "id": cert.id,
        "pickup_id": cert.pickup_id,
        "total_weight": cert.total_weight,
        "issued_at": str(cert.issued_at)
    }, 200
