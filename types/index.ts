// ============================================================
// Hexaware Learning Path — Shared TypeScript Types
// ============================================================

// ─── API Payloads ────────────────────────────────────────────

export interface GeneratePathPayload {
    user_id: string;
    role: string;
    current_skills: string[];
}

export interface HistoryPayload {
    user_id: string;
    course_id: number;
}

// ─── Domain Models ───────────────────────────────────────────

export interface Course {
    course_id: number;
    title: string;
    provider: string;
    resource_url: string;
    match_score: number;
    is_finished: boolean;
}

export type StepStatus = 'active' | 'locked' | 'completed' | 'review';

export interface RoadmapStep {
    step: number;
    topic: string;
    status: StepStatus;
    is_reviewable: boolean;
    suggested_courses: Course[];
}

export interface LearningPath {
    user_id: string;
    role: string;
    inferred_level: string;
    engine: string;
    roadmap: RoadmapStep[];
    is_path_finished: boolean;
}

// ─── History ─────────────────────────────────────────────────

export interface HistoryCourse {
    id: number;          // real API uses 'id', not 'course_id'
    title: string;
    topic?: string;
    level?: string;
    rating?: number;
    provider?: string;
    resource_url?: string;
}

export interface UserHistory {
    user_id: string;
    total: number;
    courses: HistoryCourse[];
}

// ─── User / Onboarding ───────────────────────────────────────

export interface UserProfile {
    userId: string;
    role: string;
    skills: string[];
}

// ─── App Config ──────────────────────────────────────────────

export interface AppConfig {
    USE_MOCK_DATA: boolean;
    BASE_URL: string;
}

// ─── Roles & Skills (Static Data) ────────────────────────────

export interface RoleOption {
    id: string;
    label: string;
    icon: string;
    description: string;
}

export const ROLES: RoleOption[] = [
    { id: 'frontend_dev', label: 'Frontend Developer', icon: 'desktop-outline', description: 'HTML, CSS, JS, React' },
    { id: 'backend_dev', label: 'Backend Developer', icon: 'server-outline', description: 'Node, Python, Databases' },
    { id: 'data_scientist', label: 'Data Scientist', icon: 'bar-chart-outline', description: 'Python, ML, Statistics' },
    { id: 'devops', label: 'DevOps Engineer', icon: 'cloud-outline', description: 'CI/CD, Docker, Kubernetes' },
    { id: 'fullstack', label: 'Full Stack Developer', icon: 'rocket-outline', description: 'End-to-end web development' },
    { id: 'qa', label: 'QA Engineer', icon: 'bug-outline', description: 'Testing, Automation, Quality' },
];

export const SKILLS: string[] = [
    'HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular',
    'Node.js', 'Python', 'Java', 'SQL', 'MongoDB', 'Docker', 'Git',
    'REST APIs', 'GraphQL', 'Linux', 'AWS', 'Azure', 'Machine Learning',
];
