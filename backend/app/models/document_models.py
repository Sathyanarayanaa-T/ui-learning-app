"""Document models for upload, analysis, and Q&A."""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class DocumentUploadResponse(BaseModel):
    """Response after uploading a document."""
    status: str
    document_id: Optional[str] = None
    filename: str
    file_type: str
    content_preview: str
    total_characters: int
    message: str


class DocumentInfo(BaseModel):
    """Information about an uploaded document."""
    id: str
    filename: str
    file_type: str
    uploaded_at: datetime
    content_length: int
    is_analyzed: bool = True


class DocumentQuestion(BaseModel):
    """Question about a document."""
    session_id: str
    document_id: str
    question: str
    mode: Optional[str] = "normal"  # normal, teaching, guiding


class DocumentQuestionResponse(BaseModel):
    """Response to document question."""
    session_id: str
    document_id: str
    question: str
    answer: str
    mode: str
    timestamp: datetime
    document_referenced: bool = True


class DocumentList(BaseModel):
    """List of documents for a session."""
    session_id: str
    documents: list[DocumentInfo]
    total_documents: int
