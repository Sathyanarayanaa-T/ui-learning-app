import React, { useState, useEffect, useRef } from 'react';
import {
    View, StyleSheet, ScrollView, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, Text, SafeAreaView, Animated, Dimensions, ActivityIndicator
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ChatBubble } from '../../components/molecules/ChatBubble';
import { TypingIndicator } from '../../components/molecules/TypingIndicator';
import { useTutorStore } from '../../store/useTutorStore';
import { useAppStore } from '../../store/useAppStore';

export default function TutorScreen() {
    const { 
        startNewSession, sendMessage, messages, sessions, loadSessions, restoreSession,
        isTyping, editingMessageId, setEditingMessageId, editMessage,
        activeDocumentId, activeDocumentName, isUploading, uploadFile, clearActiveDocument
    } = useTutorStore();
    // Safely pull user from store if available
    const user = useAppStore(s => (s as any).user);
    const username = user?.name || 'there';

    const [input, setInput] = useState('');
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState('All');
    const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
    
    const handleAttach = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
            });
            if (result.canceled === false) {
                const doc = result.assets[0];
                await uploadFile(doc);
                setIsAttachMenuOpen(false);
            }
        } catch (err) {
            console.error("Document pick error", err);
        }
    };
    
    const FILTERS = ['All', 'Resolve', 'Mastery', 'Navigate'];
    const MODE_MAPPING: Record<string, string> = {
        'Resolve': 'normal',
        'Mastery': 'teaching',
        'Navigate': 'guiding'
    };

    const filteredSessions = sessions.filter(s => {
        if (activeFilter === 'All') return true;
        const targetMode = MODE_MAPPING[activeFilter];
        return (s.mode || 'normal') === targetMode;
    });

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
            if (msg) setInput(msg.text);
        } else {
            setInput('');
        }
    }, [editingMessageId, messages]);

    const handleSend = async () => {
        const text = input.trim();
        if (!text || isTyping) return;
        
        if (editingMessageId) {
            setInput('');
            setEditingMessageId(null);
            await editMessage(editingMessageId, text);
        } else {
            setInput('');
            await sendMessage(text);
        }
    };

    const modes = [
        { label: "Resolve", value: "normal" as const },
        { label: "Mastery", value: "teaching" as const },
        { label: "Navigate", value: "guiding" as const }
    ];

    return (
        <SafeAreaView style={styles.root}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* HEADER */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <View style={styles.avatarPlaceholder}>
                            <Ionicons name="hardware-chip" size={24} color="#4F46E5" />
                        </View>
                        <View style={styles.headerTextStack}>
                            <Text style={styles.greetingLabel}>hello</Text>
                            <Text style={styles.botName}>Ask Lumi Coach</Text>
                            <Text style={styles.botSubtitle}>Your AI learning companion ✨</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.historyBtn} onPress={() => setIsHistoryOpen(true)}>
                        <Ionicons name="time-outline" size={14} color="#6B7280" />
                        <Text style={styles.historyBtnText}>History</Text>
                    </TouchableOpacity>
                </View>

                {/* SCROLLABLE CHAT AREA */}
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* WELCOME CARD */}
                    <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.welcomeCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                        <View style={styles.welcomeContent}>
                            <Text style={styles.welcomeTitle}>Hi {username}! 👋</Text>
                            <Text style={styles.welcomeSubtitle}>How can I help you learn today?</Text>
                            <View style={styles.quickActionChips}>
                                {modes.map(m => (
                                    <TouchableOpacity key={m.label} style={styles.chip} onPress={() => startNewSession(m.value)}>
                                        <Text style={styles.chipText}>{m.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                        <View style={styles.robotIllustration}>
                            <Ionicons name="planet-outline" size={80} color="rgba(255,255,255,0.15)" />
                        </View>
                    </LinearGradient>

                    {/* DYNAMIC CHAT AREA */}
                    {messages.length > 0 && (
                        <View style={styles.dateSeparator}>
                            <View style={styles.line} />
                            <Text style={styles.dateText}>Today</Text>
                            <View style={styles.line} />
                        </View>
                    )}

                    {messages.map(m => (
                        <ChatBubble key={m.id} message={m} />
                    ))}
                    {isTyping && <TypingIndicator />}

                </ScrollView>

                {/* INPUT BAR */}
                <View style={styles.inputBarContainer}>
                    {activeDocumentId && (
                        <View style={styles.activeDocBadge}>
                            <Ionicons name="document-text" size={14} color="#4F46E5" />
                            <Text style={styles.activeDocName} numberOfLines={1}>{activeDocumentName}</Text>
                            <TouchableOpacity onPress={clearActiveDocument}>
                                <Ionicons name="close-circle" size={16} color="#6B7280" />
                            </TouchableOpacity>
                        </View>
                    )}
                    {editingMessageId && (
                        <View style={styles.editingBanner}>
                            <View style={styles.editingBannerContent}>
                                <Ionicons name="pencil" size={16} color="#4F46E5" />
                                <View style={{ marginLeft: 8, flex: 1 }}>
                                    <Text style={{ color: '#4F46E5', fontSize: 12, fontWeight: 'bold' }}>Editing Message</Text>
                                    <Text numberOfLines={1} style={{ color: '#6B7280', fontSize: 12 }}>
                                        {messages.find(m => m.id === editingMessageId)?.text}
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
                            <Ionicons name={isAttachMenuOpen ? "close" : "add"} size={26} color="#9CA3AF" />
                        </TouchableOpacity>

                        {isAttachMenuOpen && (
                            <View style={styles.attachMenu}>
                                <TouchableOpacity style={styles.attachIconBtn}>
                                    <Ionicons name="image-outline" size={22} color="#4F46E5" />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.attachIconBtn}>
                                    <Ionicons name="mic-outline" size={22} color="#4F46E5" />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.attachIconBtn} onPress={handleAttach} disabled={isUploading}>
                                    {isUploading ? (
                                        <ActivityIndicator size="small" color="#4F46E5" />
                                    ) : (
                                        <Ionicons name="document-outline" size={22} color="#4F46E5" />
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}

                        <TextInput
                            style={styles.textInput}
                            placeholder="Ask anything..."
                            placeholderTextColor="#9CA3AF"
                            value={input}
                            onChangeText={setInput}
                            onSubmitEditing={handleSend}
                        />
                        <View style={styles.inputActions}>
                            <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
                                <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
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

                <View style={styles.filterScrollContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollContent}>
                        {FILTERS.map(filter => {
                            const isActive = activeFilter === filter;
                            return (
                                <TouchableOpacity 
                                    key={filter} 
                                    style={[styles.filterChipBtn, isActive && styles.filterChipBtnActive]}
                                    onPress={() => setActiveFilter(filter)}
                                >
                                    <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>{filter}</Text>
                                </TouchableOpacity>
                            )
                        })}
                    </ScrollView>
                </View>

                <ScrollView contentContainerStyle={styles.sideMenuContent}>
                    {filteredSessions.length === 0 ? (
                        <Text style={styles.emptyHistory}>No recent activity.</Text>
                    ) : (
                        filteredSessions.map(s => (
                            <TouchableOpacity 
                                key={s.session_id} 
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
        backgroundColor: '#F5F6FA',
    },
    flex: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 16,
        backgroundColor: '#F5F6FA',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarPlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#EEF2FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    headerTextStack: {
        justifyContent: 'center',
    },
    greetingLabel: {
        fontSize: 12,
        color: '#6B7280',
    },
    botName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1E1B4B',
        marginTop: 2,
    },
    botSubtitle: {
        fontSize: 12,
        color: '#6B7280',
        fontStyle: 'italic',
        marginTop: 1,
    },
    historyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
    },
    historyBtnText: {
        fontSize: 12,
        color: '#6B7280',
        marginLeft: 4,
        fontWeight: '500',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 24,
    },
    welcomeCard: {
        width: '100%',
        borderRadius: 20,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    welcomeContent: {
        flex: 1,
    },
    welcomeTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    welcomeSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 16,
    },
    quickActionChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        backgroundColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    chipText: {
        color: '#FFFFFF',
        fontSize: 12,
    },
    robotIllustration: {
        marginLeft: 16,
        marginTop: 8,
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
        padding: 16,
        backgroundColor: '#F5F6FA',
    },
    editingBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#EEF2FF',
        borderLeftWidth: 4,
        borderLeftColor: '#4F46E5',
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
        backgroundColor: '#FFFFFF',
        borderRadius: 30,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingLeft: 12,
        paddingRight: 8,
        height: 56,
    },
    addBtn: {
        padding: 4,
        marginRight: 4,
    },
    attachMenu: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF2FF',
        borderRadius: 20,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginRight: 8,
        gap: 8,
    },
    attachIconBtn: {
        padding: 4,
    },
    activeDocBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#EEF2FF',
        marginBottom: 8,
        gap: 6,
    },
    activeDocName: {
        fontSize: 12,
        color: '#4F46E5',
        fontWeight: '600',
        maxWidth: 200,
    },
    textInput: {
        flex: 1,
        fontSize: 14,
        color: '#1E1B4B',
    },
    inputActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    iconBtn: {
        padding: 4,
    },
    sendBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#4F46E5',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 4,
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
    filterScrollContainer: {
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
    },
    filterScrollContent: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
    },
    filterChipBtn: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    filterChipBtnActive: {
        backgroundColor: '#EEF2FF',
        borderColor: '#4F46E5',
    },
    filterChipText: {
        fontSize: 12,
        color: '#4B5563',
        fontWeight: '500',
    },
    filterChipTextActive: {
        color: '#4F46E5',
        fontWeight: 'bold',
    },
    sideMenuContent: {
        padding: 16,
    },
    emptyHistory: {
        color: '#9CA3AF',
        textAlign: 'center',
        marginTop: 20,
    },
    historyItemCard: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
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
});
