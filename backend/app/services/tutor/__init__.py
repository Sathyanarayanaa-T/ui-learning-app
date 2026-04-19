"""Tutor Services - Adaptive learning, progress tracking, and recommendations."""

from .learning_path_service import generate_learning_path
from .progress_service import update_user_progress, batch_update_progress, get_user_statistics, get_topic_progress
from .summary_service import generate_study_summary
from .proactive_service import check_user_engagement, send_proactive_message, generate_nudges, get_active_nudges, acknowledge_nudge

__all__ = [
    "generate_learning_path",
    "update_user_progress",
    "batch_update_progress",
    "get_user_statistics",
    "get_topic_progress",
    "generate_study_summary",
    "check_user_engagement",
    "send_proactive_message",
    "generate_nudges",
    "get_active_nudges",
    "acknowledge_nudge"
]
