import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useColors } from '../../hooks/useColors';
import { FontSize, FontWeight, Radius, Spacing } from '../../constants/theme';
import type { ChatMessage } from '../../types/tutor';
import Markdown from 'react-native-markdown-display';

interface ChatBubbleProps {
    message: ChatMessage;
}

// ── Chat Bubble ──────────────────────────────────────────────
export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
    const colors = useColors();
    const isUser = message.role === 'user';

    return (
        <View style={[styles.row, isUser ? styles.rowUser : styles.rowAI]}>
            {/* Avatar */}
            {!isUser && (
                <View style={[styles.avatar, { backgroundColor: colors.hexawareBlue }]}>
                    <Text style={styles.avatarText}>AI</Text>
                </View>
            )}

            {/* Bubble */}
            <View style={[
                styles.bubble,
                isUser
                    ? [styles.bubbleUser, { backgroundColor: colors.hexawareBlue }]
                    : [styles.bubbleAI, { backgroundColor: colors.snow, borderColor: colors.borderLight }],
            ]}>
                <Markdown style={isUser ? markdownStyleUser : markdownStyleAI(colors.black)}>
                    {message.text}
                </Markdown>

                {message.timestamp ? (
                    <Text style={[styles.timestamp, { color: isUser ? '#FFFFFF88' : colors.silver }]}>
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                ) : null}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    row: { flexDirection: 'row', marginBottom: Spacing.md, paddingHorizontal: Spacing.lg, alignItems: 'flex-end' },
    rowUser: { justifyContent: 'flex-end' },
    rowAI: { justifyContent: 'flex-start', gap: Spacing.sm },
    avatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    avatarText: { fontSize: 11, fontWeight: '700', color: '#FFF' },
    bubble: {
        maxWidth: '78%',
        borderRadius: Radius.lg,
        padding: Spacing.md,
    },
    bubbleUser: { borderBottomRightRadius: 4 },
    bubbleAI: { borderWidth: 1, borderBottomLeftRadius: 4 },
    codeBlock: {
        backgroundColor: '#0A0A1A',
        borderRadius: 8,
        padding: Spacing.md,
        marginVertical: Spacing.xs,
    },
    codeText: {
        fontFamily: 'monospace', // 'Courier New' on platforms with no monospace alias
        fontSize: FontSize.xs,
        color: '#14CBDE',
        lineHeight: 20,
    },
    timestamp: { fontSize: 10, marginTop: Spacing.xs, textAlign: 'right' },
});

const markdownStyleUser = StyleSheet.create({
    body: { color: '#FFFFFF', fontSize: FontSize.sm, lineHeight: 22 },
    code_block: { backgroundColor: '#0A0A1A', borderRadius: 8, padding: Spacing.md, marginTop: Spacing.xs, marginBottom: Spacing.xs },
    code_inline: { backgroundColor: '#0A0A1A', color: '#14CBDE', paddingHorizontal: 4, borderRadius: 4, fontFamily: 'monospace' },
    fence: { backgroundColor: '#0A0A1A', color: '#14CBDE', borderRadius: 8, padding: Spacing.md, fontFamily: 'monospace', fontSize: FontSize.xs },
    strong: { fontWeight: '700', color: '#FFFFFF' },
    link: { color: '#14CBDE', textDecorationLine: 'underline' },
    paragraph: { marginTop: 0, marginBottom: Spacing.xs },
});

const markdownStyleAI = (textColor: string) => StyleSheet.create({
    body: { color: textColor, fontSize: FontSize.sm, lineHeight: 22 },
    code_block: { backgroundColor: '#0A0A1A', borderRadius: 8, padding: Spacing.md, marginTop: Spacing.xs, marginBottom: Spacing.xs },
    code_inline: { backgroundColor: '#0A0A1A', color: '#14CBDE', paddingHorizontal: 4, borderRadius: 4, fontFamily: 'monospace' },
    fence: { backgroundColor: '#0A0A1A', color: '#14CBDE', borderRadius: 8, padding: Spacing.md, fontFamily: 'monospace', fontSize: FontSize.xs },
    strong: { fontWeight: '700', color: textColor },
    link: { color: '#3C2CDA', textDecorationLine: 'underline' },
    paragraph: { marginTop: 0, marginBottom: Spacing.xs },
});
