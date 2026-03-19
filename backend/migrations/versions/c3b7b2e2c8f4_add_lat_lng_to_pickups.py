"""add latitude/longitude to pickup_requests

Revision ID: c3b7b2e2c8f4
Revises: fb0e38cd501c
Create Date: 2026-02-28 20:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "c3b7b2e2c8f4"
down_revision = "fb0e38cd501c"
branch_labels = None
depends_on = None


def upgrade():
  op.add_column(
      "pickup_requests",
      sa.Column("latitude", sa.Float(), nullable=True),
  )
  op.add_column(
      "pickup_requests",
      sa.Column("longitude", sa.Float(), nullable=True),
  )


def downgrade():
  op.drop_column("pickup_requests", "longitude")
  op.drop_column("pickup_requests", "latitude")

