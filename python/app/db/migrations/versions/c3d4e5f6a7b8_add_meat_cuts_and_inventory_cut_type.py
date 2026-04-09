"""add_meat_cuts_and_inventory_meat_cuts_join_table

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-04-08 00:00:00

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c3d4e5f6a7b8'
down_revision = 'b2c3d4e5f6a7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'meat_cuts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('label', sa.String(), nullable=False),
        sa.Column('text', sa.String(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_meat_cuts_id'), 'meat_cuts', ['id'], unique=False)

    op.create_table(
        'inventory_meat_cuts',
        sa.Column('inventory_id', sa.Integer(), nullable=False),
        sa.Column('meat_cut_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['inventory_id'], ['inventory.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['meat_cut_id'], ['meat_cuts.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('inventory_id', 'meat_cut_id'),
    )
    op.create_index(
        op.f('ix_inventory_meat_cuts_inventory_id'),
        'inventory_meat_cuts',
        ['inventory_id'],
        unique=False,
    )
    op.create_index(
        op.f('ix_inventory_meat_cuts_meat_cut_id'),
        'inventory_meat_cuts',
        ['meat_cut_id'],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f('ix_inventory_meat_cuts_meat_cut_id'), table_name='inventory_meat_cuts')
    op.drop_index(op.f('ix_inventory_meat_cuts_inventory_id'), table_name='inventory_meat_cuts')
    op.drop_table('inventory_meat_cuts')
    op.drop_index(op.f('ix_meat_cuts_id'), table_name='meat_cuts')
    op.drop_table('meat_cuts')
