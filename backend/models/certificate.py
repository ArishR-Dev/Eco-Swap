from extensions import db
from datetime import datetime
import uuid

class RecyclingCertificate(db.Model):
    __tablename__ = "recycling_certificates"

    id = db.Column(
        db.String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    pickup_id = db.Column(db.String(36))
    user_id = db.Column(db.String(36))
    recycler_id = db.Column(db.String(36))

    total_weight = db.Column(db.Float)
    co2_saved = db.Column(db.Float)
    
    file_path = db.Column(db.String(500), nullable=True)

    issued_at = db.Column(db.DateTime, default=datetime.utcnow)
