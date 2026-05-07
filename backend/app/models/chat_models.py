from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime


class ChatRequest(BaseModel):
    """Request model for chat endpoint."""
    session_id: str
    message: str
    mode: Literal["teaching", "guiding", "normal"] = "normal"


class ChatResponse(BaseModel):
    """Response model for chat endpoint."""
    session_id: str
    chat_id: str  # Added for frontend to identify message for feedback/regenerate
    user_message: str
    ai_response: str
    mode: str
    timestamp: datetime


class StreamChatRequest(BaseModel):
    """Request model for streaming chat endpoint."""
    session_id: str
    message: str
    mode: Literal["teaching", "guiding", "normal"] = "normal"


class Message(BaseModel):
    """Individual message in conversation."""
    role: Literal["user", "assistant"]
    content: str
    timestamp: datetime


class ChatHistory(BaseModel):
    """Chat history response."""
    session_id: str
    messages: list[Message]
    total_messages: int


class ChatFeedbackRequest(BaseModel):
    """Request model for chat feedback (like/dislike)."""
    chat_id: str
    session_id: str
    is_liked: Optional[bool]  # True=like, False=dislike, None=neutral
    feedback_text: Optional[str] = None
    improvement_suggestions: Optional[list[str]] = []


class ChatFeedbackResponse(BaseModel):
    """Response model for chat feedback."""
    feedback_id: str
    chat_id: str
    is_liked: Optional[bool]
    feedback_text: Optional[str]
    improvement_suggestions: list[str]
    created_at: datetime


class RegenerateChatRequest(BaseModel):
    """Request model for regenerating a response."""
    chat_id: str
    session_id: str
    reason: Optional[str] = None  # e.g., "too_long", "not_clear", "incorrect"
    temperature: Optional[float] = None  # Optional temperature adjustment


class RegeneratedChatResponse(BaseModel):
    """Response model for regenerated chat."""
    regeneration_id: str
    original_chat_id: str
    regenerated_chat_id: str
    original_response: str
    new_response: str
    reason: Optional[str]
    tokens_used: Optional[int]
    cost: Optional[float]
    timestamp: datetime


class QuizMeRequest(BaseModel):
    """Request model for generating quiz questions."""
    session_id: str
    topic: str
    num_questions: int = 5  # 5-10 questions
    difficulty: Literal["easy", "medium", "hard"] = "medium"


class QuizQuestion(BaseModel):
    """Individual quiz question."""
    question_id: str
    question: str
    options: list[str]  # A, B, C, D options
    correct_answer: Optional[str] = None  # Hidden from user initially


class QuizMeResponse(BaseModel):
    """Response model for quiz generation."""
    quiz_id: str
    session_id: str
    topic: str
    questions: list[QuizQuestion]
    total_questions: int
    difficulty: str
    timestamp: datetime


class QuizAnswerRequest(BaseModel):
    """Request model for submitting quiz answer."""
    session_id: str
    quiz_id: str
    question_id: str
    selected_answer: str  # User's answer (A, B, C, D)


class QuizAnswerResponse(BaseModel):
    """Response model for quiz answer evaluation."""
    question_id: str
    is_correct: bool
    correct_answer: str
    explanation: str
    points_earned: int


class QuizScoreRequest(BaseModel):
    """Request model for getting quiz score."""
    session_id: str
    quiz_id: str


class QuizScoreResponse(BaseModel):
    """Response model for quiz score."""
    quiz_id: str
    topic: str
    total_questions: int
    correct_answers: int
    score_percentage: float
    feedback: str
    timestamp: datetime


class SummarizeRequest(BaseModel):
    """Request model for summarizing conversation."""
    session_id: str
    include_quiz: bool = False  # Include quiz results in summary


class SummarizeResponse(BaseModel):
    """Response model for conversation summary."""
    session_id: str
    summary: str
    key_points: list[str]
    topics_covered: list[str]
    learning_progress: str
    recommendations: list[str]
    timestamp: datetime

