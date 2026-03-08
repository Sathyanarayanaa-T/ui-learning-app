import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useColors } from '../../hooks/useColors';
import { FontSize, FontWeight, Radius, Spacing } from '../../constants/theme';
import type { ChatMessage } from '../../types/tutor';

interface ChatBubbleProps {
    message: ChatMessage;
}

// ── Simple inline code-block parser ─────────────────────────
// Splits text into plain segments and ```...``` code blocks.
type Segment = { type: 'text' | 'code'; content: string };

function parseContent(text: string): Segment[] {
    const segments: Segment[] = [];
    const codeBlockReg = /```[\s\S]*?```/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = codeBlockReg.exec(text)) !== null) {
        if (match.index > lastIndex) {
            segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
        }
        const raw = match[0].replace(/^```[^\n]*\n?/, '').replace(/```$/, '');
        segments.push({ type: 'code', content: raw });
        lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
        segments.push({ type: 'text', content: text.slice(lastIndex) });
    }
    return segments;
}

// ── Inline bold (**text**) renderer ──────────────────────────
function BoldText({ text, color }: { text: string; color: string }) {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return (
        <Text>
            {parts.map((p, i) =>
                p.startsWith('**') && p.endsWith('**') ? (
                    <Text key={i} style={{ fontWeight: '700', color }}>{p.slice(2, -2)}</Text>
                ) : (
                    <Text key={i} style={{ color }}>{p}</Text>
                )
            )}
        </Text>
    );
}

// ── Chat Bubble ──────────────────────────────────────────────
export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
    const colors = useColors();
    const isUser = message.role === 'user';
    const segments = parseContent(message.text);

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
                {segments.map((seg, i) =>
                    seg.type === 'code' ? (
                        <View key={i} style={styles.codeBlock}>
                            <Text style={styles.codeText}>{seg.content.trim()}</Text>
                        </View>
                    ) : (
                        <BoldText
                            key={i}
                            text={seg.content}
                            color={isUser ? '#FFFFFF' : colors.black}
                        />
                    )
                )}

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
