import React, { useEffect, useRef, useState } from 'react';
import {
    View, StyleSheet, ScrollView, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, FlatList, ListRenderItemInfo, Keyboard,
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '../../components/atoms/AppText';
import { ChatBubble } from '../../components/molecules/ChatBubble';
import { TypingIndicator } from '../../components/molecules/TypingIndicator';
import { WebContainer } from '../../components/layout/WebContainer';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '../../constants/theme';
import { useTutorStore, type RecentTopic } from '../../store/useTutorStore';
import { useAppStore } from '../../store/useAppStore';
import { useColors } from '../../hooks/useColors';
import type { ChatMessage } from '../../types/tutor';

export default function TutorScreen() {
    const {
        session, messages, isTyping, startSession, sendMessage, clearChat,
        recentTopics, loadRecentTopics, restoreSession, removeRecentTopic,
    } = useTutorStore();
    const user = useAppStore((s) => s.user);
    const colors = useColors();
    const insets = useSafeAreaInsets();

    const [input, setInput] = useState('');
    const [topicInput, setTopicInput] = useState('');
    const listRef = useRef<FlatList<ChatMessage>>(null);

    useEffect(() => {
        loadRecentTopics();
    }, []);

    const handleStartNew = () => {
        const topic = topicInput.trim();
        if (!topic) return;
        setTopicInput('');
        Keyboard.dismiss();
        startSession(topic);
    };

    const handleSend = async () => {
        const text = input.trim();
        if (!text || isTyping) return;
        setInput('');
        await sendMessage(text, user?.userId ?? 'anonymous');
    };

    const scrollToBottom = () => {
        if (messages.length > 0) listRef.current?.scrollToEnd({ animated: true });
    };

    const isChatActive = session !== null;

    // ─────────────────────────────────────────────────────────────────
    // EMPTY STATE / "HOME" VIEW
    // Centered input + list of past sessions
    // ─────────────────────────────────────────────────────────────────
    if (!isChatActive) {
        return (
            <View style={[styles.root, { backgroundColor: colors.light }]}>
                <LinearGradient
                    colors={[Colors.darkBlue, Colors.hexawareBlue]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.header, { paddingTop: Math.max(insets.top, 40), zIndex: 10, elevation: 10 }]}
                >
                    <WebContainer>
                        <View style={styles.headerInner}>
                            <View>
                                <AppText style={styles.headerSuper}>Powered by React & AI</AppText>
                                <AppText style={styles.headerTitle}>AI Tutor</AppText>
                            </View>
                        </View>
                    </WebContainer>
                </LinearGradient>

                <KeyboardAvoidingView
                    style={styles.flex}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <ScrollView
                        contentContainerStyle={styles.emptyScrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <WebContainer>
                            {/* ── Centered Topic Input ── */}
                            <View style={styles.centeredInputSection}>
                                <Ionicons name="hardware-chip" size={52} color={Colors.canary} style={{ marginBottom: Spacing.md }} />
                                <AppText variant="title" style={styles.emptyTitle}>What do you want to learn?</AppText>

                                <View style={[styles.topicInputWrapper, { backgroundColor: colors.snow, borderColor: colors.borderLight }, Shadow.sm]}>
                                    <TextInput
                                        value={topicInput}
                                        onChangeText={setTopicInput}
                                        placeholder="e.g. React context API, Docker basics..."
                                        placeholderTextColor={colors.silver}
                                        style={[styles.topicInput, { color: colors.black }]}
                                        returnKeyType="go"
                                        onSubmitEditing={handleStartNew}
                                    />
                                    <TouchableOpacity
                                        onPress={handleStartNew}
                                        disabled={!topicInput.trim()}
                                        style={[
                                            styles.topicSendBtn,
                                            { backgroundColor: topicInput.trim() ? colors.hexawareBlue : colors.borderLight },
                                        ]}
                                    >
                                        <Ionicons name="arrow-forward" size={20} color="#FFF" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* ── Topic History ── */}
                            {recentTopics.length > 0 && (
                                <View style={styles.historySection}>
                                    <AppText variant="label" style={styles.historyTitle}>Your Sessions</AppText>
                                    <View style={[styles.historyList, { backgroundColor: colors.snow, borderColor: colors.borderLight }]}>
                                        {recentTopics.map((t, idx) => (
                                            <View key={t.topicId}>
                                                {idx > 0 && <View style={[styles.historyDivider, { backgroundColor: colors.borderLight }]} />}
                                                <TouchableOpacity
                                                    style={styles.historyItem}
                                                    activeOpacity={0.7}
                                                    onPress={() => restoreSession(t, user?.userId ?? 'anonymous')}
                                                >
                                                    <Ionicons name="chatbox-outline" size={20} color={colors.silver} style={{ marginRight: Spacing.md }} />
                                                    <View style={styles.historyItemBody}>
                                                        <AppText variant="label" numberOfLines={1}>{t.topicLabel}</AppText>
                                                        <AppText variant="caption" style={{ color: colors.silver }}>
                                                            {t.messageCount} msgs • {new Date(t.lastUsed).toLocaleDateString()}
                                                        </AppText>
                                                    </View>
                                                    <TouchableOpacity
                                                        onPress={() => removeRecentTopic(t.topicId)}
                                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                                    >
                                                        <Ionicons name="close" size={16} color={colors.silver} />
                                                    </TouchableOpacity>
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}
                        </WebContainer>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        );
    }

    // ─────────────────────────────────────────────────────────────────
    // ACTIVE CHAT VIEW
    // Sticky input at bottom + messages list
    // ─────────────────────────────────────────────────────────────────
    return (
        <View style={[styles.root, { backgroundColor: colors.light }]}>
            <LinearGradient
                colors={[Colors.darkBlue, Colors.hexawareBlue]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.headerCompact, { paddingTop: Math.max(insets.top, 40), zIndex: 10, elevation: 10 }]}
            >
                <WebContainer>
                    <View style={styles.headerInner}>
                        <View style={styles.headerCenter}>
                            <AppText style={styles.headerTopic} numberOfLines={1}>
                                {session.topicLabel}
                            </AppText>
                        </View>
                        <TouchableOpacity
                            onPress={clearChat}
                            style={[styles.newBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
                        >
                            <AppText style={styles.newText}>+ New</AppText>
                        </TouchableOpacity>
                    </View>
                </WebContainer>
            </LinearGradient>

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <FlatList
                    ref={listRef}
                    data={messages}
                    keyExtractor={(m) => m.id}
                    renderItem={({ item }) => <ChatBubble message={item} />}
                    contentContainerStyle={styles.listContent}
                    onContentSizeChange={scrollToBottom}
                    ListFooterComponent={isTyping ? <TypingIndicator /> : null}
                />

                {/* ── Input bar ─────────────────────────────── */}
                <View style={[styles.chatInputContainer, { backgroundColor: colors.snow, borderTopColor: colors.borderLight }]}>
                    <WebContainer>
                        <SafeAreaView edges={['bottom']}>
                            <View style={styles.chatInputRow}>
                                <TextInput
                                    value={input}
                                    onChangeText={setInput}
                                    placeholder="Ask a question…"
                                    placeholderTextColor={colors.silver}
                                    style={[styles.chatInput, { backgroundColor: colors.white, borderColor: colors.borderLight, color: colors.black }]}
                                    multiline
                                    returnKeyType="send"
                                    onSubmitEditing={handleSend}
                                    blurOnSubmit={false}
                                />
                                <TouchableOpacity
                                    onPress={handleSend}
                                    disabled={!input.trim() || isTyping}
                                    style={[
                                        styles.chatSendBtn,
                                        { backgroundColor: input.trim() && !isTyping ? Colors.brightBlue : colors.borderLight },
                                    ]}
                                >
                                    <Ionicons name="arrow-up" size={20} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        </SafeAreaView>
                    </WebContainer>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    flex: { flex: 1 },

    // ── Header (Shared)
    header: { paddingBottom: Spacing.xl },
    headerCompact: { paddingBottom: Spacing.xs },
    headerInner: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm,
    },
    headerSuper: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.canary, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 },
    headerTitle: { fontSize: FontSize['2xl'], fontWeight: '800', color: Colors.snow },

    // ── Chat Header
    headerCenter: { flex: 1, marginRight: Spacing.md },
    headerTopic: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.snow },
    newBtn: { paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: Radius.full },
    newText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.snow },

    // ── Empty State
    emptyScrollContent: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing['3xl'] },
    centeredInputSection: { alignItems: 'center', marginBottom: Spacing['3xl'], marginTop: Spacing['3xl'] },
    emptyTitle: { fontSize: FontSize['2xl'], fontWeight: '800', marginBottom: Spacing['2xl'], textAlign: 'center' },
    topicInputWrapper: {
        flexDirection: 'row', alignItems: 'center',
        width: '100%', maxWidth: 500,
        borderRadius: Radius.full, borderWidth: 1,
        paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    },
    topicInput: { flex: 1, fontSize: FontSize.md, minHeight: 52, paddingVertical: 8, paddingHorizontal: 8 },
    topicSendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },

    // ── Topic History List
    historySection: { alignSelf: 'center', width: '100%', maxWidth: 500 },
    historyTitle: { marginBottom: Spacing.sm, fontSize: FontSize.sm, textTransform: 'uppercase', letterSpacing: 1 },
    historyList: { borderRadius: Radius.lg, borderWidth: 1, overflow: 'hidden' },
    historyDivider: { height: 1 },
    historyItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg },
    historyItemBody: { flex: 1 },

    // ── Chat View
    listContent: { paddingTop: Spacing.lg, paddingBottom: Spacing.md },

    // ── Chat Input Bar
    chatInputContainer: { borderTopWidth: 1, paddingTop: Spacing.sm, paddingHorizontal: Spacing.lg },
    chatInputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, paddingBottom: Spacing.sm },
    chatInput: {
        flex: 1, borderRadius: Radius.lg, borderWidth: 1.5,
        paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
        fontSize: FontSize.md, maxHeight: 120, minHeight: 46,
    },
    chatSendBtn: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
});
