"""add_subdomain_to_store

Revision ID: c26daec46104
Revises: 79cf10ec671d
Create Date: 2026-02-06 17:35:08

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c26daec46104'
down_revision = '79cf10ec671d'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add subdomain column to store table
    # Nullable initially to allow existing stores, will be populated later
    op.add_column('store', sa.Column('subdomain', sa.String(), nullable=True))

    # Create unique index on subdomain
    op.create_index('ix_store_subdomain', 'store', ['subdomain'], unique=True)


def downgrade() -> None:
    # Drop the index first
    op.drop_index('ix_store_subdomain', table_name='store')

    # Drop the subdomain column
    op.drop_column('store', 'subdomain')
