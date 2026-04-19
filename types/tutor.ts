// ============================================================
// AI Tutor — TypeScript Interfaces (New API)
// Base URL: http://localhost:8001/api/v1
// ============================================================

export type ChatMode = 'normal' | 'teaching' | 'guiding';

// ─── Request Models ──────────────────────────────────────────

export interface ChatRequest {
    session_id: string;
    message: string;
    mode: ChatMode;
}

export interface DocumentQuestionRequest {
    session_id: string;
    document_id: string;
    question: string;
    mode: ChatMode;
}

// ─── Response Models ─────────────────────────────────────────

export interface ChatResponse {
    session_id: string;
    chat_id: string;  // Added for feedback/regenerate tracking
    user_message: string;
    ai_response: string;
    mode: string;
    timestamp: string;
    tokens_used: number;
}

export interface SessionCreateResponse {
    session_id: string;
    created_at: string;
    status: 'active' | 'closed';
}

export interface HistoryMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

export interface ChatHistoryResponse {
    session_id: string;
    messages: HistoryMessage[];
    total_messages: number;
    session_duration_minutes?: number;
}

export interface DocumentUploadResponse {
    status: string;
    document_id: string;
    filename: string;
    file_type: string;
    content_preview: string;
    total_characters: number;
    message: string;
}

export interface DocumentQuestionResponse {
    session_id: string;
    document_id: string;
    question: string;
    answer: string;
    mode: string;
    timestamp: string;
    document_referenced: boolean;
}

export interface ChatFeedbackResponse {
    feedback_id: string;
    chat_id: string;
    is_liked: boolean | null;
    feedback_text?: string;
    improvement_suggestions?: string[];
    created_at: string;
}

export interface RegeneratedChatResponse {
    regeneration_id: string;
    original_chat_id: string;
    regenerated_chat_id: string;
    original_response: string;
    new_response: string;
    reason?: string;
    tokens_used?: number;
    timestamp: string;
}

// ─── Local (UI) Models ────────────────────────────────────────
// These exist only in the frontend; they are not API shapes.

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    text: string;
    timestamp: string;
    tokensUsed?: number;
    feedback?: 'like' | 'dislike';
    chatId?: string;  // Backend chat ID for feedback/regenerate
}

export interface LocalSession {
    session_id: string;
    title: string;       // Dynamic local name, set on first message
    createdAt: string;
    messageCount: number;
    mode?: ChatMode;
}
