import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useColors } from '../../hooks/useColors';

export type Message = {
    id: string;
    role: 'user' | 'ai' | 'assistant';
    text?: string;
    content?: string; // keeping for backwards compatibility if needed elsewhere
    timestamp: string;
    liked?: boolean;
    disliked?: boolean;
    isTyping?: boolean;
    isError?: boolean;
    lastUserMessage?: string;
};

interface MessageBubbleProps {
    message: Message;
    onLike?: (id: string) => void;
    onDislike?: (id: string) => void;
    onRetry?: (lastUserMessage: string) => void;
    onRegenerate?: (id: string) => void;
}

const TypingDots = () => {
    const [dot1] = useState(new Animated.Value(0.3));
    const [dot2] = useState(new Animated.Value(0.3));
    const [dot3] = useState(new Animated.Value(0.3));

    useEffect(() => {
        const animateDot = (dot: Animated.Value, delay: number) => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true, delay }),
                    Animated.timing(dot, { toValue: 0.3, duration: 300, useNativeDriver: true })
                ])
            ).start();
        };

        animateDot(dot1, 0);
        animateDot(dot2, 150);
        animateDot(dot3, 300);
    }, []);

    return (
        <View style={styles.typingContainer}>
            <Animated.View style={[styles.typingDot, { opacity: dot1 }]} />
            <Animated.View style={[styles.typingDot, { opacity: dot2 }]} />
            <Animated.View style={[styles.typingDot, { opacity: dot3 }]} />
        </View>
    );
};

export function MessageBubble({ message, onLike, onDislike, onRetry, onRegenerate }: MessageBubbleProps) {
    const isUser = message.role === 'user';
    const colors = useColors();

    const handleCopy = async () => {
        const textToCopy = message.text || message.content;
        if (textToCopy) {
            await Clipboard.setStringAsync(textToCopy);
        }
    };

    if (message.isError) {
        return (
            <TouchableOpacity 
                style={styles.aiRow} 
                onPress={() => onRetry && message.lastUserMessage && onRetry(message.lastUserMessage)}
            >
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>AI</Text>
                </View>
                <View style={[styles.bubble, styles.aiBubble, styles.errorBubble, { backgroundColor: colors.white }]}>
                    <Text style={[styles.errorText, { color: colors.error }]}>Something went wrong. Tap to retry.</Text>
                </View>
            </TouchableOpacity>
        );
    }

    if (isUser) {
        return (
            <View style={styles.userRow}>
                <View style={styles.userBubbleContainer}>
                    <View style={[styles.bubble, styles.userBubble]}>
                        <Text style={styles.userText}>{message.text || message.content}</Text>
                    </View>
                    <Text style={styles.timestamp}>{message.timestamp}</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.aiRow}>
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>AI</Text>
            </View>
            <View style={styles.aiBubbleContainer}>
                <View style={[styles.bubble, styles.aiBubble, { backgroundColor: colors.white }]}>
                    {message.isTyping ? (
                        <TypingDots />
                    ) : (
                        <Text style={[styles.aiText, { color: colors.black }]}>{message.text || message.content}</Text>
                    )}
                </View>
                {!message.isTyping && (
                    <View style={styles.aiFooter}>
                        <Text style={styles.timestamp}>{message.timestamp}</Text>
                        <View style={styles.actionRow}>
                            <TouchableOpacity style={styles.actionBtn} onPress={handleCopy}>
                                <Ionicons name="copy-outline" size={14} color="#888888" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionBtn} onPress={() => onLike?.(message.id)}>
                                <Ionicons name={message.liked ? "thumbs-up" : "thumbs-up-outline"} size={14} color={message.liked ? "#4CAF50" : "#888888"} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionBtn} onPress={() => onDislike?.(message.id)}>
                                <Ionicons name={message.disliked ? "thumbs-down" : "thumbs-down-outline"} size={14} color={message.disliked ? "#F44336" : "#888888"} />
                            </TouchableOpacity>
                            {onRegenerate && (
                                <TouchableOpacity style={styles.actionBtn} onPress={() => onRegenerate(message.id)}>
                                    <Ionicons name="refresh-outline" size={14} color="#888888" />
                                </TouchableOpacity>
                            )}
                            {onRetry && message.lastUserMessage && (
                                <TouchableOpacity style={styles.actionBtn} onPress={() => onRetry(message.lastUserMessage!)}>
                                    <Ionicons name="refresh-circle-outline" size={14} color="#888888" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    userRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 16,
        paddingHorizontal: 16,
    },
    userBubbleContainer: {
        alignItems: 'flex-end',
        maxWidth: '80%',
    },
    aiRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginBottom: 16,
        paddingHorizontal: 16,
    },
    aiBubbleContainer: {
        alignItems: 'flex-start',
        maxWidth: '80%',
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#7B6CF6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        marginTop: 4,
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    bubble: {
        padding: 12,
        borderRadius: 16,
    },
    userBubble: {
        backgroundColor: '#3D3BF3',
        borderBottomRightRadius: 4,
    },
    aiBubble: {
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    errorBubble: {
        backgroundColor: '#FFEBEE',
        borderWidth: 1,
        borderColor: '#FFCDD2',
    },
    userText: {
        color: '#FFFFFF',
        fontSize: 14,
        lineHeight: 20,
    },
    aiText: {
        color: '#111111',
        fontSize: 14,
        lineHeight: 20,
    },
    errorText: {
        color: '#D32F2F',
        fontSize: 14,
    },
    timestamp: {
        fontSize: 11,
        color: '#888888',
        marginTop: 4,
    },
    aiFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 12,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        padding: 4,
    },
    typingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 20,
        gap: 4,
        paddingHorizontal: 8,
    },
    typingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#3D3BF3',
    },
});
