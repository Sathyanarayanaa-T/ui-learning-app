import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTutorStore } from '../../store/useTutorStore';
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
    const { setFeedback, regenerateMessage } = useTutorStore();
    const isUser = message.role === 'user';

    const handleCopy = async () => {
        await Clipboard.setStringAsync(message.text);
    };

    const handleLike = () => {
        setFeedback(message.id, message.feedback === 'like' ? undefined : 'like');
    };

    const handleDislike = () => {
        setFeedback(message.id, message.feedback === 'dislike' ? undefined : 'dislike');
    };

    const handleRegenerate = () => {
        regenerateMessage(message.id);
    };

    return (
        <View style={[styles.row, isUser ? styles.rowUser : styles.rowAI]}>
            {/* Avatar */}
            {!isUser && (
                <View style={[styles.avatar, { backgroundColor: colors.hexawareBlue }]}>
                    <Ionicons name="bulb" size={16} color="#FFF" />
                </View>
            )}

            {/* Bubble */}
            <View style={[
                styles.bubble,
                isUser
                    ? [styles.bubbleUser, { backgroundColor: colors.hexawareBlue }]
                    : [styles.bubbleAI, { backgroundColor: colors.snow, borderColor: colors.borderLight }],
            ]}>
                <Markdown 
                    style={isUser ? markdownStyleUser : markdownStyleAI(colors.black)}
                    rules={{
                        fence: (node: any, children: any, parent: any, ruleStyles: any) => (
                            <View key={node.key} style={styles.codeContainer}>
                                <View style={styles.codeHeader}>
                                    <Text style={styles.codeLang}>{node.sourceInfo || 'code'}</Text>
                                    <TouchableOpacity 
                                        onPress={() => Clipboard.setStringAsync(node.content)} 
                                        style={styles.codeCopy}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <Ionicons name="copy-outline" size={14} color="#A0AEC0" />
                                        <Text style={styles.codeCopyText}>Copy</Text>
                                    </TouchableOpacity>
                                </View>
                                <Text style={[ruleStyles.fence, styles.codeContent]}>{node.content}</Text>
                            </View>
                        ),
                        code_block: (node: any, children: any, parent: any, ruleStyles: any) => (
                            <View key={node.key} style={styles.codeContainer}>
                                <View style={styles.codeHeader}>
                                    <Text style={styles.codeLang}>code</Text>
                                    <TouchableOpacity 
                                        onPress={() => Clipboard.setStringAsync(node.content)} 
                                        style={styles.codeCopy}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <Ionicons name="copy-outline" size={14} color="#A0AEC0" />
                                        <Text style={styles.codeCopyText}>Copy</Text>
                                    </TouchableOpacity>
                                </View>
                                <Text style={[ruleStyles.code_block, styles.codeContent]}>{node.content}</Text>
                            </View>
                        )
                    }}
                >
                    {message.text}
                </Markdown>

                {message.timestamp ? (
                    <Text style={[styles.timestamp, { color: isUser ? '#FFFFFF88' : colors.silver }]}>
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                ) : null}

                {!isUser && (
                    <View style={[styles.actionsFooter, { borderTopColor: colors.borderLight }]}>
                        <View style={styles.feedbackActions}>
                            <TouchableOpacity onPress={handleCopy} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={styles.actionBtn}>
                                <Ionicons name="copy-outline" size={16} color={colors.silver} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleLike} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={styles.actionBtn}>
                                <Ionicons name={message.feedback === 'like' ? "thumbs-up" : "thumbs-up-outline"} size={16} color={message.feedback === 'like' ? colors.hexawareBlue : colors.silver} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleDislike} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={styles.actionBtn}>
                                <Ionicons name={message.feedback === 'dislike' ? "thumbs-down" : "thumbs-down-outline"} size={16} color={message.feedback === 'dislike' ? "#FF3B30" : colors.silver} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleRegenerate} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={styles.actionBtn}>
                                <Ionicons name="refresh-outline" size={16} color={colors.silver} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
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
    actionsFooter: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'flex-end', 
        marginTop: Spacing.sm, 
        paddingTop: Spacing.xs, 
        borderTopWidth: StyleSheet.hairlineWidth 
    },
    feedbackActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    actionBtn: { padding: 4 },
    codeContainer: {
        backgroundColor: '#0A0A1A',
        borderRadius: 8,
        marginVertical: Spacing.xs,
        overflow: 'hidden',
    },
    codeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1A1A2E',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
    },
    codeLang: {
        color: '#A0AEC0',
        fontSize: FontSize.xs,
        fontFamily: 'monospace',
    },
    codeCopy: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    codeCopyText: {
        color: '#A0AEC0',
        fontSize: FontSize.xs,
    },
    codeContent: {
        marginVertical: 0,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
    },
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
