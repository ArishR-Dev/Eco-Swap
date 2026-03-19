from datetime import datetime, timedelta
import uuid

from extensions import db


def uuid_str():
    return str(uuid.uuid4())


class PasswordResetToken(db.Model):
    __tablename__ = "password_reset_tokens"

    id = db.Column(db.String(36), primary_key=True, default=uuid_str)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    token = db.Column(db.String(255), unique=True, nullable=False)

    expires_at = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False, nullable=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    @classmethod
    def create_for_user(cls, user_id: str, lifetime_minutes: int = 60) -> "PasswordResetToken":
        """Factory to create a reset token row with an expiry."""
        from secrets import token_urlsafe

        token_value = token_urlsafe(48)
        expires = datetime.utcnow() + timedelta(minutes=lifetime_minutes)

        return cls(user_id=user_id, token=token_value, expires_at=expires, used=False)

