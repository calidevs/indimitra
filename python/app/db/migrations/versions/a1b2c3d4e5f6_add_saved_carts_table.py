"""add_saved_carts_table

Revision ID: a1b2c3d4e5f6
Revises: c26daec46104
Create Date: 2026-02-06 20:00:00

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = 'c26daec46104'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table('saved_carts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('userId', sa.Integer(), nullable=False),
        sa.Column('storeId', sa.Integer(), nullable=False),
        sa.Column('cartData', sa.JSON(), nullable=False),
        sa.Column('updatedAt', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['userId'], ['users.id']),
        sa.ForeignKeyConstraint(['storeId'], ['store.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('userId', 'storeId', name='uq_user_store_cart')
    )
    op.create_index(op.f('ix_saved_carts_id'), 'saved_carts', ['id'], unique=False)
    op.create_index(op.f('ix_saved_carts_userId'), 'saved_carts', ['userId'], unique=False)
    op.create_index(op.f('ix_saved_carts_storeId'), 'saved_carts', ['storeId'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_saved_carts_storeId'), table_name='saved_carts')
    op.drop_index(op.f('ix_saved_carts_userId'), table_name='saved_carts')
    op.drop_index(op.f('ix_saved_carts_id'), table_name='saved_carts')
    op.drop_table('saved_carts')
