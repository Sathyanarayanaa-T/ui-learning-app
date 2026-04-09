import React, { useEffect, useRef, useState } from 'react';
import {
    View, StyleSheet, ScrollView, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, FlatList, ActivityIndicator, Keyboard,
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '../../components/atoms/AppText';
import { ChatBubble } from '../../components/molecules/ChatBubble';
import { TypingIndicator } from '../../components/molecules/TypingIndicator';
import { WebContainer } from '../../components/layout/WebContainer';
import * as DocumentPicker from 'expo-document-picker';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '../../constants/theme';
import { useTutorStore } from '../../store/useTutorStore';
import { useColors } from '../../hooks/useColors';
import type { ChatMessage, ChatMode } from '../../types/tutor';

const MODES: { value: ChatMode, label: string, icon: keyof typeof Ionicons.glyphMap }[] = [
    { value: 'normal', label: 'Normal QA', icon: 'chatbox-ellipses-outline' },
    { value: 'teaching', label: 'Teaching', icon: 'school-outline' },
    { value: 'guiding', label: 'Guiding', icon: 'compass-outline' }
];

export default function TutorScreen() {
    const {
        activeSessionId, activeSessionTitle, messages, isTyping, startNewSession, 
        sendMessage, clearActiveChat, isStarting,
        sessions, loadSessions, restoreSession, removeSession,
        chatMode, setChatMode,
        activeDocumentId, activeDocumentName, isUploading, uploadFile, clearActiveDocument
    } = useTutorStore();
    
    const colors = useColors();
    const insets = useSafeAreaInsets();

    const [input, setInput] = useState('');
    const listRef = useRef<FlatList<ChatMessage>>(null);

    useEffect(() => {
        loadSessions();
    }, []);

    const handleSend = async () => {
        const text = input.trim();
        if (!text || isTyping) return;
        setInput('');
        await sendMessage(text);
    };

    const handleAttach = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
            });
            if (result.canceled === false) {
                const doc = result.assets[0];
                await uploadFile(doc);
            }
        } catch (err) {
            console.error("Document pick error", err);
        }
    };

    const scrollToBottom = () => {
        if (messages.length > 0) listRef.current?.scrollToEnd({ animated: true });
    };

    const isChatActive = activeSessionId !== null;

    // ─────────────────────────────────────────────────────────────────
    // EMPTY STATE / "HOME" VIEW
    // "Start New Chat" + List of history
    // ─────────────────────────────────────────────────────────────────
    if (!isChatActive) {
        return (
            <View style={[styles.root, { backgroundColor: colors.light }]}>
                <View
                    style={[styles.header, { backgroundColor: Colors.darkBlue, paddingTop: Math.max(insets.top, 16), zIndex: 10, elevation: 10 }]}
                >
                    <WebContainer>
                        <View style={styles.headerInner}>
                            <View>
                                <AppText style={styles.headerSuper}>Powered by React & AI</AppText>
                                <AppText style={styles.headerTitle}>AI Tutor</AppText>
                            </View>
                        </View>
                    </WebContainer>
                </View>

                <ScrollView
                    contentContainerStyle={styles.emptyScrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <WebContainer>
                        {/* ── Start Chat CTA ── */}
                        <View style={styles.centeredInputSection}>
                            <Ionicons name="hardware-chip" size={52} color={Colors.canary} style={{ marginBottom: Spacing.md }} />
                            <AppText variant="title" style={styles.emptyTitle}>Ready to start learning?</AppText>
                            <View style={styles.startModesContainer}>
                                {MODES.map((mode) => (
                                    <TouchableOpacity
                                        key={mode.value}
                                        onPress={() => startNewSession(mode.value)}
                                        disabled={isStarting}
                                        activeOpacity={0.8}
                                        style={[styles.startModeCard, Shadow.sm, { backgroundColor: colors.snow, borderColor: colors.borderLight }]}
                                    >
                                        <View style={[styles.startModeIcon, { backgroundColor: colors.hexawareBlue + '15' }]}>
                                            <Ionicons name={mode.icon} size={24} color={colors.hexawareBlue} />
                                        </View>
                                        <View style={styles.startModeBody}>
                                            <AppText style={styles.startModeTitle}>{mode.label}</AppText>
                                            <AppText style={styles.startModeDesc} numberOfLines={2}>
                                                {mode.value === 'normal' ? 'Direct Q&A answers and explanations' : mode.value === 'teaching' ? 'Detailed conceptual breakdowns' : 'Socratic hints and guided learning'}
                                            </AppText>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* ── Session History ── */}
                        {sessions.length > 0 && (
                            <View style={styles.historySection}>
                                {[
                                    { title: 'Normal Q&A', filter: (s: any) => !s.mode || s.mode === 'normal' },
                                    { title: 'Teaching Sessions', filter: (s: any) => s.mode === 'teaching' },
                                    { title: 'Guiding Sessions', filter: (s: any) => s.mode === 'guiding' },
                                ].map((group) => {
                                    const groupSessions = sessions.filter(group.filter);
                                    if (groupSessions.length === 0) return null;
                                    
                                    return (
                                        <View key={group.title} style={styles.historyGroup}>
                                            <AppText variant="label" style={styles.historyTitle}>{group.title}</AppText>
                                            <View style={[styles.historyList, { backgroundColor: colors.snow, borderColor: colors.borderLight }]}>
                                                {groupSessions.map((s, idx) => (
                                                    <View key={s.session_id}>
                                                        {idx > 0 && <View style={[styles.historyDivider, { backgroundColor: colors.borderLight }]} />}
                                                        <TouchableOpacity
                                                            style={styles.historyItem}
                                                            activeOpacity={0.7}
                                                            onPress={() => restoreSession(s)}
                                                        >
                                                            <Ionicons name="chatbox-outline" size={20} color={colors.silver} style={{ marginRight: Spacing.md }} />
                                                            <View style={styles.historyItemBody}>
                                                                <AppText variant="label" numberOfLines={1}>{s.title}</AppText>
                                                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                                                    <Ionicons name="chatbubbles-outline" size={14} color={colors.silver} style={{ marginRight: 4 }} />
                                                                    <AppText variant="caption" style={{ color: colors.silver, marginRight: Spacing.md, fontWeight: '600' }}>
                                                                        {s.messageCount}
                                                                    </AppText>
                                                                    <Ionicons name="calendar-outline" size={14} color={colors.silver} style={{ marginRight: 4 }} />
                                                                    <AppText variant="caption" style={{ color: colors.silver, fontWeight: '600' }}>
                                                                        {new Date(s.createdAt).toLocaleDateString()}
                                                                    </AppText>
                                                                </View>
                                                            </View>
                                                            <TouchableOpacity
                                                                onPress={() => removeSession(s.session_id)}
                                                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                                            >
                                                                <Ionicons name="close" size={16} color={colors.silver} />
                                                            </TouchableOpacity>
                                                        </TouchableOpacity>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    </WebContainer>
                </ScrollView>
            </View>
        );
    }

    // ─────────────────────────────────────────────────────────────────
    // ACTIVE CHAT VIEW
    // Header + Segmented Control + Chat List + Input
    // ─────────────────────────────────────────────────────────────────
    return (
        <View style={[styles.root, { backgroundColor: colors.light }]}>
            <View
                style={[styles.headerCompact, { backgroundColor: Colors.darkBlue, paddingTop: Math.max(insets.top, 16), zIndex: 10, elevation: 10 }]}
            >
                <WebContainer>
                    <View style={styles.headerInner}>
                        <View style={styles.headerCenter}>
                            <AppText style={styles.headerTopic} numberOfLines={1}>
                                {activeSessionTitle || 'New Session'}
                            </AppText>
                            <AppText style={styles.headerMode}>
                                {chatMode === 'normal' ? 'Normal Q&A' : chatMode === 'teaching' ? 'Teaching Mode' : 'Guiding Mode'}
                            </AppText>
                        </View>
                        <TouchableOpacity
                            onPress={clearActiveChat}
                            style={[styles.iconBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
                        >
                            <Ionicons name="chevron-back" size={20} color={Colors.snow} />
                        </TouchableOpacity>
                    </View>
                </WebContainer>
            </View>

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
                            {activeDocumentId && (
                                <View style={[styles.activeDocBadge, { backgroundColor: colors.hexawareBlue + '15' }]}>
                                    <Ionicons name="document-text" size={14} color={colors.hexawareBlue} />
                                    <AppText style={styles.activeDocName} numberOfLines={1}>{activeDocumentName}</AppText>
                                    <TouchableOpacity onPress={clearActiveDocument}>
                                        <Ionicons name="close-circle" size={16} color={colors.silver} />
                                    </TouchableOpacity>
                                </View>
                            )}
                            <View style={styles.chatInputRow}>
                                <TouchableOpacity onPress={handleAttach} disabled={isTyping || isUploading} style={styles.attachBtn}>
                                    {isUploading ? <ActivityIndicator size="small" color={colors.hexawareBlue} /> : <Ionicons name="attach" size={24} color={colors.silver} />}
                                </TouchableOpacity>
                                <TextInput
                                    value={input}
                                    onChangeText={setInput}
                                    placeholder="Message AI Tutor..."
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
    headerCompact: { paddingBottom: Spacing.md },
    headerInner: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg, paddingTop: Spacing.xs, paddingBottom: Spacing.xs,
    },
    headerSuper: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.canary, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 },
    headerTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.snow },

    // ── Chat Header
    headerCenter: { flex: 1, marginRight: Spacing.md },
    headerTopic: { fontSize: FontSize.md, fontWeight: '700', color: Colors.snow },
    iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    
    headerMode: { fontSize: FontSize.xs, color: Colors.snow, opacity: 0.8, marginTop: 2 },
    
    // ── Mode Selector (Active) -> Mode Cards (Empty State)
    startModesContainer: {
        width: '100%', maxWidth: 500, alignSelf: 'center', gap: Spacing.md,
    },
    startModeCard: {
        flexDirection: 'row', alignItems: 'center', padding: Spacing.lg,
        borderRadius: Radius.lg, borderWidth: 1,
    },
    startModeIcon: {
        width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
        marginRight: Spacing.md,
    },
    startModeBody: { flex: 1 },
    startModeTitle: { fontSize: FontSize.md, fontWeight: '700', marginBottom: 2 },
    startModeDesc: { fontSize: FontSize.xs, color: Colors.silver },

    // ── Empty State
    emptyScrollContent: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing['3xl'] },
    centeredInputSection: { alignItems: 'center', marginBottom: Spacing['3xl'], marginTop: Spacing.xl },
    emptyTitle: { fontSize: FontSize['2xl'], fontWeight: '800', marginBottom: Spacing.lg, textAlign: 'center' },
    
    startBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderRadius: Radius.full,
        columnGap: Spacing.sm,
        minWidth: 220,
    },
    startBtnText: {
        color: Colors.snow,
        fontSize: FontSize.md,
        fontWeight: '700',
    },

    // ── Topic History List
    historySection: { alignSelf: 'center', width: '100%', maxWidth: 500 },
    historyGroup: { marginBottom: Spacing.xl },
    historyTitle: { marginBottom: Spacing.sm, fontSize: FontSize.sm, textTransform: 'uppercase', letterSpacing: 1 },
    historyList: { borderRadius: Radius.lg, borderWidth: 1, overflow: 'hidden' },
    historyDivider: { height: 1 },
    historyItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg },
    historyItemBody: { flex: 1 },

    // ── Chat View
    listContent: { paddingTop: Spacing.lg, paddingBottom: Spacing.md },

    // ── Document Badge
    activeDocBadge: {
        flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
        paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.full,
        marginBottom: Spacing.xs, gap: Spacing.xs,
    },
    activeDocName: { fontSize: FontSize.xs, color: Colors.hexawareBlue, fontWeight: '600', maxWidth: 200 },
    
    // ── Chat Input Bar
    chatInputContainer: { borderTopWidth: 1, paddingTop: Spacing.sm, paddingHorizontal: Spacing.lg },
    chatInputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, paddingBottom: Spacing.sm },
    attachBtn: { width: 44, height: 46, alignItems: 'center', justifyContent: 'center' },
    chatInput: {
        flex: 1, borderRadius: Radius.lg, borderWidth: 1.5,
        paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
        fontSize: FontSize.md, maxHeight: 120, minHeight: 46,
    },
    chatSendBtn: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
});
