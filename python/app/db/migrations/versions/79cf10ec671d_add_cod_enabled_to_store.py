"""add_cod_enabled_to_store

Revision ID: 79cf10ec671d
Revises: 6b5a4b735ac2
Create Date: 2026-02-04 05:50:25

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '79cf10ec671d'
down_revision = '6b5a4b735ac2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add cod_enabled column to store table
    # Default to false (COD disabled) for all existing stores
    op.add_column('store', sa.Column('cod_enabled', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
    # Drop the cod_enabled column
    op.drop_column('store', 'cod_enabled')
