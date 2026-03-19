"""Routes for fetching collector details by ID. Used by users viewing pickup details."""
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from models.user import User
from models.pickup import PickupRequest

collectors_bp = Blueprint("collectors", __name__)


@collectors_bp.route("/<collector_id>", methods=["GET"])
@jwt_required()
def get_collector_by_id(collector_id):
    """
    GET /api/collectors/<id>
    Return basic collector info (name, phone, vehicle_type, etc.).
    Allowed if: requester owns a pickup assigned to this collector, is admin, or is the collector.
    """
    current_id = str(get_jwt_identity())
    collector = User.query.get(collector_id)

    if not collector or collector.role != "COLLECTOR":
        return jsonify({"error": "Collector not found"}), 404

    # Admin can always view
    current_user = User.query.get(current_id)
    if current_user and current_user.role == "ADMIN":
        pass  # allowed
    # Collector can view themselves
    elif current_id == collector_id:
        pass  # allowed
    # User can view collector if they have a pickup assigned to that collector
    elif PickupRequest.query.filter_by(
        user_id=current_id, collector_id=collector_id
    ).first():
        pass  # allowed
    else:
        return jsonify({"error": "Forbidden"}), 403

    return jsonify({
        "id": collector.id,
        "name": collector.name,
        "email": collector.email,
        "phone": collector.phone or "",
        "address": collector.address or "",
        "role": collector.role,
        "vehicleType": collector.vehicle_type or "",
        "licenseNumber": collector.license_number or "",
    }), 200
