"""add role-specific fields to users

Revision ID: d4e5f6a7b8c9
Revises: c3b7b2e2c8f4
Create Date: 2026-02-28 21:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd4e5f6a7b8c9'
down_revision = 'c3b7b2e2c8f4'
branch_labels = None
depends_on = None


def upgrade():
    # Collector fields
    op.add_column('users', sa.Column('vehicle_type', sa.String(50), nullable=True))
    op.add_column('users', sa.Column('license_number', sa.String(50), nullable=True))
    # Recycler fields
    op.add_column('users', sa.Column('facility_name', sa.String(200), nullable=True))
    op.add_column('users', sa.Column('certification', sa.String(200), nullable=True))


def downgrade():
    op.drop_column('users', 'certification')
    op.drop_column('users', 'facility_name')
    op.drop_column('users', 'license_number')
    op.drop_column('users', 'vehicle_type')
