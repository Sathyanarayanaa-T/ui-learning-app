// ============================================================
// AI Tutor — Zustand Store (New API structure)
// ============================================================
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ChatMessage, LocalSession, ChatMode } from '../types/tutor';
import { createSession, sendChat, getHistory, uploadDocument, askDocumentQuestion, submitChatFeedback, regenerateChatResponse } from '../services/tutorService';

const mkId = () => `${Date.now()}_${Math.random().toString(36).slice(2)}`;

const SESSIONS_KEY = 'tutor_recent_sessions';
const SESSION_CACHE_KEY = (sessionId: string) => `tutor_session_cache_${sessionId}`;

// ─── Internal Storage Helpers ─────────────────────────────────

async function persistSessions(sessions: LocalSession[]) {
    try { await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions)); } catch (_) { }
}

async function persistSessionCache(sessionId: string, messages: ChatMessage[]) {
    try { await AsyncStorage.setItem(SESSION_CACHE_KEY(sessionId), JSON.stringify(messages)); } catch (_) { }
}

async function loadSessionCache(sessionId: string): Promise<ChatMessage[]> {
    try {
        const raw = await AsyncStorage.getItem(SESSION_CACHE_KEY(sessionId));
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

// ─── Store Interface ──────────────────────────────────────────

interface TutorState {
    // ── Sessions & History ────────────────────────────────────
    sessions: LocalSession[];
    loadSessions: () => Promise<void>;
    removeSession: (sessionId: string) => Promise<void>;

    // ── Active Chat State ─────────────────────────────────────
    activeSessionId: string | null;
    activeSessionTitle: string;
    activeDocumentId: string | null;
    activeDocumentName: string | null;
    chatMode: ChatMode;
    setChatMode: (mode: ChatMode) => void;
    
    isStarting: boolean;
    startNewSession: (mode: ChatMode) => Promise<void>;
    
    isRestoring: boolean;
    restoreSession: (session: LocalSession) => Promise<void>;

    clearActiveChat: () => void; // Go back to empty state
    
    // ── Document State ────────────────────────────────────────
    isUploading: boolean;
    uploadFile: (doc: any) => Promise<void>;
    clearActiveDocument: () => void;

    // ── Messages ─────────────────────────────────────────────
    messages: ChatMessage[];
    isTyping: boolean;
    sendMessage: (text: string) => Promise<void>;

    // ── Message Actions ──────────────────────────────────────
    setFeedback: (messageId: string, feedback: 'like' | 'dislike' | undefined) => void;
    regenerateMessage: (messageId: string) => Promise<void>;
    editMessage: (messageId: string, newText: string) => Promise<void>;
    editingMessageId: string | null;
    setEditingMessageId: (id: string | null) => void;
}

// ─── Store Implementation ──────────────────────────────────────

export const useTutorStore = create<TutorState>((set, get) => ({
    // ── Sessions & History
    sessions: [],

    loadSessions: async () => {
        try {
            const raw = await AsyncStorage.getItem(SESSIONS_KEY);
            const loaded: LocalSession[] = raw ? JSON.parse(raw) : [];
            set({ sessions: loaded });
        } catch (_) { }
    },

    removeSession: async (sessionId) => {
        const updated = get().sessions.filter((s) => s.session_id !== sessionId);
        set({ sessions: updated });
        await persistSessions(updated);
        try { await AsyncStorage.removeItem(SESSION_CACHE_KEY(sessionId)); } catch (_) { }
    },

    // ── Active Chat State
    activeSessionId: null,
    activeSessionTitle: '',
    activeDocumentId: null,
    activeDocumentName: null,
    chatMode: 'normal',

    setChatMode: (mode) => set({ chatMode: mode }),

    isStarting: false,

    startNewSession: async (mode) => {
        set({ isStarting: true });
        try {
            const res = await createSession();
            const pretextText = 
                mode === 'teaching' 
                    ? "Welcome to **Teaching Mode**! I'll break down complex concepts step-by-step and help you build a deep understanding. What topic would you like to learn about?" 
                    : mode === 'guiding' 
                    ? "Hi! You are in **Guiding Mode**. I will use Socratic questioning to help you find the answers yourself. I'll provide hints and ask thought-provoking questions to guide your learning journey. What problem are you trying to solve?" 
                    : "Hello! I am TutorX in **Normal Q&A** mode. I'm here to provide direct, clear answers and explanations to your questions. How can I help you today?";

            const introMsg: ChatMessage = {
                id: mkId(),
                role: 'assistant',
                text: pretextText,
                timestamp: new Date().toISOString(),
            };

            set({
                activeSessionId: res.session_id,
                activeSessionTitle: '', // Will be set on first message
                activeDocumentId: null,
                activeDocumentName: null,
                chatMode: mode,
                messages: [introMsg],
                isStarting: false,
            });
            
            await persistSessionCache(res.session_id, [introMsg]);
            // We don't add to sessions list until the first message is sent, 
            // to avoid cluttering history with completely empty sessions.
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
            activeDocumentId: null,
            activeDocumentName: null,
            chatMode: session.mode || 'normal',
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
                    timestamp: m.timestamp,
                }));
                // Save it back to cache
                await persistSessionCache(session.session_id, msgs);
            } catch (err) {
                console.error("Failed to load history", err);
            }
        }

        set({ messages: msgs, isRestoring: false });
    },

    clearActiveChat: () => set({ activeSessionId: null, activeSessionTitle: '', activeDocumentId: null, activeDocumentName: null, messages: [] }),

    // ── Document State
    isUploading: false,
    
    uploadFile: async (doc: any) => {
        const { activeSessionId } = get();
        if (!activeSessionId) return;
        
        set({ isUploading: true });
        try {
            const res = await uploadDocument(doc, activeSessionId);
            set({ activeDocumentId: res.document_id, activeDocumentName: res.filename, isUploading: false });
            
            // Add automatic system-like message to chat
            const sysMsg: ChatMessage = {
                id: mkId(),
                role: 'assistant',
                text: `📄 Document **${res.filename}** uploaded successfully. What would you like to know about it?`,
                timestamp: new Date().toISOString(),
            };
            set((s) => {
                const updated = [...s.messages, sysMsg];
                persistSessionCache(activeSessionId, updated);
                return { messages: updated };
            });
        } catch (error) {
            console.error("Upload failed", error);
            set({ isUploading: false });
        }
    },
    
    clearActiveDocument: () => set({ activeDocumentId: null, activeDocumentName: null }),

    // ── Messages
    messages: [],
    isTyping: false,

    sendMessage: async (text) => {
        const { activeSessionId, chatMode, sessions, activeSessionTitle, activeDocumentId } = get();
        if (!activeSessionId) return;

        // 1. Add user message locally
        const userMsg: ChatMessage = { id: mkId(), role: 'user', text, timestamp: new Date().toISOString() };
        
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
                mode: chatMode,
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
            let replyText = '';
            let tokensUsed = 0;
            let respTimestamp = new Date().toISOString();
            let chatId = '';

            if (activeDocumentId) {
                // Route to document ask
                const apiRes = await askDocumentQuestion({
                    session_id: activeSessionId,
                    document_id: activeDocumentId,
                    question: text,
                    mode: chatMode
                });
                replyText = apiRes.answer;
                respTimestamp = apiRes.timestamp;
            } else {
                // Route to normal chat
                const apiRes = await sendChat({
                    session_id: activeSessionId,
                    message: text,
                    mode: chatMode
                });
                replyText = apiRes.ai_response;
                tokensUsed = apiRes.tokens_used;
                respTimestamp = apiRes.timestamp;
                chatId = apiRes.chat_id;  // Capture chat_id for feedback/regenerate
            }

            const aiMsg: ChatMessage = {
                id: mkId(),
                role: 'assistant',
                text: replyText,
                timestamp: respTimestamp,
                tokensUsed,
                chatId: chatId,  // Store chat_id for backend operations
            };

            set((s) => {
                const finalMessages = [...s.messages, aiMsg];
                persistSessionCache(activeSessionId, finalMessages);
                return { messages: finalMessages, isTyping: false };
            });
            
        } catch (error) {
            set((s) => {
                const errorMsg: ChatMessage = {
                    id: mkId(),
                    role: 'assistant',
                    text: '⚠️ The AI encountered an error processing your request. Please try again.',
                    timestamp: new Date().toISOString(),
                };
                return { messages: [...s.messages, errorMsg], isTyping: false };
            });
        }
    },

    // ── Message Actions
    editingMessageId: null,
    setEditingMessageId: (id) => set({ editingMessageId: id }),

    setFeedback: async (messageId, feedback) => {
        const { activeSessionId, messages } = get();
        
        // Update local state immediately for UX
        set((s) => {
            const msgs = s.messages.map(m => m.id === messageId ? { ...m, feedback } : m);
            if (activeSessionId) persistSessionCache(activeSessionId, msgs);
            return { messages: msgs };
        });

        // Send feedback to backend
        try {
            const message = messages.find(m => m.id === messageId);
            if (!message || !message.chatId || !activeSessionId) return;
            
            const isLiked = feedback === 'like' ? true : feedback === 'dislike' ? false : null;
            
            await submitChatFeedback(
                message.chatId,
                activeSessionId,
                isLiked
            );
        } catch (error) {
            console.error("Failed to submit feedback to backend", error);
            // Keep local state even if backend fails
        }
    },

    regenerateMessage: async (messageId) => {
        const { activeSessionId, chatMode, activeDocumentId, messages } = get();
        if (!activeSessionId) return;

        const targetIndex = messages.findIndex(m => m.id === messageId);
        if (targetIndex === -1) return;

        const targetMessage = messages[targetIndex];
        if (!targetMessage.chatId) {
            console.error("Message has no chatId, cannot regenerate");
            return;
        }

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
            let replyText = '';
            let tokensUsed = 0;
            let respTimestamp = new Date().toISOString();
            let newChatId = '';

            if (activeDocumentId) {
                // For document questions, just re-ask the same question
                const apiRes = await askDocumentQuestion({
                    session_id: activeSessionId,
                    document_id: activeDocumentId,
                    question: userText,
                    mode: chatMode
                });
                replyText = apiRes.answer;
                respTimestamp = apiRes.timestamp;
            } else {
                // For regular chat, use the regenerate endpoint
                const apiRes = await regenerateChatResponse(
                    targetMessage.chatId,
                    activeSessionId,
                    "user_requested"
                );
                replyText = apiRes.new_response;
                respTimestamp = apiRes.timestamp;
                newChatId = apiRes.regenerated_chat_id;
            }

            const aiMsg: ChatMessage = {
                id: mkId(),
                role: 'assistant',
                text: replyText,
                timestamp: respTimestamp,
                tokensUsed,
                chatId: newChatId,  // Store new chat_id for regenerated message
            };

            set((s) => {
                const currentMessages = s.messages;
                const finalMessages = [...currentMessages, aiMsg];
                persistSessionCache(activeSessionId, finalMessages);
                return { messages: finalMessages, isTyping: false };
            });
            
        } catch (error) {
            console.error("Regenerate error:", error);
            set((s) => {
                const errorMsg: ChatMessage = {
                    id: mkId(),
                    role: 'assistant',
                    text: '⚠️ Failed to regenerate response. Please try again.',
                    timestamp: new Date().toISOString(),
                };
                return { messages: [...s.messages, errorMsg], isTyping: false };
            });
        }
    },

    editMessage: async (messageId, newText) => {
        const { activeSessionId, chatMode, activeDocumentId, messages } = get();
        if (!activeSessionId) return;

        const targetIndex = messages.findIndex(m => m.id === messageId);
        if (targetIndex === -1 || messages[targetIndex].role !== 'user') return;

        const hasAiResponse = targetIndex + 1 < messages.length && messages[targetIndex + 1].role === 'assistant';
        
        const updatedMessages = [...messages];
        updatedMessages[targetIndex] = { ...updatedMessages[targetIndex], text: newText };
        if (hasAiResponse) {
            updatedMessages.splice(targetIndex + 1, 1);
        }

        set({ messages: updatedMessages, isTyping: true });

        try {
            let replyText = '';
            let tokensUsed = 0;
            let respTimestamp = new Date().toISOString();
            let chatId = '';

            if (activeDocumentId) {
                const apiRes = await askDocumentQuestion({
                    session_id: activeSessionId,
                    document_id: activeDocumentId,
                    question: newText,
                    mode: chatMode
                });
                replyText = apiRes.answer;
                respTimestamp = apiRes.timestamp;
            } else {
                const apiRes = await sendChat({
                    session_id: activeSessionId,
                    message: newText,
                    mode: chatMode
                });
                replyText = apiRes.ai_response;
                tokensUsed = apiRes.tokens_used;
                respTimestamp = apiRes.timestamp;
                chatId = apiRes.chat_id;
            }

            const aiMsg: ChatMessage = {
                id: mkId(),
                role: 'assistant',
                text: replyText,
                timestamp: respTimestamp,
                tokensUsed,
                chatId: chatId,
            };

            set((s) => {
                const msgs = [...s.messages];
                const newTargetIndex = msgs.findIndex(m => m.id === messageId);
                if (newTargetIndex !== -1) {
                    msgs.splice(newTargetIndex + 1, 0, aiMsg);
                } else {
                    msgs.push(aiMsg);
                }
                persistSessionCache(activeSessionId, msgs);
                return { messages: msgs, isTyping: false };
            });

        } catch (error) {
            console.error("Edit error:", error);
            set((s) => {
                const errorMsg: ChatMessage = {
                    id: mkId(),
                    role: 'assistant',
                    text: '⚠️ Failed to generate new response. Please try again.',
                    timestamp: new Date().toISOString(),
                };
                const msgs = [...s.messages];
                const newTargetIndex = msgs.findIndex(m => m.id === messageId);
                if (newTargetIndex !== -1) {
                    msgs.splice(newTargetIndex + 1, 0, errorMsg);
                } else {
                    msgs.push(errorMsg);
                }
                return { messages: msgs, isTyping: false };
            });
        }
    },
}));
