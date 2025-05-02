"""Alter profile_image column type

Revision ID: alter_profile_image_column
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.mysql import MEDIUMTEXT

def upgrade():
    # Modify column type to MEDIUMTEXT
    op.alter_column('users', 'profile_image',
                    existing_type=sa.Text(),
                    type_=MEDIUMTEXT,
                    existing_nullable=True)

def downgrade():
    # Convert back to TEXT if needed
    op.alter_column('users', 'profile_image',
                    existing_type=MEDIUMTEXT,
                    type_=sa.Text(),
                    existing_nullable=True) 