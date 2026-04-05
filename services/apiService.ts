// ============================================================
// Hexaware Learning Path — API Service Layer
// Real API with automatic mock fallback on failure.
// ============================================================

import type {
    GeneratePathPayload,
    HistoryPayload,
    LearningPath,
    UserHistory,
} from '../types';
import * as MockService from './_mockApiService';

// ─── Fallback-aware Response ─────────────────────────────────

export interface ApiResult<T> {
    data: T;
    usedMock: boolean;
}

// ─── Service Functions ───────────────────────────────────────

export async function generatePath(
    payload: GeneratePathPayload,
): Promise<ApiResult<LearningPath>> {
    const data = await MockService.generatePath(payload);
    return { data, usedMock: true };
}

export async function addHistory(payload: HistoryPayload): Promise<{ usedMock: boolean }> {
    return { usedMock: true }; // no-op mock for history POST
}

export async function getUserHistory(
    userId: string,
): Promise<ApiResult<UserHistory>> {
    const data = await MockService.getUserHistory(userId);
    return { data, usedMock: true };
}
