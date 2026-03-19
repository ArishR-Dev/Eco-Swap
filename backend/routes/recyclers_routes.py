from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy import and_

from models.user import User
from models.recycler import RecyclerProfile


recyclers_bp = Blueprint("recyclers", __name__)


def _serialize_recycler(user: User, profile: RecyclerProfile | None):
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone or "",
        "address": user.address or "",
        "role": user.role,
        "facility_name": getattr(profile, "facility_name", "") or "",
        "certification": getattr(profile, "certification", "") or "",
        "approval_status": getattr(profile, "approval_status", None),
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


@recyclers_bp.route("", methods=["GET"])
@jwt_required()
def list_recyclers():
    """GET /api/recyclers - List all recyclers (any authenticated user)."""
    users = User.query.filter_by(role="RECYCLER").all()
    user_ids = [u.id for u in users]

    profiles = []
    if user_ids:
        profiles = RecyclerProfile.query.filter(
            RecyclerProfile.user_id.in_(user_ids)
        ).all()
    profiles_by_user = {p.user_id: p for p in profiles}

    data = [
        _serialize_recycler(u, profiles_by_user.get(u.id))
        for u in users
    ]
    return jsonify(data), 200


@recyclers_bp.route("/approved", methods=["GET"])
@jwt_required()
def list_approved_recyclers():
    """GET /api/recyclers/approved - List only approved recyclers."""
    profiles = RecyclerProfile.query.filter_by(approval_status="APPROVED").all()
    user_ids = [p.user_id for p in profiles]

    users = []
    if user_ids:
        users = User.query.filter(
            and_(User.id.in_(user_ids), User.role == "RECYCLER")
        ).all()
    users_by_id = {u.id: u for u in users}

    data = []
    for profile in profiles:
        user = users_by_id.get(profile.user_id)
        if not user:
            continue
        data.append(_serialize_recycler(user, profile))

    return jsonify(data), 200


@recyclers_bp.route("/<recycler_id>", methods=["GET"])
@jwt_required()
def get_recycler_by_id(recycler_id):
    """GET /api/recyclers/<id> - Get a single recycler by ID."""
    user = User.query.get(recycler_id)
    if not user or user.role != "RECYCLER":
        return jsonify({"error": "Recycler not found"}), 404

    profile = RecyclerProfile.query.filter_by(user_id=recycler_id).first()
    return jsonify(_serialize_recycler(user, profile)), 200

