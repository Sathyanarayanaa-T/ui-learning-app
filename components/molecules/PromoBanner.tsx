import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PromoBannerProps {
    badge: string;
    title: string;
    subtitle: string;
    backgroundColor: string;
}

export function PromoBanner({ badge, title, subtitle, backgroundColor }: PromoBannerProps) {
    return (
        <View style={[styles.container, { backgroundColor }]}>
            <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{badge}</Text>
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: 160,
        borderRadius: 16,
        padding: 20,
        justifyContent: 'center',
    },
    badgeContainer: {
        position: 'absolute',
        top: 20,
        left: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    title: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
    },
    subtitle: {
        color: '#FFFFFF',
        fontSize: 12,
        opacity: 0.9,
    },
});
