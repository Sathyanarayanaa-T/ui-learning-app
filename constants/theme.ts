// ============================================================
// Hexaware Design System — theme.ts
// Single source of truth for all visual tokens.
// ============================================================

export const Colors = {
    // Primary Brand
    hexawareBlue: '#3C2CDA',
    brightBlue: '#1D86FF',
    electricBlue: '#14CBDE',
    darkBlue: '#07125E',

    // Dark & Neutral
    black: '#040D43',

    // Background & Surface
    light: '#F4EFF2',
    white: '#F8F8F9',
    snow: '#FFFFFF',

    // Highlight & Attention
    honey: '#EA9D00',
    canary: '#F4CB4E',

    // Border & Divider
    borderLight: '#CBD0E5',
    borderDark: '#535983',
    silver: '#8088A7',

    // Status
    error: '#DA2D2C',
    success: '#22C55E',
} as const;

export type ColorKey = keyof typeof Colors;

// ─── Typography ─────────────────────────────────────────────

export const FontSize = {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
} as const;

export const FontWeight = {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
};

export const LineHeight = {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
};

// ─── Spacing ────────────────────────────────────────────────

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
    '5xl': 56,
} as const;

// ─── Border Radius ──────────────────────────────────────────

export const Radius = {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 20,
    full: 9999,
} as const;

// ─── Shadows ────────────────────────────────────────────────

export const Shadow = {
    sm: {
        shadowColor: Colors.borderDark,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    md: {
        shadowColor: Colors.hexawareBlue,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
        elevation: 5,
    },
    lg: {
        shadowColor: Colors.darkBlue,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
} as const;

// ─── Layout ─────────────────────────────────────────────────

export const Layout = {
    webMaxWidth: 900,
    screenPaddingH: Spacing.lg,
    headerHeight: 64,
    tabBarHeight: 60,
} as const;

// ─── Step Status Colors ─────────────────────────────────────

export const StepStatusColors = {
    active: Colors.brightBlue,
    locked: Colors.silver,
    completed: Colors.honey,
    reviewable: Colors.electricBlue,
} as const;
