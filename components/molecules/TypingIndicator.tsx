import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useColors } from '../../hooks/useColors';
import { Spacing } from '../../constants/theme';

export const TypingIndicator: React.FC = () => {
    const colors = useColors();
    const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

    useEffect(() => {
        const anims = dots.map((anim, i) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(i * 180),
                    Animated.timing(anim, { toValue: -6, duration: 300, useNativeDriver: true }),
                    Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }),
                    Animated.delay(600 - i * 180),
                ])
            )
        );
        anims.forEach((a) => a.start());
        return () => anims.forEach((a) => a.stop());
    }, []);

    return (
        <View style={[styles.row]}>
            {/* AI avatar */}
            <View style={[styles.avatar, { backgroundColor: colors.hexawareBlue }]}>
                <Animated.Text style={styles.avatarText}>AI</Animated.Text>
            </View>
            <View style={[styles.bubble, { backgroundColor: colors.snow, borderColor: colors.borderLight }]}>
                <View style={styles.dots}>
                    {dots.map((anim, i) => (
                        <Animated.View
                            key={i}
                            style={[styles.dot, { backgroundColor: colors.silver, transform: [{ translateY: anim }] }]}
                        />
                    ))}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
    avatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 11, fontWeight: '700', color: '#FFF' },
    bubble: { borderRadius: 18, borderBottomLeftRadius: 4, borderWidth: 1, padding: Spacing.md },
    dots: { flexDirection: 'row', gap: 5, alignItems: 'center', height: 20 },
    dot: { width: 7, height: 7, borderRadius: 4 },
});
