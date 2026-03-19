from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from models.user import User

collector_bp = Blueprint("collectors", __name__, url_prefix="/api/collectors")

@collector_bp.route("/available", methods=["GET"])
@jwt_required()
def get_available_collectors():
    """Return all users with role == 'COLLECTOR'. JWT protected.

    Response:
    {
      "collectors": [ { "id": ..., "name": ..., "email": ... }, ... ]
    }
    """
    try:
        collectors = User.query.filter_by(role="COLLECTOR").all()
        data = [{"id": c.id, "name": c.name, "email": c.email} for c in collectors]
        return jsonify({"collectors": data}), 200
    except Exception as e:
        # Keep error simple; logging handled by app
        return jsonify({"error": "Failed to fetch collectors"}), 500
