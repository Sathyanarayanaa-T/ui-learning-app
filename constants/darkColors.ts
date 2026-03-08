// ============================================================
// Dark Mode Color Palette — Hexaware identity in dark mode
//
// Philosophy: 90% of screen = near-black surfaces.
// Brand/accent colors pop as vibrant highlights against the dark.
//
// Elevation layers (barely distinguishable from far, clear up close):
//   light  (#08081A) → page background   (darkest, near-black)
//   white  (#10102C) → card surface      (+1 elevation)
//   snow   (#181835) → elevated card     (+2 elevation)
// ============================================================
import type { ThemeColors } from '../hooks/useColors';

export const DarkColors: ThemeColors = {
    // Primary Brand — same as light, they pop against dark surfaces
    hexawareBlue: '#3C2CDA',
    brightBlue: '#1D86FF',
    electricBlue: '#14CBDE',
    darkBlue: '#6B7BFF',   // lightened for readability as text on dark bg

    // Dark surfaces — near-black with the faintest navy tint
    black: '#DDDFF5',          // primary TEXT becomes near-white
    light: '#08081A',          // page background   ← very dark
    white: '#10102C',          // card surface
    snow: '#181835',          // elevated / nested card

    // Highlight — unchanged, vivid over dark bg
    honey: '#EA9D00',
    canary: '#F4CB4E',

    // Borders — barely visible hairlines on near-black
    borderLight: '#252545',     // subtle card border
    borderDark: '#353560',     // stronger separator
    silver: '#8A90B8',     // muted text

    // Status
    error: '#FF5555',
    success: '#22C55E',
} as const;
