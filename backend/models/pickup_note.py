from datetime import datetime
import uuid

from extensions import db


def uuid_str():
    return str(uuid.uuid4())


class PickupNote(db.Model):
    __tablename__ = "pickup_notes"

    id = db.Column(db.String(36), primary_key=True, default=uuid_str)
    pickup_id = db.Column(
        db.String(36),
        db.ForeignKey("pickup_requests.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    author_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=True, index=True)

    note = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

