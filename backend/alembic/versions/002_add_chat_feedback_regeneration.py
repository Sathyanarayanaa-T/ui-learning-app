"""Add chat feedback and regeneration tables for like/dislike and regenerate features.

Revision ID: 002_add_feedback
Revises: 001_initial_migration
Create Date: 2026-04-17 15:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '002_add_feedback'
down_revision: Union[str, None] = '001_initial_migration'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new columns to chats table
    op.add_column('chats', sa.Column('is_regenerated', sa.Boolean(), nullable=True, server_default=sa.literal(False)))
    op.add_column('chats', sa.Column('regeneration_count', sa.Integer(), nullable=True, server_default=sa.literal(0)))
    
    # Create chat_feedbacks table
    op.create_table('chat_feedbacks',
        sa.Column('feedback_id', sa.String(), nullable=False),
        sa.Column('chat_id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('session_id', sa.String(), nullable=False),
        sa.Column('is_liked', sa.Boolean(), nullable=True),
        sa.Column('feedback_text', sa.Text(), nullable=True),
        sa.Column('improvement_suggestions', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['chat_id'], ['chats.chat_id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ),
        sa.ForeignKeyConstraint(['session_id'], ['chat_sessions.session_id'], ),
        sa.PrimaryKeyConstraint('feedback_id'),
        sa.Index('ix_chat_feedbacks_chat_id', 'chat_id')
    )
    
    # Create chat_regenerations table
    op.create_table('chat_regenerations',
        sa.Column('regeneration_id', sa.String(), nullable=False),
        sa.Column('original_chat_id', sa.String(), nullable=False),
        sa.Column('regenerated_chat_id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('session_id', sa.String(), nullable=False),
        sa.Column('reason', sa.String(), nullable=True),
        sa.Column('temperature_adjustment', sa.Float(), nullable=True),
        sa.Column('tokens_used', sa.Integer(), nullable=True),
        sa.Column('cost', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['original_chat_id'], ['chats.chat_id'], ),
        sa.ForeignKeyConstraint(['regenerated_chat_id'], ['chats.chat_id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ),
        sa.ForeignKeyConstraint(['session_id'], ['chat_sessions.session_id'], ),
        sa.PrimaryKeyConstraint('regeneration_id'),
        sa.Index('ix_chat_regenerations_original_chat_id', 'original_chat_id')
    )


def downgrade() -> None:
    # Drop chat_regenerations table
    op.drop_table('chat_regenerations')
    
    # Drop chat_feedbacks table
    op.drop_table('chat_feedbacks')
    
    # Remove columns from chats table
    op.drop_column('chats', 'regeneration_count')
    op.drop_column('chats', 'is_regenerated')
