"""add_order_item_instructions_and_allow_substitute

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-04-09 00:30:00

Adds per-line-item customer instructions and a substitution preference
(replace with similar if unavailable vs. cancel the item) to order_items.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e5f6a7b8c9d0'
down_revision = 'd4e5f6a7b8c9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'order_items',
        sa.Column('instructions', sa.String(), nullable=True),
    )
    op.add_column(
        'order_items',
        sa.Column(
            'allow_substitute',
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )
    # Drop the server default now that existing rows have been backfilled,
    # so future inserts rely on the application-level default.
    op.alter_column('order_items', 'allow_substitute', server_default=None)


def downgrade() -> None:
    op.drop_column('order_items', 'allow_substitute')
    op.drop_column('order_items', 'instructions')
