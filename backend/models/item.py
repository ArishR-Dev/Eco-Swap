from extensions import db
import uuid

def uuid_str():
    return str(uuid.uuid4())

class EWasteItem(db.Model):
    __tablename__ = "ewaste_items"

    id = db.Column(db.String(36), primary_key=True, default=uuid_str)
    pickup_id = db.Column(db.String(36), db.ForeignKey("pickup_requests.id"))

    category = db.Column(db.String(50))
    quantity = db.Column(db.Integer, default=1)
    estimated_weight = db.Column(db.Float)
