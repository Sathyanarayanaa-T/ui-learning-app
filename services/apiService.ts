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

// ─── Config ──────────────────────────────────────────────────

const BASE_URL = 'http://192.168.1.9:8000';

// ─── Fallback-aware Response ─────────────────────────────────

export interface ApiResult<T> {
    data: T;
    usedMock: boolean;
}

// ─── Service Functions ───────────────────────────────────────

export async function generatePath(
    payload: GeneratePathPayload,
): Promise<ApiResult<LearningPath>> {
    try {
        const res = await fetch(`${BASE_URL}/api/v1/generate-path`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return { data: await res.json(), usedMock: false };
    } catch {
        // Server unreachable or errored — silently fall back to mock
        const data = await MockService.generatePath(payload);
        return { data, usedMock: true };
    }
}

export async function addHistory(payload: HistoryPayload): Promise<{ usedMock: boolean }> {
    try {
        const res = await fetch(`${BASE_URL}/api/v1/user/history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return { usedMock: false };
    } catch {
        return { usedMock: true }; // no-op mock for history POST
    }
}

export async function getUserHistory(
    userId: string,
): Promise<ApiResult<UserHistory>> {
    try {
        const res = await fetch(`${BASE_URL}/api/v1/user/${userId}/history`);
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return { data: await res.json(), usedMock: false };
    } catch {
        const data = await MockService.getUserHistory(userId);
        return { data, usedMock: true };
    }
}
