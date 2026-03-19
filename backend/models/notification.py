from extensions import db
from datetime import datetime
import uuid


def uuid_str() -> str:
    return str(uuid.uuid4())


class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.String(36), primary_key=True, default=uuid_str)

    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(
        db.Enum("SUCCESS", "INFO", "WARNING", "ERROR", name="notification_type"),
        default="INFO",
        nullable=False,
    )

    is_read = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

