import React, { useState, useEffect } from 'react';
import { 
    View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, 
    KeyboardAvoidingView, Platform, SafeAreaView, Keyboard, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MessageBubble } from '../../components/molecules/MessageBubble';
import { ChatHistoryCard } from '../../components/molecules/ChatHistoryCard';
import { AppText } from '../../components/atoms/AppText';
import { WebContainer } from '../../components/layout/WebContainer';
import { useChatbotStore } from '../../store/useChatbotStore';
import { useAppStore } from '../../store/useAppStore';
import { useColors } from '../../hooks/useColors';
import { Colors, Spacing, Radius, FontSize, Shadow } from '../../constants/theme';

export default function ChatbotScreen() {
    const {
        sessions, loadSessions, removeSession, 
        activeSessionId, activeSessionTitle, startNewSession, restoreSession, clearActiveChat,
        messages, isTyping, sendMessage, setMessages,
        editingMessageId, setEditingMessageId, editMessage
    } = useChatbotStore();

    const isDark = useAppStore((s) => s.isDark);
    const colors = useColors();

    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        loadSessions();
    }, []);

    useEffect(() => {
        if (editingMessageId) {
            const msg = messages.find(m => m.id === editingMessageId);
            if (msg) setInputText(msg.text || msg.content || '');
        } else {
            setInputText('');
        }
    }, [editingMessageId, messages]);

    const handleSend = async (textToProcess?: string) => {
        const text = textToProcess || inputText.trim();
        if (!text || isLoading || !activeSessionId) return;

        setInputText('');
        Keyboard.dismiss();
        setIsLoading(true);

        try {
            if (editingMessageId) {
                setEditingMessageId(null);
                await editMessage(editingMessageId, text);
            } else {
                await sendMessage(text);
            }
        } catch (error) {
            
        } finally {
            setIsLoading(false);
        }
    };

    const handleLike = (id: string) => {
        setMessages(messages.map(m => {
            if (m.id === id) {
                return { ...m, liked: !m.liked, disliked: false };
            }
            return m;
        }));
    };

    const handleDislike = (id: string) => {
        setMessages(messages.map(m => {
            if (m.id === id) {
                return { ...m, disliked: !m.disliked, liked: false };
            }
            return m;
        }));
    };

    const handleRetry = (lastUserMessage: string) => {
        setMessages(messages.filter(m => !m.isError));
        handleSend(lastUserMessage);
    };

    const renderHeader = () => (
        <View style={{ width: '100%', maxWidth: 500, alignSelf: 'center' }}>
            <View style={styles.centeredInputSection}>
                <Ionicons name="chatbubbles" size={52} color={Colors.electricBlue} style={{ marginBottom: Spacing.md }} />
                <AppText variant="title" style={[styles.emptyTitle, { color: isDark ? Colors.snow : Colors.darkBlue }]}>What's on your mind?</AppText>
                <AppText style={[styles.emptySubtitle, { color: colors.silver }]}>Ask questions, generate ideas, or explore new topics with your personal AI companion.</AppText>
                
                <TouchableOpacity
                    onPress={() => startNewSession()}
                    activeOpacity={0.8}
                    style={[styles.startModeCard, Shadow.sm, { backgroundColor: colors.snow }]}
                >
                    <View style={[styles.startModeIcon, { backgroundColor: isDark ? 'rgba(20, 203, 222, 0.2)' : '#E0F7FA' }]}>
                        <Ionicons name="rocket-outline" size={24} color={Colors.electricBlue} />
                    </View>
                    <View style={styles.startModeBody}>
                        <AppText style={[styles.startModeTitle, { color: colors.black }]}>Start New Conversation</AppText>
                        <AppText style={[styles.startModeDesc, { color: colors.silver }]} numberOfLines={2}>
                            Jump right into a general-purpose chat.
                        </AppText>
                    </View>
                </TouchableOpacity>
            </View>

            <View style={styles.historyHeader}>
                <AppText style={[styles.historyHeaderText, { color: isDark ? Colors.snow : Colors.darkBlue }]}>RECENT ACTIVITY</AppText>
            </View>
        </View>
    );

    if (!activeSessionId) {
        return (
            <View style={[styles.historySafeArea, { backgroundColor: colors.light }]}>
                {/* ── Header ── */}
                <SafeAreaView edges={['top']} style={{ backgroundColor: Colors.darkBlue, zIndex: 10, elevation: 10 }}>
                    <WebContainer>
                        <View style={[styles.headerInner, { paddingTop: Spacing.md, paddingBottom: Spacing.lg }]}>
                            <View>
                                <AppText style={styles.headerSuper}>YOUR AI COMPANION</AppText>
                                <AppText style={styles.headerTitle}>HexaLearn</AppText>
                            </View>
                            <TouchableOpacity
                                onPress={useAppStore.getState().toggleTheme}
                                activeOpacity={0.8}
                                style={[styles.iconBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
                            >
                                <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={20} color={Colors.snow} />
                            </TouchableOpacity>
                        </View>
                    </WebContainer>
                </SafeAreaView>

                {/* ── Main List ── */}
                <FlatList
                    data={sessions}
                    keyExtractor={(item) => item.session_id}
                    ListHeaderComponent={renderHeader}
                    contentContainerStyle={styles.unifiedScrollContent}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <View style={styles.historyItemWrapper}>
                            <ChatHistoryCard 
                                session={item} 
                                onPress={restoreSession} 
                                onDelete={removeSession} 
                            />
                        </View>
                    )}
                    ListEmptyComponent={() => (
                        <View style={styles.emptyState}>
                            <AppText style={styles.emptyText}>No recent activity yet.</AppText>
                        </View>
                    )}
                />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? colors.light : Colors.darkBlue }]}>
            <View style={[styles.header, { backgroundColor: isDark ? colors.light : Colors.darkBlue }]}>
                <TouchableOpacity onPress={clearActiveChat} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>
                    {activeSessionTitle || 'New Chat'}
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView 
                style={[styles.container, { backgroundColor: colors.light }]}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <View style={styles.chatArea}>
                    <FlatList
                        data={[...messages].reverse()}
                        keyExtractor={(item) => item.id}
                        inverted
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.listContent}
                        renderItem={({ item }) => (
                            <MessageBubble 
                                message={item} 
                                onLike={handleLike}
                                onDislike={handleDislike}
                                onRetry={handleRetry}
                                onRegenerate={(id) => regenerateMessage(id)}
                                onEdit={(id) => setEditingMessageId(id)}
                            />
                        )}
                    />
                </View>

                {editingMessageId && (
                    <View style={[styles.editingBanner, { backgroundColor: colors.hexawareBlue + '15', borderLeftColor: colors.hexawareBlue }]}>
                        <View style={styles.editingBannerContent}>
                            <Ionicons name="pencil" size={16} color={colors.hexawareBlue} />
                            <View style={{ marginLeft: 8, flex: 1 }}>
                                <AppText style={{ color: colors.hexawareBlue, fontSize: 12, fontWeight: 'bold' }}>Editing Message</AppText>
                                <AppText numberOfLines={1} style={{ color: colors.silver, fontSize: 12 }}>
                                    {messages.find(m => m.id === editingMessageId)?.text || messages.find(m => m.id === editingMessageId)?.content}
                                </AppText>
                            </View>
                        </View>
                        <TouchableOpacity onPress={() => setEditingMessageId(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Ionicons name="close" size={20} color={colors.silver} />
                        </TouchableOpacity>
                    </View>
                )}
                <View style={[styles.inputContainer, { backgroundColor: colors.white }]}>
                    <TouchableOpacity style={styles.attachBtn}>
                        <Ionicons name="attach" size={24} color={colors.silver} />
                    </TouchableOpacity>
                    <TextInput
                        style={[styles.textInput, { backgroundColor: colors.snow, color: colors.black }]}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Message HexaLearn..."
                        placeholderTextColor={colors.silver}
                        multiline
                    />
                    <TouchableOpacity 
                        style={[styles.sendBtn, { backgroundColor: (!inputText.trim() || isLoading) ? colors.borderLight : colors.hexawareBlue }]}
                        onPress={() => handleSend()}
                        disabled={!inputText.trim() || isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    // --- Empty State / History View Styles ---
    historySafeArea: {
        flex: 1,
    },
    headerInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
    },
    headerSuper: {
        fontSize: FontSize.xs,
        fontWeight: '700',
        color: Colors.electricBlue,
        letterSpacing: 1.2,
        marginBottom: 2,
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: Radius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    unifiedScrollContent: {
        paddingTop: Spacing.xl,
        paddingBottom: 100, // Clear bottom tab bar
    },
    centeredInputSection: {
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        marginBottom: Spacing['2xl'],
    },
    emptyTitle: {
        fontWeight: '800',
        fontSize: 28,
        textAlign: 'center',
        marginBottom: Spacing.sm,
    },
    emptySubtitle: {
        textAlign: 'center',
        fontSize: FontSize.md,
        lineHeight: 22,
        marginBottom: Spacing.xl,
        paddingHorizontal: Spacing.md,
    },
    startModeCard: {
        width: '100%',
        maxWidth: 400,
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
        borderRadius: Radius.xl,
    },
    startModeIcon: {
        width: 48,
        height: 48,
        borderRadius: Radius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    startModeBody: {
        flex: 1,
    },
    startModeTitle: {
        fontWeight: 'bold',
        fontSize: FontSize.lg,
        marginBottom: 4,
    },
    startModeDesc: {
        fontSize: FontSize.sm,
        lineHeight: 20,
    },
    historyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
        marginBottom: Spacing.md,
        width: '100%',
        maxWidth: 500,
        alignSelf: 'center',
    },
    historyHeaderText: {
        fontWeight: 'bold',
        fontSize: FontSize.sm,
        letterSpacing: 0.5,
    },
    historyItemWrapper: {
        width: '100%',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: FontSize.md,
        color: '#888',
    },

    // --- Active Chat Styles ---
    safeArea: {
        flex: 1,
        backgroundColor: '#1B1F5E',
    },
    header: {
        height: 56,
        backgroundColor: '#1B1F5E',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
    },
    backBtn: {
        padding: 8,
        width: 40,
        alignItems: 'center',
    },
    headerTitle: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    container: {
        flex: 1,
        backgroundColor: '#EEEAF4',
    },
    chatArea: {
        flex: 1,
    },
    listContent: {
        paddingVertical: 20,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 12,
        paddingVertical: 10,
        paddingBottom: Platform.OS === 'ios' ? 24 : 10, // Extra padding for safe area
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 5,
    },
    attachBtn: {
        padding: 8,
        marginBottom: 2,
    },
    textInput: {
        flex: 1,
        minHeight: 40,
        maxHeight: 180,
        backgroundColor: '#F8F8F8',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 12,
        marginHorizontal: 8,
        fontSize: 14,
        color: '#111111',
    },
    sendBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#3D3BF3',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 2,
    },
    sendBtnDisabled: {
        backgroundColor: '#D1D1D1',
    },
    editingBanner: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
        borderTopLeftRadius: Radius.md, borderTopRightRadius: Radius.md,
        borderLeftWidth: 4,
        marginBottom: Spacing.xs,
        marginHorizontal: Spacing.sm,
    },
    editingBannerContent: {
        flexDirection: 'row', alignItems: 'center', flex: 1,
    },
});
