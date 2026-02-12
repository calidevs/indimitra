"""add_images_column_to_store

Revision ID: 3ffe09b7cada
Revises: 0f26238307fc
Create Date: 2026-02-01 02:07:01.367176

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '3ffe09b7cada'
down_revision = '0f26238307fc'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('store', sa.Column('images', sa.ARRAY(sa.String()), nullable=True))


def downgrade() -> None:
    op.drop_column('store', 'images')
