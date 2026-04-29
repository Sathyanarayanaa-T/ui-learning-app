// ============================================================
// Chatbot Store — Zustand Store for Chat Tab History
// ============================================================
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ChatMessage, LocalSession } from '../types/tutor';
import { createSession, sendChat, getHistory } from '../services/tutorService';

const mkId = () => `${Date.now()}_${Math.random().toString(36).slice(2)}`;

const CHATBOT_SESSIONS_KEY = 'chatbot_recent_sessions';
const CHATBOT_SESSION_CACHE_KEY = (sessionId: string) => `chatbot_session_cache_${sessionId}`;

// ─── Internal Storage Helpers ─────────────────────────────────

async function persistSessions(sessions: LocalSession[]) {
    try { await AsyncStorage.setItem(CHATBOT_SESSIONS_KEY, JSON.stringify(sessions)); } catch (_) { }
}

async function persistSessionCache(sessionId: string, messages: ChatMessage[]) {
    try { await AsyncStorage.setItem(CHATBOT_SESSION_CACHE_KEY(sessionId), JSON.stringify(messages)); } catch (_) { }
}

async function loadSessionCache(sessionId: string): Promise<ChatMessage[]> {
    try {
        const raw = await AsyncStorage.getItem(CHATBOT_SESSION_CACHE_KEY(sessionId));
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

// ─── Store Interface ──────────────────────────────────────────

interface ChatbotState {
    // ── Sessions & History ────────────────────────────────────
    sessions: LocalSession[];
    loadSessions: () => Promise<void>;
    removeSession: (sessionId: string) => Promise<void>;

    // ── Active Chat State ─────────────────────────────────────
    activeSessionId: string | null;
    activeSessionTitle: string;
    
    isStarting: boolean;
    startNewSession: () => Promise<void>;
    
    isRestoring: boolean;
    restoreSession: (session: LocalSession) => Promise<void>;

    clearActiveChat: () => void; // Go back to history view

    // ── Messages ─────────────────────────────────────────────
    messages: ChatMessage[];
    isTyping: boolean;
    sendMessage: (text: string) => Promise<void>;
    
    // ── Message Actions ──────────────────────────────────────
    setMessages: (messages: ChatMessage[]) => void;
    setTyping: (isTyping: boolean) => void;
    appendError: (errorMsg: ChatMessage) => void;
    regenerateMessage: (messageId: string) => Promise<void>;
    editingMessageId: string | null;
    setEditingMessageId: (id: string | null) => void;
    editMessage: (messageId: string, newText: string) => Promise<void>;
}

// ─── Store Implementation ──────────────────────────────────────

export const useChatbotStore = create<ChatbotState>((set, get) => ({
    // ── Sessions & History
    sessions: [],

    loadSessions: async () => {
        try {
            const raw = await AsyncStorage.getItem(CHATBOT_SESSIONS_KEY);
            const loaded: LocalSession[] = raw ? JSON.parse(raw) : [];
            set({ sessions: loaded });
        } catch (_) { }
    },

    removeSession: async (sessionId) => {
        const updated = get().sessions.filter((s) => s.session_id !== sessionId);
        set({ sessions: updated });
        await persistSessions(updated);
        try { await AsyncStorage.removeItem(CHATBOT_SESSION_CACHE_KEY(sessionId)); } catch (_) { }
    },

    // ── Active Chat State
    activeSessionId: null,
    activeSessionTitle: '',

    isStarting: false,

    startNewSession: async () => {
        set({ isStarting: true });
        try {
            const res = await createSession();
            
            const introMsg: ChatMessage = {
                id: mkId(),
                role: 'assistant',
                text: "Hi! I'm Ask Lumi. Ask me anything — I'm here to help!",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };

            set({
                activeSessionId: res.session_id,
                activeSessionTitle: '', // Will be set on first message
                messages: [introMsg],
                isStarting: false,
            });
            
            await persistSessionCache(res.session_id, [introMsg]);
        } catch (error) {
            console.error("Failed to create session", error);
            set({ isStarting: false });
        }
    },

    isRestoring: false,

    restoreSession: async (session) => {
        set({
            isRestoring: true,
            activeSessionId: session.session_id,
            activeSessionTitle: session.title,
            messages: []
        });

        // Try local cache first
        let msgs = await loadSessionCache(session.session_id);
        
        // If empty locally, fallback to mock API
        if (msgs.length === 0) {
            try {
                const historyRes = await getHistory(session.session_id);
                msgs = historyRes.messages.map((m, i) => ({
                    id: `${m.timestamp}_${i}`,
                    role: m.role,
                    text: m.content,
                    timestamp: m.timestamp, // Ensure proper formatting
                }));
                // Save it back to cache
                await persistSessionCache(session.session_id, msgs);
            } catch (err) {
                console.error("Failed to load history", err);
            }
        }

        set({ messages: msgs, isRestoring: false });
    },

    clearActiveChat: () => set({ activeSessionId: null, activeSessionTitle: '', messages: [] }),

    // ── Messages
    messages: [],
    isTyping: false,

    sendMessage: async (text) => {
        const { activeSessionId, sessions, activeSessionTitle } = get();
        if (!activeSessionId) return;

        // 1. Add user message locally
        const userMsg: ChatMessage = { 
            id: mkId(), 
            role: 'user', 
            text, 
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        };
        
        // 2. Resolve title (first message defines title if currently empty)
        let newTitle = activeSessionTitle;
        let isFirstMessage = false;
        if (!newTitle) {
            newTitle = text;
            isFirstMessage = true;
        }

        set((s) => ({
            messages: [...s.messages, userMsg],
            activeSessionTitle: newTitle,
            isTyping: true 
        }));

        // 3. Update session list if it was a new session or we need to update message count
        const currentMessagesCount = get().messages.length;
        let updatedSessions = [...sessions];
        
        if (isFirstMessage) {
            updatedSessions.unshift({
                session_id: activeSessionId,
                title: newTitle,
                createdAt: new Date().toISOString(),
                messageCount: 1,
                mode: 'normal', // Used as identifier for standard chat
            });
        } else {
            updatedSessions = updatedSessions.map(s => 
                s.session_id === activeSessionId ? { ...s, messageCount: Math.ceil(currentMessagesCount / 2) } : s
            );
        }
        set({ sessions: updatedSessions });
        await persistSessions(updatedSessions);

        // 4. Send to backend
        try {
            const apiRes = await sendChat({
                session_id: activeSessionId,
                message: text,
                mode: 'normal'
            });

            const aiMsg: ChatMessage = {
                id: apiRes.chat_id || mkId(),
                role: 'assistant',
                text: apiRes.ai_response,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                tokensUsed: apiRes.tokens_used,
                chatId: apiRes.chat_id,
            };

            set((s) => {
                const finalMessages = [...s.messages, aiMsg];
                persistSessionCache(activeSessionId, finalMessages);
                return { messages: finalMessages, isTyping: false };
            });
            
        } catch (error) {
            set((s) => {
                // Return an error message directly.
                // We'll map this differently in UI or just show generic text.
                return { isTyping: false };
            });
            throw error; // Rethrow so UI can handle if needed
        }
    },
    
    regenerateMessage: async (messageId) => {
        const { activeSessionId, messages } = get();
        if (!activeSessionId) return;

        const targetIndex = messages.findIndex(m => m.id === messageId);
        if (targetIndex === -1) return;

        const targetMessage = messages[targetIndex];

        let userText = '';
        for (let i = targetIndex - 1; i >= 0; i--) {
            if (messages[i].role === 'user') {
                userText = messages[i].text;
                break;
            }
        }
        if (!userText) return;

        set({ isTyping: true });

        // Remove the AI message we are regenerating if it's the last one
        if (targetIndex === messages.length - 1) {
            set((s) => ({ messages: s.messages.slice(0, -1) }));
        }

        try {
            // Note: Since this is a simple chat, we just resend the userText as a normal chat
            // In tutor.ts, there's a regenerateChatResponse endpoint, but ChatbotScreen uses sendChat.
            // Using sendChat directly for simplicity unless there's a specific requirement.
            const apiRes = await sendChat({
                session_id: activeSessionId,
                message: userText,
                mode: 'normal'
            });

            const aiMsg: ChatMessage = {
                id: apiRes.chat_id || mkId(),
                role: 'assistant',
                text: apiRes.ai_response,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                tokensUsed: apiRes.tokens_used,
                chatId: apiRes.chat_id,
            };

            set((s) => {
                const currentMessages = s.messages;
                const finalMessages = [...currentMessages, aiMsg];
                persistSessionCache(activeSessionId, finalMessages);
                return { messages: finalMessages, isTyping: false };
            });
            
        } catch (error) {
            console.error("Regenerate error:", error);
            set({ isTyping: false });
        }
    },

    editingMessageId: null,
    setEditingMessageId: (id) => set({ editingMessageId: id }),
    editMessage: async (messageId, newText) => {
        const { activeSessionId, messages } = get();
        if (!activeSessionId) return;

        const targetIndex = messages.findIndex(m => m.id === messageId);
        if (targetIndex === -1 || messages[targetIndex].role !== 'user') return;

        const hasAiResponse = targetIndex - 1 >= 0 && messages[targetIndex - 1].role === 'assistant';
        
        const updatedMessages = [...messages];
        updatedMessages[targetIndex] = { ...updatedMessages[targetIndex], text: newText, content: newText };
        if (hasAiResponse) {
            updatedMessages.splice(targetIndex - 1, 1);
        }

        set({ messages: updatedMessages, isTyping: true });

        try {
            const apiRes = await sendChat({
                session_id: activeSessionId,
                message: newText,
                mode: 'normal'
            });

            const aiMsg: ChatMessage = {
                id: apiRes.chat_id || mkId(),
                role: 'assistant',
                text: apiRes.ai_response,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                tokensUsed: apiRes.tokens_used,
                chatId: apiRes.chat_id,
            };

            set((s) => {
                const msgs = [...s.messages];
                const newTargetIndex = msgs.findIndex(m => m.id === messageId);
                if (newTargetIndex !== -1) {
                    msgs.splice(newTargetIndex, 0, aiMsg); // Insert BEFORE the user message since reversed
                } else {
                    msgs.unshift(aiMsg);
                }
                persistSessionCache(activeSessionId, msgs);
                return { messages: msgs, isTyping: false };
            });
        } catch (error) {
            console.error("Edit error:", error);
            set({ isTyping: false });
        }
    },

    setMessages: (messages) => set({ messages }),
    setTyping: (isTyping) => set({ isTyping }),
    appendError: (errorMsg) => set((s) => ({ messages: [...s.messages, errorMsg] })),
}));
