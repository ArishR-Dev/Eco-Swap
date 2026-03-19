from extensions import db
from datetime import datetime
import uuid

def uuid_str():
    return str(uuid.uuid4())

class PickupRequest(db.Model):
    __tablename__ = "pickup_requests"

    id = db.Column(db.String(36), primary_key=True, default=uuid_str)

    user_id = db.Column(db.String(36), db.ForeignKey("users.id"))
    collector_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=True)
    recycler_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=True)

    status = db.Column(db.Enum(
        "REQUESTED","ASSIGNED","EN_ROUTE","COLLECTED",
        "HANDED_TO_RECYCLER","PROCESSING","RECYCLED","CANCELLED"
    ), default="REQUESTED")

    address = db.Column(db.Text)
    scheduled_date = db.Column(db.Date)
    time_slot = db.Column(db.String(50))

    total_weight = db.Column(db.Float, default=0)
    priority = db.Column(db.Enum("NORMAL","URGENT"), default="NORMAL")

    # Optional precise location for navigation
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship to items
    items = db.relationship("EWasteItem", backref="pickup", lazy=True, cascade="all, delete-orphan")
