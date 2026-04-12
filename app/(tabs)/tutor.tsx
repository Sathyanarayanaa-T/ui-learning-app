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
import { useAppStore } from '../../store/useAppStore';
import { useColors } from '../../hooks/useColors';
import type { ChatMessage, ChatMode } from '../../types/tutor';
import { useRouter } from 'expo-router';

const MODES: { value: ChatMode, label: string, subtitle: string, icon: keyof typeof Ionicons.glyphMap }[] = [
    { value: 'normal', label: 'Resolve', subtitle: 'Normal QA: Direct Q&A answers and explanations', icon: 'chatbubbles-outline' },
    { value: 'teaching', label: 'Mastery', subtitle: 'Teaching: Detailed conceptual breakdowns', icon: 'school-outline' },
    { value: 'guiding', label: 'Navigate', subtitle: 'Guiding: Socratic hints and guided learning', icon: 'compass-outline' }
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
    const { isDark, toggleTheme } = useAppStore();
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const [input, setInput] = useState('');
    const listRef = useRef<FlatList<ChatMessage>>(null);

    const [activeFilter, setActiveFilter] = useState<string>('All');
    
    // FILTERS and mappings
    const FILTERS = ['All', 'Resolve', 'Mastery', 'Navigate'];
    const MODE_MAPPING: Record<string, string> = {
        'Resolve': 'normal',
        'Mastery': 'teaching',
        'Navigate': 'guiding'
    };
    
    const ICON_MAPPING: Record<string, keyof typeof Ionicons.glyphMap> = {
        'normal': 'chatbubbles-outline',
        'teaching': 'school-outline',
        'guiding': 'compass-outline'
    };

    const filteredSessions = sessions.filter(s => {
        if (activeFilter === 'All') return true;
        const targetMode = MODE_MAPPING[activeFilter];
        return (s.mode || 'normal') === targetMode;
    });

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

    const renderHeader = () => (
        <View style={{ width: '100%', maxWidth: 500, alignSelf: 'center' }}>
            <View style={styles.centeredInputSection}>
                <Ionicons name="hardware-chip" size={52} color={Colors.canary} style={{ marginBottom: Spacing.md }} />
                <AppText variant="title" style={[styles.emptyTitle, { color: isDark ? Colors.snow : Colors.darkBlue }]}>Ready to start learning?</AppText>
                <View style={styles.startModesContainer}>
                    {MODES.map((mode) => (
                        <TouchableOpacity
                            key={mode.value}
                            onPress={() => startNewSession(mode.value)}
                            disabled={isStarting}
                            activeOpacity={0.8}
                            style={[styles.startModeCard, Shadow.sm, { backgroundColor: colors.snow, paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg }]}
                        >
                            <View style={[styles.startModeIcon, { backgroundColor: isDark ? 'rgba(168, 85, 247, 0.2)' : '#F3E8FF' }]}>
                                <Ionicons name={mode.icon} size={24} color={isDark ? '#D8B4FE' : '#581C87'} />
                            </View>
                            <View style={styles.startModeBody}>
                                <AppText style={[styles.startModeTitle, { color: colors.black }]}>{mode.label}</AppText>
                                <AppText style={[styles.startModeDesc, { color: colors.silver }]} numberOfLines={2}>
                                    {mode.subtitle}
                                </AppText>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.historyHeader}>
                <AppText style={[styles.historyHeaderText, { color: isDark ? Colors.snow : Colors.darkBlue }]}>RECENT ACTIVITY</AppText>
            </View>
            
            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    {FILTERS.map(filter => {
                        const isActive = activeFilter === filter;
                        return (
                            <TouchableOpacity
                                key={filter}
                                onPress={() => setActiveFilter(filter)}
                                style={[
                                    styles.filterChip,
                                    { backgroundColor: isActive ? (isDark ? Colors.silver : Colors.darkBlue) : colors.borderLight }
                                ]}
                            >
                                <AppText style={[styles.filterChipText, { color: isActive ? (isDark ? Colors.darkBlue : Colors.snow) : colors.black }]}>
                                    {filter}
                                </AppText>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>
        </View>
    );

    const renderItem = ({ item }: { item: any }) => {
        const mode = item.mode || 'normal';
        const iconName = ICON_MAPPING[mode] || 'chatbubbles-outline';
        
        return (
            <View style={styles.historyItemWrapper}>
                <TouchableOpacity 
                    activeOpacity={0.8}
                    onPress={() => restoreSession(item)}
                    style={[styles.historyItemCard, { backgroundColor: colors.snow, borderColor: colors.borderLight }]}
                >
                    <View style={styles.historyItemBody}>
                        <AppText variant="label" style={[styles.historyCardTitle, { color: colors.black }]} numberOfLines={1}>{item.title}</AppText>
                        <View style={styles.subtitleRow}>
                            <Ionicons name={iconName} size={14} color={colors.silver} style={styles.subtitleIcon} />
                            
                            <Ionicons name="chatbubble-ellipses-outline" size={14} color={colors.silver} style={[styles.subtitleIcon, { marginLeft: Spacing.sm }]} />
                            <AppText variant="caption" style={styles.subtitleText}>{item.messageCount || 0}</AppText>
                            
                            <Ionicons name="calendar-outline" size={14} color={colors.silver} style={[styles.subtitleIcon, { marginLeft: Spacing.sm }]} />
                            <AppText variant="caption" style={styles.subtitleText}>{new Date(item.createdAt).toLocaleDateString()}</AppText>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={() => removeSession(item.session_id)}
                        style={styles.deleteBtn}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="close" size={20} color={colors.silver} />
                    </TouchableOpacity>
                </TouchableOpacity>
            </View>
        );
    };

    if (!isChatActive) {
        return (
            <View style={[styles.root, { backgroundColor: colors.light }]}>
                {/* ── Header ── */}
                <SafeAreaView edges={['top']} style={{ backgroundColor: Colors.darkBlue, zIndex: 10, elevation: 10 }}>
                    <WebContainer>
                        <View style={[styles.headerInner, { paddingTop: Spacing.md, paddingBottom: Spacing.lg }]}>
                            <View>
                                <AppText style={styles.headerSuper}>INTELLIGENCE AT YOUR PACE</AppText>
                                <AppText style={styles.headerTitle}>Erudia</AppText>
                            </View>
                            <TouchableOpacity
                                onPress={toggleTheme}
                                activeOpacity={0.8}
                                style={[styles.iconBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
                            >
                                <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={20} color={Colors.snow} />
                            </TouchableOpacity>
                        </View>
                    </WebContainer>
                </SafeAreaView>

                {/* ── Main Unified View ── */}
                <FlatList
                    data={filteredSessions}
                    keyExtractor={item => item.session_id}
                    renderItem={renderItem}
                    ListHeaderComponent={renderHeader}
                    contentContainerStyle={styles.unifiedScrollContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={() => (
                        <View style={{ alignItems: 'center', marginTop: Spacing.xl }}>
                            <AppText style={{ color: colors.silver }}>No activity found.</AppText>
                        </View>
                    )}
                />
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
                                    placeholder="Message Erudia..."
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
        paddingHorizontal: Spacing.lg,
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

    // ── Unified State
    unifiedScrollContent: { paddingBottom: Spacing['3xl'], paddingTop: Spacing.md },
    centeredInputSection: { alignItems: 'center', marginBottom: Spacing.xl, marginTop: Spacing.sm },
    emptyTitle: { fontSize: FontSize['2xl'], fontWeight: '800', marginBottom: Spacing.lg, textAlign: 'center' },
    
    // ── History & Filters
    historyHeader: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm, width: '100%', maxWidth: 500, alignSelf: 'center' },
    historyHeaderText: { fontSize: FontSize.sm, fontWeight: 'bold', letterSpacing: 1.2, textTransform: 'uppercase' },
    filterContainer: { paddingBottom: Spacing.md, width: '100%', maxWidth: 500, alignSelf: 'center' },
    filterScroll: { paddingHorizontal: Spacing.lg, gap: Spacing.sm },
    filterChip: { paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: 20, height: 36, alignItems: 'center', justifyContent: 'center' },
    filterChipText: { fontSize: FontSize.sm, fontWeight: '600' },

    historyItemWrapper: { width: '100%', maxWidth: 500, alignSelf: 'center', paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
    historyItemCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, paddingLeft: Spacing.lg, paddingRight: Math.max(12, Spacing.lg), borderRadius: Radius.lg, borderWidth: 1, ...Shadow.sm },
    historyItemBody: { flex: 1 },
    historyCardTitle: { fontSize: FontSize.md, fontWeight: 'bold', marginBottom: 6 },
    subtitleRow: { flexDirection: 'row', alignItems: 'center' },
    subtitleIcon: { marginRight: 4 },
    subtitleText: { fontWeight: '600', fontSize: FontSize.xs, color: Colors.silver },
    deleteBtn: { paddingLeft: Spacing.md },

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
