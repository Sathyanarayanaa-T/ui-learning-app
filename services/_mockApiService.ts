// ============================================================
// Hexaware Learning Path — Fallback Mock Data
// Only used when USE_MOCK_DATA = true in apiService.ts
// ============================================================

import type { GeneratePathPayload, LearningPath, UserHistory } from '../types';

export async function generatePath(payload: GeneratePathPayload): Promise<LearningPath> {
    return {
        user_id: payload.user_id,
        role: payload.role,
        inferred_level: 'Beginner',
        engine: 'Rules-Based',
        is_path_finished: false,
        roadmap: [
            {
                step: 1,
                topic: 'HTML/CSS Essentials',
                status: 'active',
                is_reviewable: false,
                suggested_courses: [
                    {
                        course_id: 6,
                        title: 'HTML/CSS Crash Course',
                        provider: 'Traversy Media',
                        resource_url: 'https://www.youtube.com/watch?v=gvOivz9skfA',
                        match_score: 96.2,
                        is_finished: false,
                    },
                ],
            },
            {
                step: 2,
                topic: 'JavaScript Basics',
                status: 'locked',
                is_reviewable: false,
                suggested_courses: [],
            },
            {
                step: 3,
                topic: 'React Framework',
                status: 'locked',
                is_reviewable: false,
                suggested_courses: [],
            },
        ],
    };
}

export async function getUserHistory(userId: string): Promise<UserHistory> {
    return {
        user_id: userId,
        total: 2,
        courses: [
            { id: 1, title: 'Git & GitHub Crash Course', provider: 'Traversy Media', topic: 'Version Control', level: 'Beginner', rating: 0.95 },
            { id: 2, title: 'VS Code Tips & Tricks', provider: 'Fireship', topic: 'Tooling', level: 'Beginner', rating: 0.88 },
        ],
    };
}
