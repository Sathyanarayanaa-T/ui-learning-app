import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { AppText } from '../atoms/AppText';
import { Card } from '../atoms/Card';
import { Colors, Spacing, FontSize, FontWeight } from '../../constants/theme';

interface StatCardProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    color?: string;
    style?: StyleProp<ViewStyle>;
}

export const StatCard: React.FC<StatCardProps> = ({
    label,
    value,
    icon,
    color = Colors.brightBlue,
    style,
}) => {
    return (
        <Card style={[styles.card, style]} variant="default">
            <View style={[styles.iconWrap, { backgroundColor: color + '18' }]}>
                {icon}
            </View>
            <AppText style={[styles.value, { color }]}>{value}</AppText>
            <AppText variant="caption" style={styles.label}>{label}</AppText>
        </Card>
    );
};

const styles = StyleSheet.create({
    card: {
        alignItems: 'center',
        padding: Spacing.lg,
        flex: 1,
    },
    iconWrap: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.sm,
    },
    // icon: { fontSize: 22 },
    value: {
        fontSize: FontSize['3xl'],
        fontWeight: FontWeight.extrabold as '800',
        lineHeight: FontSize['3xl'] * 1.1,
        marginBottom: 4,
    },
    label: {
        textAlign: 'center',
        fontSize: FontSize.xs,
    },
});
