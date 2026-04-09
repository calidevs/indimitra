"""add_meat_cut_id_to_order_items

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-04-08 21:30:00

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd4e5f6a7b8c9'
down_revision = 'c3d4e5f6a7b8'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'order_items',
        sa.Column('meatCutId', sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        'fk_order_items_meat_cut_id',
        'order_items',
        'meat_cuts',
        ['meatCutId'],
        ['id'],
        ondelete='SET NULL',
    )


def downgrade() -> None:
    op.drop_constraint('fk_order_items_meat_cut_id', 'order_items', type_='foreignkey')
    op.drop_column('order_items', 'meatCutId')
