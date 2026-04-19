// ============================================================
// AI Tutor — Service Layer (Live API)
// ============================================================
import { Platform } from 'react-native';
import type {
    ChatRequest, ChatResponse,
    SessionCreateResponse, ChatHistoryResponse,
    DocumentUploadResponse, DocumentQuestionRequest, DocumentQuestionResponse,
    ChatFeedbackResponse, RegeneratedChatResponse,
} from '../types/tutor';

// Configure base URL based on platform for local development
const API_BASE_URL = Platform.OS === 'android' 
    ? 'http://10.0.2.2:8000' 
    : 'http://localhost:8000';

// ─── POST /session/create ──────────────────────────────────────
export async function createSession(): Promise<SessionCreateResponse> {
    const res = await fetch(`${API_BASE_URL}/session/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
}

// ─── POST /ai/chat ─────────────────────────────────────────────
export async function sendChat(req: ChatRequest): Promise<ChatResponse> {
    const res = await fetch(`${API_BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
}

// ─── GET /ai/chat/history/{session_id} ────────────────────────
export async function getHistory(session_id: string): Promise<ChatHistoryResponse> {
    const res = await fetch(`${API_BASE_URL}/ai/chat/history/${session_id}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
}

// ─── POST /documents/upload ──────────────────────────────────
export async function uploadDocument(doc: any, session_id: string): Promise<DocumentUploadResponse> {
    const formData = new FormData();
    
    if (Platform.OS === 'web' && doc.file) {
        // Native web javascript File object
        formData.append('file', doc.file);
    } else {
        // Native Mobile (iOS/Android) 
        formData.append('file', {
            uri: Platform.OS === 'ios' ? doc.uri.replace('file://', '') : doc.uri,
            type: doc.mimeType || 'application/octet-stream',
            name: doc.name,
        } as any);
    }

    const res = await fetch(`${API_BASE_URL}/documents/upload?session_id=${session_id}`, {
        method: 'POST',
        body: formData,
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
}

// ─── POST /documents/ask ─────────────────────────────────────
export async function askDocumentQuestion(req: DocumentQuestionRequest): Promise<DocumentQuestionResponse> {
    const res = await fetch(`${API_BASE_URL}/documents/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
}

// ─── POST /ai/chat/{chat_id}/feedback ───────────────────────
export async function submitChatFeedback(
    chatId: string,
    sessionId: string,
    isLiked: boolean | null,
    feedbackText?: string,
    improvementSuggestions?: string[]
): Promise<ChatFeedbackResponse> {
    const res = await fetch(`${API_BASE_URL}/ai/chat/${chatId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            session_id: sessionId,
            is_liked: isLiked,
            feedback_text: feedbackText,
            improvement_suggestions: improvementSuggestions || [],
        }),
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
}

// ─── POST /ai/chat/{chat_id}/regenerate ────────────────────
export async function regenerateChatResponse(
    chatId: string,
    sessionId: string,
    reason?: string,
    temperature?: number
): Promise<RegeneratedChatResponse> {
    const res = await fetch(`${API_BASE_URL}/ai/chat/${chatId}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            session_id: sessionId,
            reason: reason,
            temperature: temperature,
        }),
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
}
