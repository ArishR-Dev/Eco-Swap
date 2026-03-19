from extensions import db
from datetime import datetime
import uuid

def uuid_str():
    return str(uuid.uuid4())

class Feedback(db.Model):
    __tablename__ = "feedback"

    id = db.Column(db.String(36), primary_key=True, default=uuid_str)
    pickup_id = db.Column(db.String(36), db.ForeignKey("pickup_requests.id"))
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"))

    rating = db.Column(db.Integer)
    comment = db.Column(db.Text)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship to User
    user = db.relationship("User", backref="feedback")
