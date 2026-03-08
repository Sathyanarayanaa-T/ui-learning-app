// ============================================================
// AI Tutor — TypeScript Interfaces (Real API)
// Base URL: http://localhost:8001/api/v1
// ============================================================

// ─── Request Models ──────────────────────────────────────────

export interface ChatRequest {
    userId: string;
    topicId: string;  // Frontend-defined topic slug, e.g. "react-hooks"
    message: string;
}

// ─── Response Models ─────────────────────────────────────────

export interface ChatReply {
    reply: string;          // Markdown — always render with a Markdown lib
    chatId: string;         // UUID assigned by backend
    tokensUsed: number;
    estimatedCost: number;
}

export interface ChatMessageResponse {
    status: string;
    data: ChatReply;
}

export interface HistoryItem {
    chatId: string;
    message: string;
    reply: string;          // Markdown
    timestamp: string;      // ISO 8601 UTC
}

export interface ChatHistoryResponse {
    status: string;
    data: HistoryItem[];
}

export interface UsageData {
    userId: string;
    totalMessages: number;
    tokensUsed: number;
    estimatedCost: number;
}

export interface UsageResponse {
    status: string;
    data: UsageData;
}

// ─── Local (UI) Models ────────────────────────────────────────
// These exist only in the frontend; they are not API shapes.

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    text: string;
    timestamp: string;
    tokensUsed?: number;    // populated on assistant messages
}

// topic is a local UI concept: user types free text, we slug-ify it as topicId
export interface TutorSession {
    topicId: string;   // slug sent to API
    topicLabel: string; // human-readable label shown in the chat header
}
