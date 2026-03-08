// ============================================================
// useColors — returns the active color set (light or dark)
// Call this at the top of any component that needs themed colors.
// ============================================================
import { useAppStore } from '../store/useAppStore';
import { Colors } from '../constants/theme';
import { DarkColors } from '../constants/darkColors';

export type ThemeColors = Record<keyof typeof Colors, string>;

export function useColors(): ThemeColors {
    const isDark = useAppStore((s) => s.isDark);
    return (isDark ? DarkColors : Colors) as ThemeColors;
}
