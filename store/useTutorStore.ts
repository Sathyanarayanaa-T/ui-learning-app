// ============================================================
// AI Tutor — Zustand Store (Real API)
// ============================================================
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ChatMessage, TutorSession, UsageData } from '../types/tutor';
import { sendChat, fetchChatHistory, fetchUsage } from '../services/tutorService';

const toSlug = (label: string) =>
    label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60);

const mkId = () => `${Date.now()}_${Math.random().toString(36).slice(2)}`;

const RECENT_TOPICS_KEY = 'tutor_recent_topics';
const SESSION_CACHE_KEY = (slug: string) => `tutor_session_${slug}`;

// ─── Types ───────────────────────────────────────────────────

export interface RecentTopic {
    topicId: string;       // slug
    topicLabel: string;    // human label the user typed
    lastUsed: string;      // ISO timestamp
    messageCount: number;
}

interface TutorState {
    // ── Recent Topics ─────────────────────────────────────────
    recentTopics: RecentTopic[];
    loadRecentTopics: () => Promise<void>;
    addRecentTopic: (topicLabel: string, topicId: string) => Promise<void>;
    removeRecentTopic: (topicId: string) => Promise<void>;

    // ── Session (local-only concept) ─────────────────────────
    session: TutorSession | null;
    isStarting: boolean;
    startSession: (topicLabel: string) => void;

    // ── Restore (continue past session) ──────────────────────
    isRestoring: boolean;
    restoreSession: (topic: RecentTopic, userId: string) => Promise<void>;

    // ── Messages ─────────────────────────────────────────────
    messages: ChatMessage[];
    isTyping: boolean;
    sendMessage: (text: string, userId: string) => Promise<void>;
    clearChat: () => void;
    loadHistory: (userId: string) => Promise<void>;

    // ── Usage ────────────────────────────────────────────────
    usage: UsageData | null;
    loadUsage: (userId: string) => Promise<void>;

