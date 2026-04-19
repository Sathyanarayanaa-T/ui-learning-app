"""Initialize services package with organized service structure.

Services are organized into three categories:
- core: AI orchestration, prompts, RAG, context
- chatbot: Session management, analytics, documents
- tutor: Adaptive learning, progress, recommendations
"""

# Core AI Services
from .core import (
    AIService,
    ai_service,
    PromptBuilder,
    prompt_builder,
    get_user_context,
    RAGService,
    rag_service
)

# Chatbot Services
from .chatbot import (
    SessionService,
    session_service,
    AnalyticsService,
    analytics_service,
    DocumentService,
    document_service
)

# Tutor Services
from .tutor import (
    generate_learning_path,
    update_user_progress,
    batch_update_progress,
    get_user_statistics,
    generate_study_summary,
    check_user_engagement,
    send_proactive_message
)

__all__ = [
    # Core
    "AIService",
    "ai_service",
    "PromptBuilder",
    "prompt_builder",
    "get_user_context",
    "RAGService",
    "rag_service",
    # Chatbot
    "SessionService",
    "session_service",
    "AnalyticsService",
    "analytics_service",
    "DocumentService",
    "document_service",
    # Tutor
    "generate_learning_path",
    "update_user_progress",
    "batch_update_progress",
    "get_user_statistics",
    "generate_study_summary",
    "check_user_engagement",
    "send_proactive_message"
]
