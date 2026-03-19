from extensions import db
from datetime import datetime
import uuid

def uuid_str():
    return str(uuid.uuid4())

class RecyclerProfile(db.Model):
    __tablename__ = "recycler_profiles"

    id = db.Column(db.String(36), primary_key=True, default=uuid_str)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), unique=True)

    facility_name = db.Column(db.String(200))
    certification = db.Column(db.String(100))

    approval_status = db.Column(db.Enum("PENDING", "APPROVED", "REJECTED"), default="PENDING")
    total_processed = db.Column(db.Integer, default=0)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
