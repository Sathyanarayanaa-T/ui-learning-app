// ============================================================
// AI Tutor — Service Layer (Real API + mock fallback)
// Base URL: http://localhost:8001/api/v1
// ============================================================
import type {
    ChatRequest, ChatMessageResponse,
    ChatHistoryResponse, UsageResponse,
} from '../types/tutor';

const BASE_URL = 'http://localhost:8001/api/v1';

// ─── Mock fallback helpers ────────────────────────────────────
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const mockChatReply = (message: string): ChatMessageResponse => ({
    status: 'success',
    data: {
        reply: `Great question!\n\nHere's what I know about **"${message.slice(0, 40)}..."**:\n\nThis is a demo response — the AI Tutor server at \`localhost:8001\` is not reachable right now.\n\nOnce the backend is running, you'll get real GPT-4o-mini responses here. 🚀`,
        chatId: `mock_${Date.now()}`,
        tokensUsed: 0,
        estimatedCost: 0,
    },
});

const MOCK_HISTORY: ChatHistoryResponse = {
    status: 'success',
    data: [
        {
            chatId: 'mock_h1',
            message: 'What is a closure in JavaScript?',
            reply: 'A **closure** is a function that retains access to its lexical scope.\n\n```js\nfunction outer() {\n  const x = 10;\n  return () => x;\n}\nconsole.log(outer()()); // 10\n```',
            timestamp: new Date(Date.now() - 3_600_000).toISOString(),
        },
    ],
};

export interface TutorApiResult<T> {
    data: T;
    usedMock: boolean;
}

// ─── POST /api/v1/chat/ ───────────────────────────────────────
export async function sendChat(
    req: ChatRequest,
): Promise<TutorApiResult<ChatMessageResponse>> {
    try {
        const res = await fetch(`${BASE_URL}/chat/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req),
        });
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return { data: await res.json(), usedMock: false };
    } catch {
        await delay(900); // realistic typing feel
        return { data: mockChatReply(req.message), usedMock: true };
    }
}

// ─── GET /api/v1/chat/history/{user_id} ──────────────────────
export async function fetchChatHistory(
    userId: string,
): Promise<TutorApiResult<ChatHistoryResponse>> {
    try {
        const res = await fetch(`${BASE_URL}/chat/history/${userId}`);
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return { data: await res.json(), usedMock: false };
    } catch {
        await delay(400);
        return { data: MOCK_HISTORY, usedMock: true };
    }
}

// ─── GET /api/v1/usage/{user_id} ─────────────────────────────
export async function fetchUsage(
    userId: string,
): Promise<TutorApiResult<UsageResponse>> {
    try {
        const res = await fetch(`${BASE_URL}/usage/${userId}`);
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return { data: await res.json(), usedMock: false };
    } catch {
        await delay(300);
        return {
            data: {
                status: 'success',
                data: { userId, totalMessages: 0, tokensUsed: 0, estimatedCost: 0 },
            },
            usedMock: true,
        };
    }
}
