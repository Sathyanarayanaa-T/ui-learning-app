import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { AppText } from './AppText';
import { Colors, Radius, Spacing, FontSize, FontWeight } from '../../constants/theme';
import type { StepStatus } from '../../types';

interface BadgeProps {
    status: StepStatus | string;
    style?: StyleProp<ViewStyle>;
}

const BADGE_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
    active: { bg: Colors.brightBlue + '20', text: Colors.brightBlue, label: 'Active' },
    locked: { bg: Colors.silver + '20', text: Colors.silver, label: 'Locked' },
    completed: { bg: Colors.honey + '22', text: Colors.honey, label: 'Completed' },
    review: { bg: Colors.electricBlue + '20', text: Colors.electricBlue, label: 'Review' },
};

export const Badge: React.FC<BadgeProps> = ({ status, style }) => {
    const cfg = BADGE_CONFIG[status] ?? BADGE_CONFIG.locked;
    return (
        <View style={[styles.badge, { backgroundColor: cfg.bg }, style]}>
            <View style={[styles.dot, { backgroundColor: cfg.text }]} />
            <AppText style={[styles.label, { color: cfg.text }]}>{cfg.label}</AppText>
        </View>
    );
};

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: 4,
        borderRadius: Radius.full,
        gap: 5,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    label: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semibold as '600',
        letterSpacing: 0.4,
    },
});
