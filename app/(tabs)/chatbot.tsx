import React, { useState, useEffect, useRef } from 'react';
import {
    View, StyleSheet, ScrollView, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, Text, SafeAreaView, Animated, Dimensions, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MessageBubble } from '../../components/molecules/MessageBubble';
import { TypingIndicator } from '../../components/molecules/TypingIndicator';
import { useChatbotStore } from '../../store/useChatbotStore';
import { useAppStore } from '../../store/useAppStore';

export default function ChatbotScreen() {
    const {
        sessions, loadSessions, removeSession,
        activeSessionId, activeSessionTitle, startNewSession, restoreSession, clearActiveChat,
        messages, isTyping, sendMessage, setMessages, regenerateMessage,
        editingMessageId, setEditingMessageId, editMessage
    } = useChatbotStore();

    // Safely pull user from store if available
    const user = useAppStore(s => (s as any).user);
    const username = user?.name || 'there';

    const [input, setInput] = useState('');
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);

    const { width } = Dimensions.get('window');
    const slideAnim = useRef(new Animated.Value(width)).current;

    useEffect(() => {
        loadSessions();
    }, []);

    useEffect(() => {
        Animated.timing(slideAnim, {
            toValue: isHistoryOpen ? 0 : width,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, [isHistoryOpen]);

    useEffect(() => {
        if (editingMessageId) {
            const msg = messages.find(m => m.id === editingMessageId);
            if (msg) setInput(msg.text || msg.content || '');
        } else {
            setInput('');
        }
    }, [editingMessageId, messages]);

    const handleSend = async (textToProcess?: string) => {
        const text = textToProcess || input.trim();
        if (!text || isTyping) return;
        
        // If we have no active session and user types, we should probably start one first
        // But startNewSession adds an intro message.
        // Actually, let's just make them tap "Start New Conversation" if !activeSessionId.
        if (!activeSessionId) {
            await startNewSession();
            // After starting, send the message.
            setTimeout(() => {
                sendMessage(text);
            }, 500);
        } else {
            if (editingMessageId) {
                setInput('');
                setEditingMessageId(null);
                await editMessage(editingMessageId, text);
            } else {
                setInput('');
                await sendMessage(text);
            }
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

    return (
        <SafeAreaView style={styles.root}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* HEADER */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.menuBtn} onPress={clearActiveChat}>
                        <Ionicons name="chatbubble-outline" size={24} color="#1E1B4B" />
                    </TouchableOpacity>
                    
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>Ask Lumi</Text>
                        <Text style={styles.headerModel}>AI Model ✨</Text>
                    </View>

                    <TouchableOpacity style={styles.newChatBtn} onPress={() => setIsHistoryOpen(true)}>
                        <Ionicons name="menu" size={26} color="#1E1B4B" />
                    </TouchableOpacity>
                </View>

                {/* SCROLLABLE CHAT AREA */}
                <ScrollView contentContainerStyle={[styles.scrollContent, (!activeSessionId || messages.length === 0) && styles.scrollContentEmpty]} showsVerticalScrollIndicator={false}>
                    {/* WELCOME CARD */}
                    {(!activeSessionId || messages.length === 0) && (
                        <View style={styles.centeredWelcome}>
                            <View style={styles.avatarLargePlaceholder}>
                                <Ionicons name="sparkles" size={36} color="#4F46E5" />
                            </View>
                            <Text style={styles.chatGptTitle}>How can I help you today, {username}?</Text>
                            
                            <View style={styles.suggestionGrid}>
                                <TouchableOpacity style={styles.suggestionBox} onPress={() => { startNewSession().then(() => setTimeout(() => sendMessage('Explain quantum computing in simple terms'), 500)) }}>
                                    <Text style={styles.suggestionTitle}>Explain quantum computing</Text>
                                    <Text style={styles.suggestionText}>in simple terms</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.suggestionBox} onPress={() => { startNewSession().then(() => setTimeout(() => sendMessage('Help me write a Python script for automation'), 500)) }}>
                                    <Text style={styles.suggestionTitle}>Write a Python script</Text>
                                    <Text style={styles.suggestionText}>for daily automation tasks</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* DYNAMIC CHAT AREA */}
                    {activeSessionId && messages.length > 0 && (
                        <View style={styles.dateSeparator}>
                            <View style={styles.line} />
                            <Text style={styles.dateText}>Today</Text>
                            <View style={styles.line} />
                        </View>
                    )}

                    {activeSessionId && messages.map(m => (
                        <MessageBubble 
                            key={m.id} 
                            message={m} 
                            onLike={handleLike}
                            onDislike={handleDislike}
                            onRetry={handleRetry}
                            onRegenerate={(id) => regenerateMessage(id)}
                            onEdit={(id) => setEditingMessageId(id)}
                        />
                    ))}
                    {isTyping && <TypingIndicator />}
                </ScrollView>

                {/* INPUT BAR */}
                <View style={styles.inputBarContainer}>
                    {editingMessageId && (
                        <View style={styles.editingBanner}>
                            <View style={styles.editingBannerContent}>
                                <Ionicons name="pencil" size={16} color="#3C2CDA" />
                                <View style={{ marginLeft: 8, flex: 1 }}>
                                    <Text style={{ color: '#3C2CDA', fontSize: 12, fontWeight: 'bold' }}>Editing Message</Text>
                                    <Text numberOfLines={1} style={{ color: '#6B7280', fontSize: 12 }}>
                                        {messages.find(m => m.id === editingMessageId)?.text || messages.find(m => m.id === editingMessageId)?.content}
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => setEditingMessageId(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <Ionicons name="close" size={20} color="#6B7280" />
                            </TouchableOpacity>
                        </View>
                    )}
                    <View style={styles.inputWrapper}>
                        <TouchableOpacity 
                            style={styles.addBtn}
                            onPress={() => setIsAttachMenuOpen(!isAttachMenuOpen)}
                        >
                            <Ionicons name={isAttachMenuOpen ? "close" : "add"} size={28} color="#6B7280" />
                        </TouchableOpacity>

                        {isAttachMenuOpen && (
                            <View style={styles.attachMenu}>
                                <TouchableOpacity style={styles.attachIconBtn}>
                                    <Ionicons name="image-outline" size={22} color="#4F46E5" />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.attachIconBtn}>
                                    <Ionicons name="mic-outline" size={22} color="#4F46E5" />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.attachIconBtn}>
                                    <Ionicons name="document-outline" size={22} color="#4F46E5" />
                                </TouchableOpacity>
                            </View>
                        )}

                        <TextInput
                            style={styles.textInput}
                            placeholder="Message Ask Lumi..."
                            placeholderTextColor="#9CA3AF"
                            value={input}
                            onChangeText={setInput}
                            onSubmitEditing={() => handleSend()}
                            multiline
                            maxLength={2000}
                        />
                        <View style={styles.inputActions}>
                            <TouchableOpacity 
                                style={[styles.sendBtn, input.trim() ? styles.sendBtnActive : styles.sendBtnInactive]} 
                                onPress={() => handleSend()}
                                disabled={!input.trim() && !isTyping}
                            >
                                <Ionicons name="arrow-up" size={18} color={input.trim() ? "#FFFFFF" : "#9CA3AF"} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>

            {/* OVERLAY for side menu */}
            {isHistoryOpen && (
                <TouchableOpacity 
                    style={styles.overlay} 
                    activeOpacity={1} 
                    onPress={() => setIsHistoryOpen(false)} 
                />
            )}
            
            {/* SIDE MENU */}
            <Animated.View style={[styles.sideMenu, { transform: [{ translateX: slideAnim }] }]}>
                <View style={styles.sideMenuHeader}>
                    <Text style={styles.sideMenuTitle}>Recent Activity</Text>
                    <TouchableOpacity onPress={() => setIsHistoryOpen(false)}>
                        <Ionicons name="close" size={24} color="#1E1B4B" />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.sideMenuContent}>
                    {sessions.length === 0 ? (
                        <Text style={styles.emptyHistory}>No recent activity.</Text>
                    ) : (
                        sessions.map(s => (
                            <View key={s.session_id} style={styles.historyItemCardWrapper}>
                                <TouchableOpacity 
                                    style={styles.historyItemCard} 
                                    onPress={() => { 
                                        restoreSession(s); 
                                        setIsHistoryOpen(false); 
                                    }}
                                >
                                    <Text style={styles.historyCardTitle} numberOfLines={1}>{s.title || 'New Session'}</Text>
                                    <View style={styles.historyCardFooter}>
                                        <Ionicons name="chatbubbles-outline" size={12} color="#6B7280" />
                                        <Text style={styles.historyCardFooterText}>{s.messageCount || 0}</Text>
                                        <Text style={styles.historyCardFooterText}> • </Text>
                                        <Ionicons name="calendar-outline" size={12} color="#6B7280" />
                                        <Text style={styles.historyCardFooterText}>{new Date(s.createdAt).toLocaleDateString()}</Text>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.deleteBtn} onPress={() => removeSession(s.session_id)}>
                                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        ))
                    )}
                </ScrollView>
            </Animated.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#F4EFF2',
    },
    flex: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 12,
        backgroundColor: '#F4EFF2',
    },
    menuBtn: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1E1B4B',
    },
    headerModel: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    newChatBtn: {
        padding: 8,
        marginRight: -8,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 24,
        flexGrow: 1,
    },
    scrollContentEmpty: {
        justifyContent: 'center',
    },
    centeredWelcome: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    avatarLargePlaceholder: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#EEF2FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    chatGptTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1E1B4B',
        textAlign: 'center',
        marginBottom: 40,
        lineHeight: 32,
    },
    suggestionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 12,
    },
    suggestionBox: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 16,
        padding: 16,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    suggestionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E1B4B',
        marginBottom: 4,
    },
    suggestionText: {
        fontSize: 13,
        color: '#6B7280',
    },
    dateSeparator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E7EB',
    },
    dateText: {
        marginHorizontal: 12,
        fontSize: 12,
        color: '#6B7280',
    },
    inputBarContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#F4EFF2',
    },
    editingBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#F4EFF2',
        borderLeftWidth: 4,
        borderLeftColor: '#3C2CDA',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        marginBottom: 8,
    },
    editingBannerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F8F9',
        borderRadius: 30,
        borderWidth: 1,
        borderColor: '#CBD0E5',
        paddingLeft: 12,
        paddingRight: 8,
        minHeight: 52,
        shadowColor: '#535983',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    addBtn: {
        padding: 4,
        marginRight: 4,
    },
    attachMenu: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F4EFF2',
        borderRadius: 20,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginRight: 8,
        gap: 8,
    },
    attachIconBtn: {
        padding: 4,
    },
    textInput: {
        flex: 1,
        fontSize: 15,
        color: '#1E1B4B',
        maxHeight: 120,
        paddingTop: Platform.OS === 'ios' ? 8 : 4,
        paddingBottom: Platform.OS === 'ios' ? 8 : 4,
        paddingHorizontal: 8,
    },
    inputActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sendBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 4,
        marginBottom: 2,
    },
    sendBtnActive: {
        backgroundColor: '#3C2CDA',
    },
    sendBtnInactive: {
        backgroundColor: '#F3F4F6',
    },
    // SIDE MENU STYLES
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
        zIndex: 10,
    },
    sideMenu: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        right: 0,
        width: '80%',
        maxWidth: 320,
        backgroundColor: '#FFFFFF',
        zIndex: 20,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: -2, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    sideMenuHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        backgroundColor: '#F9FAFB',
    },
    sideMenuTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1E1B4B',
    },
    sideMenuContent: {
        padding: 16,
    },
    emptyHistory: {
        color: '#9CA3AF',
        textAlign: 'center',
        marginTop: 20,
    },
    historyItemCardWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        marginBottom: 12,
    },
    historyItemCard: {
        flex: 1,
        padding: 14,
    },
    historyCardTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1E1B4B',
        marginBottom: 8,
    },
    historyCardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    historyCardFooterText: {
        fontSize: 11,
        color: '#6B7280',
        marginLeft: 4,
    },
    deleteBtn: {
        padding: 14,
        borderLeftWidth: 1,
        borderLeftColor: '#F3F4F6',
    },
});
