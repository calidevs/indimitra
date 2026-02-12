"""add_encrypted_square_credentials_to_store

Revision ID: 6b5a4b735ac2
Revises: e9f963a9f687
Create Date: 2026-02-04 02:03:19

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '6b5a4b735ac2'
down_revision = 'e9f963a9f687'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add encrypted Square credential columns to store table
    # Note: These use sa.Text() in the migration, but EncryptedType at the ORM layer
    op.add_column('store', sa.Column('square_access_token', sa.Text(), nullable=True))
    op.add_column('store', sa.Column('square_refresh_token', sa.Text(), nullable=True))
    op.add_column('store', sa.Column('square_merchant_id', sa.Text(), nullable=True))
    op.add_column('store', sa.Column('square_location_id', sa.Text(), nullable=True))
    op.add_column('store', sa.Column('square_application_id', sa.String(), nullable=True))
    op.add_column('store', sa.Column('is_square_connected', sa.Boolean(), nullable=False, server_default='false'))

    # Enable RLS on store table for tenant isolation
    op.execute('ALTER TABLE store ENABLE ROW LEVEL SECURITY')

    # Policy: stores can only access their own row
    # current_setting with 'true' second arg returns NULL instead of error if not set
    op.execute("""
        CREATE POLICY store_tenant_isolation ON store
        FOR ALL
        USING (
            current_setting('app.current_tenant_id', true) IS NULL
            OR id = current_setting('app.current_tenant_id', true)::INTEGER
        )
    """)


def downgrade() -> None:
    # Drop RLS policy and disable RLS
    op.execute('DROP POLICY IF EXISTS store_tenant_isolation ON store')
    op.execute('ALTER TABLE store DISABLE ROW LEVEL SECURITY')

    # Drop columns
    op.drop_column('store', 'is_square_connected')
    op.drop_column('store', 'square_application_id')
    op.drop_column('store', 'square_location_id')
    op.drop_column('store', 'square_merchant_id')
    op.drop_column('store', 'square_refresh_token')
    op.drop_column('store', 'square_access_token')
