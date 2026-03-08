import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { AppText } from './AppText';
import { Colors, Radius, FontSize, FontWeight } from '../../constants/theme';

interface ProgressBarProps {
    progress: number; // 0–100
    label?: string;
    showPercent?: boolean;
    color?: string;
    height?: number;
    style?: ViewStyle;
    animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
    progress,
    label,
    showPercent = true,
    color = Colors.brightBlue,
    height = 8,
    style,
    animated = true,
}) => {
    const anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(anim, {
            toValue: Math.min(100, Math.max(0, progress)),
            duration: animated ? 700 : 0,
            useNativeDriver: false,
        }).start();
    }, [progress]);

    const widthInterpolated = anim.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
    });

    return (
        <View style={[styles.container, style]}>
            {(label || showPercent) && (
                <View style={styles.header}>
                    {label && <AppText style={styles.label}>{label}</AppText>}
                    {showPercent && (
                        <AppText style={styles.percent}>{Math.round(progress)}%</AppText>
                    )}
                </View>
            )}
            <View style={[styles.track, { height }]}>
                <Animated.View
                    style={[styles.fill, { width: widthInterpolated, height, backgroundColor: color }]}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { width: '100%' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    label: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium as '500',
        color: Colors.darkBlue,
    },
    percent: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold as '700',
        color: Colors.brightBlue,
    },
    track: {
        backgroundColor: Colors.borderLight,
        borderRadius: Radius.full,
        overflow: 'hidden',
    },
    fill: {
        borderRadius: Radius.full,
    },
});
