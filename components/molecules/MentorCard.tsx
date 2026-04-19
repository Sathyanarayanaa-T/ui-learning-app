import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MentorCardProps {
    name: string;
    avatarUrl?: string;
}

export function MentorCard({ name, avatarUrl }: MentorCardProps) {
    return (
        <View style={styles.container}>
            <View style={styles.avatarPlaceholder} />
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 70,
        alignItems: 'center',
        marginRight: 16,
    },
    avatarPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#111111',
        marginBottom: 8,
    },
    name: {
        fontSize: 12,
        color: '#111111',
        textAlign: 'center',
    },
});
