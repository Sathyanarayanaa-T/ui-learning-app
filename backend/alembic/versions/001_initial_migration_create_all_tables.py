"""Initial migration create all tables.

Revision ID: 001_initial_migration  
Revises: 
Create Date: 2026-04-03 21:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_initial_migration'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create skill_level enum type
    sa.Enum('beginner', 'intermediate', 'advanced', name='skilllevel').create(op.get_bind(), checkfirst=True)
    
    # Create learning_mode enum type
    sa.Enum('teaching', 'guiding', 'normal', name='learningmode').create(op.get_bind(), checkfirst=True)
    
    # Create users table
    op.create_table('users',
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('username', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('skill_level', sa.Enum('beginner', 'intermediate', 'advanced', name='skilllevel'), nullable=False),
        sa.Column('preferences', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('user_id'),
        sa.UniqueConstraint('username'),
        sa.UniqueConstraint('email')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=False)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=False)

    # Create user_progress table
    op.create_table('user_progress',
        sa.Column('progress_id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('topic_id', sa.String(), nullable=False),
        sa.Column('score', sa.Float(), nullable=True),
        sa.Column('attempts', sa.Integer(), nullable=True),
        sa.Column('correct_answers', sa.Integer(), nullable=True),
        sa.Column('total_questions', sa.Integer(), nullable=True),
        sa.Column('time_spent', sa.Integer(), nullable=True),
        sa.Column('last_attempted', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ),
        sa.PrimaryKeyConstraint('progress_id')
    )
    op.create_index(op.f('ix_user_progress_topic_id'), 'user_progress', ['topic_id'], unique=False)
    op.create_index(op.f('ix_user_progress_user_id'), 'user_progress', ['user_id'], unique=False)

    # Create chat_sessions table
    op.create_table('chat_sessions',
        sa.Column('session_id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('mode', sa.Enum('teaching', 'guiding', 'normal', name='learningmode'), nullable=True),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('last_activity', sa.DateTime(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('context', sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ),
        sa.PrimaryKeyConstraint('session_id')
    )
    op.create_index(op.f('ix_chat_sessions_user_id'), 'chat_sessions', ['user_id'], unique=False)

    # Create chats table
    op.create_table('chats',
        sa.Column('chat_id', sa.String(), nullable=False),
        sa.Column('session_id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('topic_id', sa.String(), nullable=True),
        sa.Column('user_message', sa.Text(), nullable=False),
        sa.Column('ai_response', sa.Text(), nullable=True),
        sa.Column('mode', sa.Enum('teaching', 'guiding', 'normal', name='learningmode'), nullable=True),
        sa.Column('model', sa.String(), nullable=True),
        sa.Column('tokens_used', sa.Integer(), nullable=True),
        sa.Column('cost', sa.Float(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['session_id'], ['chat_sessions.session_id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ),
        sa.PrimaryKeyConstraint('chat_id')
    )
    op.create_index(op.f('ix_chats_session_id'), 'chats', ['session_id'], unique=False)
    op.create_index(op.f('ix_chats_timestamp'), 'chats', ['timestamp'], unique=False)
    op.create_index(op.f('ix_chats_topic_id'), 'chats', ['topic_id'], unique=False)
    op.create_index(op.f('ix_chats_user_id'), 'chats', ['user_id'], unique=False)

    # Create documents table
    op.create_table('documents',
        sa.Column('document_id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('file_path', sa.String(), nullable=True),
        sa.Column('document_type', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ),
        sa.PrimaryKeyConstraint('document_id')
    )
    op.create_index(op.f('ix_documents_user_id'), 'documents', ['user_id'], unique=False)

    # Create topics table
    op.create_table('topics',
        sa.Column('topic_id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('difficulty_level', sa.Enum('beginner', 'intermediate', 'advanced', name='skilllevel'), nullable=True),
        sa.Column('prerequisites', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('topic_id'),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_topics_name'), 'topics', ['name'], unique=False)

    # Create learning_paths table
    op.create_table('learning_paths',
        sa.Column('path_id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('topics', sa.JSON(), nullable=False),
        sa.Column('recommended_at', sa.DateTime(), nullable=True),
        sa.Column('completed', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ),
        sa.PrimaryKeyConstraint('path_id')
    )
    op.create_index(op.f('ix_learning_paths_user_id'), 'learning_paths', ['user_id'], unique=False)

    # Create recommendations table
    op.create_table('recommendations',
        sa.Column('recommendation_id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('topic_id', sa.String(), nullable=False),
        sa.Column('recommendation_type', sa.String(), nullable=False),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('confidence_score', sa.Float(), nullable=True),
        sa.Column('acknowledged', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['topic_id'], ['topics.topic_id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ),
        sa.PrimaryKeyConstraint('recommendation_id')
    )
    op.create_index(op.f('ix_recommendations_topic_id'), 'recommendations', ['topic_id'], unique=False)
    op.create_index(op.f('ix_recommendations_user_id'), 'recommendations', ['user_id'], unique=False)

    # Create quizzes table
    op.create_table('quizzes',
        sa.Column('quiz_id', sa.String(), nullable=False),
        sa.Column('topic_id', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('questions', sa.JSON(), nullable=False),
        sa.Column('passing_score', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['topic_id'], ['topics.topic_id'], ),
        sa.PrimaryKeyConstraint('quiz_id')
    )
    op.create_index(op.f('ix_quizzes_topic_id'), 'quizzes', ['topic_id'], unique=False)

    # Create quiz_results table
    op.create_table('quiz_results',
        sa.Column('result_id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('quiz_id', sa.String(), nullable=False),
        sa.Column('score', sa.Float(), nullable=False),
        sa.Column('answers', sa.JSON(), nullable=False),
        sa.Column('time_taken', sa.Integer(), nullable=True),
        sa.Column('passed', sa.Boolean(), nullable=False),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['quiz_id'], ['quizzes.quiz_id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ),
        sa.PrimaryKeyConstraint('result_id')
    )
    op.create_index(op.f('ix_quiz_results_quiz_id'), 'quiz_results', ['quiz_id'], unique=False)
    op.create_index(op.f('ix_quiz_results_user_id'), 'quiz_results', ['user_id'], unique=False)

    # Create feedbacks table
    op.create_table('feedbacks',
        sa.Column('feedback_id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('topic_id', sa.String(), nullable=False),
        sa.Column('feedback_type', sa.String(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('severity', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['topic_id'], ['topics.topic_id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ),
        sa.PrimaryKeyConstraint('feedback_id')
    )
    op.create_index(op.f('ix_feedbacks_topic_id'), 'feedbacks', ['topic_id'], unique=False)
    op.create_index(op.f('ix_feedbacks_user_id'), 'feedbacks', ['user_id'], unique=False)

    # Create analytics table
    op.create_table('analytics',
        sa.Column('analytics_id', sa.String(), nullable=False),
        sa.Column('session_id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('endpoint', sa.String(), nullable=False),
        sa.Column('query', sa.Text(), nullable=False),
        sa.Column('response_time', sa.Float(), nullable=True),
        sa.Column('tokens_used', sa.Integer(), nullable=True),
        sa.Column('cost', sa.Float(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['session_id'], ['chat_sessions.session_id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ),
        sa.PrimaryKeyConstraint('analytics_id')
    )
    op.create_index(op.f('ix_analytics_session_id'), 'analytics', ['session_id'], unique=False)
    op.create_index(op.f('ix_analytics_timestamp'), 'analytics', ['timestamp'], unique=False)
    op.create_index(op.f('ix_analytics_user_id'), 'analytics', ['user_id'], unique=False)

    # Create nudges table
    op.create_table('nudges',
        sa.Column('nudge_id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('nudge_type', sa.String(), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('context', sa.JSON(), nullable=True),
        sa.Column('acknowledged', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('acknowledged_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ),
        sa.PrimaryKeyConstraint('nudge_id')
    )
    op.create_index(op.f('ix_nudges_user_id'), 'nudges', ['user_id'], unique=False)


def downgrade() -> None:
    # Drop all indexes and tables in reverse order
    op.drop_index(op.f('ix_nudges_user_id'), table_name='nudges')
    op.drop_table('nudges')
    
    op.drop_index(op.f('ix_analytics_user_id'), table_name='analytics')
    op.drop_index(op.f('ix_analytics_timestamp'), table_name='analytics')
    op.drop_index(op.f('ix_analytics_session_id'), table_name='analytics')
    op.drop_table('analytics')
    
    op.drop_index(op.f('ix_feedbacks_user_id'), table_name='feedbacks')
    op.drop_index(op.f('ix_feedbacks_topic_id'), table_name='feedbacks')
    op.drop_table('feedbacks')
    
    op.drop_index(op.f('ix_quiz_results_user_id'), table_name='quiz_results')
    op.drop_index(op.f('ix_quiz_results_quiz_id'), table_name='quiz_results')
    op.drop_table('quiz_results')
    
    op.drop_index(op.f('ix_quizzes_topic_id'), table_name='quizzes')
    op.drop_table('quizzes')
    
    op.drop_index(op.f('ix_recommendations_user_id'), table_name='recommendations')
    op.drop_index(op.f('ix_recommendations_topic_id'), table_name='recommendations')
    op.drop_table('recommendations')
    
    op.drop_index(op.f('ix_learning_paths_user_id'), table_name='learning_paths')
    op.drop_table('learning_paths')
    
    op.drop_index(op.f('ix_topics_name'), table_name='topics')
    op.drop_table('topics')
    
    op.drop_index(op.f('ix_documents_user_id'), table_name='documents')
    op.drop_table('documents')
    
    op.drop_index(op.f('ix_chats_user_id'), table_name='chats')
    op.drop_index(op.f('ix_chats_topic_id'), table_name='chats')
    op.drop_index(op.f('ix_chats_timestamp'), table_name='chats')
    op.drop_index(op.f('ix_chats_session_id'), table_name='chats')
    op.drop_table('chats')
    
    op.drop_index(op.f('ix_chat_sessions_user_id'), table_name='chat_sessions')
    op.drop_table('chat_sessions')
    
    op.drop_index(op.f('ix_user_progress_user_id'), table_name='user_progress')
    op.drop_index(op.f('ix_user_progress_topic_id'), table_name='user_progress')
    op.drop_table('user_progress')
    
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
    
    # Drop enums
    sa.Enum('beginner', 'intermediate', 'advanced', name='skilllevel').drop(op.get_bind(), checkfirst=True)
    sa.Enum('teaching', 'guiding', 'normal', name='learningmode').drop(op.get_bind(), checkfirst=True)
