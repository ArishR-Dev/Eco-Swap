from extensions import db
from datetime import datetime
import uuid

def uuid_str():
    return str(uuid.uuid4())

class CollectorProfile(db.Model):
    __tablename__ = "collector_profiles"

    id = db.Column(db.String(36), primary_key=True, default=uuid_str)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), unique=True)

    vehicle_type = db.Column(db.String(50))
    license_number = db.Column(db.String(50), unique=True)

    approval_status = db.Column(db.Enum("PENDING", "APPROVED", "REJECTED"), default="PENDING")
    is_available = db.Column(db.Boolean, default=False)

    total_pickups = db.Column(db.Integer, default=0)
    rating = db.Column(db.Float, default=0)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
