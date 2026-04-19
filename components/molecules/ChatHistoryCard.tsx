import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../hooks/useColors';
import type { LocalSession } from '../../types/tutor';

interface ChatHistoryCardProps {
    session: LocalSession;
    onPress: (session: LocalSession) => void;
    onDelete: (sessionId: string) => void;
}

export function ChatHistoryCard({ session, onPress, onDelete }: ChatHistoryCardProps) {
    const colors = useColors();
    const formattedDate = new Date(session.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

    return (
        <View style={styles.wrapper}>
            <TouchableOpacity style={[styles.card, { backgroundColor: colors.white }]} onPress={() => onPress(session)}>
                <View style={styles.body}>
                    <Text style={[styles.title, { color: colors.black }]} numberOfLines={1}>{session.title || 'New Chat'}</Text>
                    <View style={styles.metaRow}>
                        <Ionicons name="chatbubble-ellipses-outline" size={14} color="#888888" style={styles.icon} />
                        <Text style={styles.metaText}>{session.messageCount || 0}</Text>
                        
                        <Ionicons name="calendar-outline" size={14} color="#888888" style={[styles.icon, { marginLeft: 12 }]} />
                        <Text style={styles.metaText}>{formattedDate}</Text>
                    </View>
                </View>
                <TouchableOpacity
                    onPress={() => onDelete(session.session_id)}
                    style={styles.deleteBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="close" size={20} color="#888888" />
                </TouchableOpacity>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        width: '100%',
        maxWidth: 500,
        alignSelf: 'center',
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingVertical: 16,
        paddingLeft: 16,
        paddingRight: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    body: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1B1F5E',
        marginBottom: 8,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    icon: {
        marginRight: 4,
    },
    metaText: {
        fontWeight: '600',
        fontSize: 12,
        color: '#888888',
    },
    deleteBtn: {
        paddingLeft: 16,
    },
});
