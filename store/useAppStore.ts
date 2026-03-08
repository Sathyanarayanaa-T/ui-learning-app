// ============================================================
// Hexaware Learning Path — Zustand Global Store
// ============================================================

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LearningPath, UserHistory, UserProfile } from '../types';
import { generatePath, getUserHistory, addHistory } from '../services/apiService';

// ─── Persistent User ID ──────────────────────────────────────
const USER_ID_KEY = 'hexaware_user_id';

async function getPersistentUserId(): Promise<string> {
    try {
        const stored = await AsyncStorage.getItem(USER_ID_KEY);
        if (stored) return stored;
    } catch (_) { }
    const newId = `user_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
    try { await AsyncStorage.setItem(USER_ID_KEY, newId); } catch (_) { }
    return newId;
}

interface AppState {
    // ── User ─────────────────────────────────────────────────
    user: UserProfile | null;
    setUser: (user: UserProfile) => void;

    // ── Learning Path ─────────────────────────────────────────
    learningPath: LearningPath | null;
    isLoadingPath: boolean;
    pathError: string | null;
    fetchLearningPath: (role: string, skills: string[]) => Promise<void>;

    // ── Mark Course Done ──────────────────────────────────────
    markCourseFinished: (stepIndex: number, courseId: number) => Promise<void>;

    // ── History ───────────────────────────────────────────────
    history: UserHistory | null;
    isLoadingHistory: boolean;
    fetchHistory: () => Promise<void>;

    // ── Mock Fallback ─────────────────────────────────────────
    usingMockFallback: boolean;
    dismissMockBanner: () => void;

    // ── Reset ─────────────────────────────────────────────────
    reset: () => void;

    // ── Theme ─────────────────────────────────────────────────
    isDark: boolean;
    toggleTheme: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
    // ── User ──────────────────────────────────────────────────
    user: null,
    setUser: (user) => set({ user }),

    // ── Learning Path ─────────────────────────────────────────
    learningPath: null,
    isLoadingPath: false,
    pathError: null,

    fetchLearningPath: async (role, skills) => {
        set({ isLoadingPath: true, pathError: null });
        const userId = await getPersistentUserId();
        const currentUser = get().user;
        if (currentUser) set({ user: { ...currentUser, userId } });

        const { data, usedMock } = await generatePath({ user_id: userId, role, current_skills: skills });
        set({
            learningPath: data,
            isLoadingPath: false,
            usingMockFallback: usedMock || get().usingMockFallback,
        });
    },

    // ── Mark Course Finished ──────────────────────────────────
    markCourseFinished: async (stepIndex, courseId) => {
        const { learningPath, user } = get();
        if (!learningPath) return;

        // Optimistic update
        const optimisticRoadmap = learningPath.roadmap.map((step, i) => {
            if (i !== stepIndex) return step;
            return {
                ...step,
                suggested_courses: step.suggested_courses.map((c) =>
                    c.course_id === courseId ? { ...c, is_finished: true } : c
                ),
            };
        });
        set({ learningPath: { ...learningPath, roadmap: optimisticRoadmap } });

        const userId = user?.userId ?? (await getPersistentUserId());
        const { usedMock: historyMock } = await addHistory({ user_id: userId, course_id: courseId });

        // Re-fetch authoritative roadmap from server (or mock)
        const { data, usedMock } = await generatePath({
            user_id: userId,
            role: learningPath.role,
            current_skills: user?.skills ?? [],
        });
        set({
            learningPath: data,
            usingMockFallback: (usedMock || historyMock) || get().usingMockFallback,
        });
    },

    // ── History ───────────────────────────────────────────────
    history: null,
    isLoadingHistory: false,

    fetchHistory: async () => {
        set({ isLoadingHistory: true });
        const userId = get().user?.userId ?? (await getPersistentUserId());
        const { data, usedMock } = await getUserHistory(userId);
        set({
            history: data,
            isLoadingHistory: false,
            usingMockFallback: usedMock || get().usingMockFallback,
        });
    },

    // ── Mock Fallback ─────────────────────────────────────────
    usingMockFallback: false,
    dismissMockBanner: () => set({ usingMockFallback: false }),

    // ── Reset ─────────────────────────────────────────────────
    reset: () =>
        set({ user: null, learningPath: null, history: null, pathError: null, usingMockFallback: false }),

    // ── Theme ─────────────────────────────────────────────────
    isDark: false,
    toggleTheme: () => set((s) => ({ isDark: !s.isDark })),
}));
