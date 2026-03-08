import React, { useEffect, useRef } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, Animated, Platform,
} from 'react-native';
import { useAppStore } from '../../store/useAppStore';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../constants/theme';

/**
 * GlobalMockBanner — rendered once in the (tabs) layout.
 * Slides down from the top when usingMockFallback is true,
 * slides back up when dismissed or when the real API reconnects.
 */
export function GlobalMockBanner() {
    const { usingMockFallback, dismissMockBanner } = useAppStore();
    const slideAnim = useRef(new Animated.Value(150)).current;

    useEffect(() => {
        Animated.spring(slideAnim, {
            toValue: usingMockFallback ? 0 : 150,
            useNativeDriver: true,
            tension: 60,
            friction: 10,
        }).start();
    }, [usingMockFallback]);

    return (
        <Animated.View
            style={[styles.banner, { transform: [{ translateY: slideAnim }] }]}
            pointerEvents={usingMockFallback ? 'auto' : 'none'}
        >
            <View style={styles.content}>
                <Ionicons name="radio-outline" size={24} color={Colors.canary} style={styles.icon} />
                <View style={styles.textBlock}>
                    <Text style={styles.title}>Using Demo Data</Text>
                    <Text style={styles.sub}>Server unreachable — showing mock data</Text>
                </View>
                <TouchableOpacity onPress={dismissMockBanner} style={styles.close} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close" size={18} color="#FFFFFF99" />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    banner: {
        position: 'absolute',
        bottom: 85, // Sit right above the tab bar safely
        left: Spacing.lg,
        right: Spacing.lg,
        zIndex: 999,
        backgroundColor: '#1A1A2E',
        borderRadius: Radius.lg,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
        borderWidth: 1,
        borderColor: Colors.canary + '44',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    icon: { marginRight: 2 },
    textBlock: { flex: 1 },
    title: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold as '700',
        color: Colors.canary,
    },
    sub: {
        fontSize: FontSize.xs,
        color: '#FFFFFF99',
        marginTop: 1,
    },
    close: {
        width: 28,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 14,
        backgroundColor: '#FFFFFF15',
    },
    closeText: {
        color: '#FFFFFF99',
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold as '700',
    },
});
