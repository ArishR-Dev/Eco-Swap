from extensions import db
from datetime import datetime
import uuid

def uuid_str():
    return str(uuid.uuid4())

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True, default=uuid_str)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    address = db.Column(db.Text, nullable=False)

    role = db.Column(db.Enum("ADMIN", "USER", "COLLECTOR", "RECYCLER"), default="USER")
    avatar = db.Column(db.String(500))

    is_active = db.Column(db.Boolean, default=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Collector-specific fields
    vehicle_type = db.Column(db.String(50), nullable=True)
    license_number = db.Column(db.String(50), nullable=True)

    # Recycler-specific fields
    facility_name = db.Column(db.String(200), nullable=True)
    certification = db.Column(db.String(200), nullable=True)
