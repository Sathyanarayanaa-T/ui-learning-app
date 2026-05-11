import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Image } from 'react-native';
import { useColors } from '../../hooks/useColors';
import { Spacing } from '../../constants/theme';

export const TypingIndicator: React.FC = () => {
    const colors = useColors();
    const animValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        let isMounted = true;
        const startAnim = () => {
            if (!isMounted) return;
            animValue.setValue(0);
            Animated.timing(animValue, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }).start(({ finished }) => {
                if (finished && isMounted) {
                    startAnim();
                }
            });
        };
        startAnim();

        return () => {
            isMounted = false;
        };
    }, [animValue]);

    const dot1Y = animValue.interpolate({ inputRange: [0, 0.2, 0.4, 1], outputRange: [0, -6, 0, 0] });
    const dot2Y = animValue.interpolate({ inputRange: [0, 0.2, 0.4, 0.6, 1], outputRange: [0, 0, -6, 0, 0] });
    const dot3Y = animValue.interpolate({ inputRange: [0, 0.4, 0.6, 0.8, 1], outputRange: [0, 0, -6, 0, 0] });
    
    const transforms = [dot1Y, dot2Y, dot3Y];

    return (
        <View style={[styles.row]}>
            {/* AI avatar */}
            <View style={styles.avatar}>
                <Image source={require('../../assets/botchat.png')} style={{ width: 32, height: 32, borderRadius: 16 }} resizeMode="cover" />
            </View>
            <View style={[styles.bubble, { backgroundColor: colors.snow, borderColor: colors.borderLight }]}>
                <View style={styles.dots}>
                    {transforms.map((anim, i) => (
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