    // ── Mock fallback tracking ────────────────────────────────
    usingMockFallback: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────

async function persistRecentTopics(topics: RecentTopic[]) {
    try { await AsyncStorage.setItem(RECENT_TOPICS_KEY, JSON.stringify(topics)); } catch (_) { }
}

async function persistSessionCache(topicId: string, messages: ChatMessage[]) {
    try { await AsyncStorage.setItem(SESSION_CACHE_KEY(topicId), JSON.stringify(messages)); } catch (_) { }
}

async function loadSessionCache(topicId: string): Promise<ChatMessage[]> {
    try {
        const raw = await AsyncStorage.getItem(SESSION_CACHE_KEY(topicId));
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

// ─── Store ───────────────────────────────────────────────────

export const useTutorStore = create<TutorState>((set, get) => ({
    // ── Recent Topics ─────────────────────────────────────────
    recentTopics: [],

    loadRecentTopics: async () => {
        try {
            const raw = await AsyncStorage.getItem(RECENT_TOPICS_KEY);
            const topics: RecentTopic[] = raw ? JSON.parse(raw) : [];
            set({ recentTopics: topics });
        } catch (_) { }
    },

    addRecentTopic: async (topicLabel, topicId) => {
        const existing = get().recentTopics.filter((t) => t.topicId !== topicId);
        const updated: RecentTopic[] = [
            { topicId, topicLabel, lastUsed: new Date().toISOString(), messageCount: 0 },
            ...existing,
        ].slice(0, 10); // keep at most 10
        set({ recentTopics: updated });
        await persistRecentTopics(updated);
    },

    removeRecentTopic: async (topicId) => {
        const updated = get().recentTopics.filter((t) => t.topicId !== topicId);
        set({ recentTopics: updated });
        await persistRecentTopics(updated);
        try { await AsyncStorage.removeItem(SESSION_CACHE_KEY(topicId)); } catch (_) { }
    },

    // ── Session ───────────────────────────────────────────────
    session: null,
    isStarting: false,

    startSession: (topicLabel) => {
        const topicId = toSlug(topicLabel);
        set({ session: { topicId, topicLabel }, messages: [] });
        // Save to recent topics (fire and forget)
        get().addRecentTopic(topicLabel, topicId);
    },

    // ── Restore session ───────────────────────────────────────
    isRestoring: false,

    restoreSession: async (topic, userId) => {
        set({ isRestoring: true, session: { topicId: topic.topicId, topicLabel: topic.topicLabel }, messages: [] });

        // First try local cache (fast, no network)
        const cached = await loadSessionCache(topic.topicId);
        if (cached.length > 0) {
            set({ messages: cached, isRestoring: false });
            return;
        }

        // Fall back to API history (returns all topics; filter by topicId note: API
        // doesn't return topicId per message, so we show all — acceptable per API docs)
        const { data: envelope, usedMock } = await fetchChatHistory(userId);
        const msgs: ChatMessage[] = [];
        envelope.data.forEach((item) => {
            msgs.push({ id: `${item.chatId}_q`, role: 'user', text: item.message, timestamp: item.timestamp });
            msgs.push({ id: `${item.chatId}_a`, role: 'assistant', text: item.reply, timestamp: item.timestamp });
        });
        set({ messages: msgs, isRestoring: false, usingMockFallback: usedMock });
    },

    // ── Messages ──────────────────────────────────────────────
    messages: [],
    isTyping: false,

    sendMessage: async (text, userId) => {
        const { session } = get();
        if (!session) return;

        const userMsg: ChatMessage = { id: mkId(), role: 'user', text, timestamp: new Date().toISOString() };
        set((s) => ({ messages: [...s.messages, userMsg], isTyping: true }));

        const { data: envelope, usedMock } = await sendChat({
            userId, topicId: session.topicId, message: text,
        });

        const replyText = envelope.data.reply;
        const isOpenAIError = replyText.startsWith("Sorry, I couldn't");

        const aiMsg: ChatMessage = {
            id: envelope.data.chatId,
            role: 'assistant',
            text: isOpenAIError ? "⚠️ The AI couldn't process that. Please try again." : replyText,
            timestamp: new Date().toISOString(),
            tokensUsed: envelope.data.tokensUsed,
        };

        set((s) => {
            const updatedMessages = [...s.messages, aiMsg];
            // Persist session cache after every new message
            persistSessionCache(session.topicId, updatedMessages);
            // Update message count in recent topics
            const updatedTopics = s.recentTopics.map((t) =>
                t.topicId === session.topicId
                    ? { ...t, messageCount: Math.ceil(updatedMessages.length / 2), lastUsed: new Date().toISOString() }
                    : t
            );
            persistRecentTopics(updatedTopics);
            return {
                messages: updatedMessages,
                recentTopics: updatedTopics,
                isTyping: false,
                usingMockFallback: usedMock || s.usingMockFallback,
            };
        });
    },

    clearChat: () => set({ messages: [], session: null }),

    loadHistory: async (userId) => {
        const { data: envelope, usedMock } = await fetchChatHistory(userId);
        const msgs: ChatMessage[] = [];
        envelope.data.forEach((item) => {
            msgs.push({ id: `${item.chatId}_q`, role: 'user', text: item.message, timestamp: item.timestamp });
            msgs.push({ id: `${item.chatId}_a`, role: 'assistant', text: item.reply, timestamp: item.timestamp });
        });
        set({ messages: msgs, usingMockFallback: usedMock });
    },

    // ── Usage ─────────────────────────────────────────────────
    usage: null,
    loadUsage: async (userId) => {
        const { data: envelope, usedMock } = await fetchUsage(userId);
        set({ usage: envelope.data, usingMockFallback: usedMock || get().usingMockFallback });
    },

    // ── Mock fallback ─────────────────────────────────────────
    usingMockFallback: false,
}));
