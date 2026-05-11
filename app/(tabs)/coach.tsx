import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../components/atoms/AppText';
import { useAppStore } from '../../store/useAppStore';
import TutorScreen from './tutor';

export default function CoachScreen() {
    // Safely type cast to bypass any typescript errors on user object structure
    const user = useAppStore(s => (s as any).user);
    const username = user?.name || 'Ethan';
    const [isChatOpen, setIsChatOpen] = useState(false);

    // Focus Timer State
    const [isFocusActive, setIsFocusActive] = useState(false);
    const [focusSeconds, setFocusSeconds] = useState(25 * 60);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isFocusActive && focusSeconds > 0) {
            interval = setInterval(() => {
                setFocusSeconds(prev => prev - 1);
            }, 1000);
            
            // Start pulsing animation
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.15,
                        duration: 800,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 800,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    })
                ])
            ).start();
        } else if (focusSeconds === 0 || !isFocusActive) {
            setIsFocusActive(false);
            // Stop and reset animation
            pulseAnim.stopAnimation();
            Animated.spring(pulseAnim, {
                toValue: 1,
                useNativeDriver: true,
            }).start();
        }
        return () => clearInterval(interval);
    }, [isFocusActive, focusSeconds, pulseAnim]);

    const formatTime = (totalSeconds: number) => {
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const toggleFocus = () => {
        if (focusSeconds === 0) setFocusSeconds(25 * 60); // reset if finished
        setIsFocusActive(!isFocusActive);
    };

    const resetFocus = () => {
        setIsFocusActive(false);
        setFocusSeconds(25 * 60);
    };

    return (
        <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: '#F8F9FA' }]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                
                {/* 1. Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Image source={require('../../assets/botchat.png')} style={styles.avatar} />
                        <View style={styles.headerTextCol}>
                            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                <AppText style={styles.headerTitle}>Hello, {username}! </AppText>
                                <AppText style={{fontSize: 20}}>👋</AppText>
                            </View>
                            <AppText style={styles.headerSubtitle}>Your AI Learning Coach</AppText>
                        </View>
                    </View>
                    <View style={styles.headerRight}>
                        <TouchableOpacity style={styles.iconBtn}>
                            <Ionicons name="notifications-outline" size={24} color="#1E1B4B" />
                            <View style={styles.notificationDot} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 2. Hero Banner */}
                <View style={styles.heroCard}>
                    <View style={styles.heroContent}>
                        <AppText style={styles.heroMainText}>
                            Hi {username}! I'm here to help you learn smarter every day.
                        </AppText>
                    </View>
                    <Image source={require('../../assets/botwave.png')} style={styles.heroImage} resizeMode="contain" />
                    {/* Tiny sparkle accent on the banner */}
                    <View style={styles.tinySparkle}><Ionicons name="sparkles" size={10} color="#C4B5FD" /></View>
                </View>

                {/* 3. Continue Learning */}
                <View style={styles.continueCard}>
                    <View style={styles.continueHeader}>
                        <View style={styles.continueIconWrap}>
                            <Ionicons name="book-outline" size={24} color="#4F46E5" />
                        </View>
                        <View style={styles.continueTextCol}>
                            <AppText style={styles.continueLabel}>Continue Learning</AppText>
                            <AppText style={styles.continueTitle}>API Development</AppText>
                        </View>
                    </View>
                    
                    <View style={styles.continueBottom}>
                        <View style={styles.progressCol}>
                            <AppText style={styles.progressText}>
                                <AppText style={{fontWeight: 'bold'}}>65%</AppText> completed
                            </AppText>
                            <View style={styles.progressBar}>
                                <View style={[styles.progressFill, {width: '65%'}]} />
                            </View>
                        </View>
                        <TouchableOpacity style={styles.resumeBtn}>
                            <AppText style={styles.resumeBtnText}>Resume</AppText>
                            <Ionicons name="chevron-forward" size={16} color="#FFF" style={{marginLeft: 4}} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 4. Today's Plan */}
                <View style={styles.sectionHeader}>
                    <AppText style={styles.sectionTitle}>Today's Plan</AppText>
                </View>
                <View style={styles.planList}>
                    <TouchableOpacity style={styles.planItem}>
                        <View style={styles.planIconActive}>
                            <Ionicons name="checkmark" size={14} color="#FFF" />
                        </View>
                        <AppText style={styles.planTextActive}>Complete API Authentication</AppText>
                        <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.planItem}>
                        <View style={styles.planIconInactive} />
                        <AppText style={styles.planTextInactive}>Practice Quiz</AppText>
                        <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.planItem}>
                        <View style={styles.planIconInactive} />
                        <AppText style={styles.planTextInactive}>Review Notes</AppText>
                        <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>

                {/* 5. Focus Time */}
                <View style={styles.focusCard}>
                    <View style={styles.focusLeft}>
                        <Animated.View style={[styles.focusIconWrap, { transform: [{ scale: pulseAnim }] }]}>
                            <Ionicons name="time-outline" size={24} color="#4F46E5" />
                        </Animated.View>
                        <View style={styles.focusTextCol}>
                            <AppText style={styles.focusLabel}>Focus Time</AppText>
                            <AppText style={styles.focusTimer}>{formatTime(focusSeconds)}</AppText>
                            <AppText style={styles.focusMotivation}>Stay focused. You got this! <AppText style={{fontSize: 12}}>💪</AppText></AppText>
                        </View>
                    </View>
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                        {(isFocusActive || focusSeconds !== 25 * 60) && (
                            <TouchableOpacity 
                                style={styles.resetBtn} 
                                onPress={resetFocus}
                            >
                                <Ionicons name="refresh" size={18} color="#6B7280" />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity 
                            style={[styles.startFocusBtn, isFocusActive && {backgroundColor: '#EF4444'}]} 
                            onPress={toggleFocus}
                        >
                            <Ionicons name={isFocusActive ? "pause" : "play"} size={16} color="#FFF" style={{marginRight: 4}} />
                            <AppText style={styles.startFocusText}>{isFocusActive ? "Pause" : "Start Focus"}</AppText>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 6. Learning Roadmap */}
                <View style={styles.sectionHeader}>
                    <AppText style={styles.sectionTitle}>Learning Roadmap</AppText>
                </View>
                <View style={styles.roadmapContainer}>
                    <View style={styles.stepperWrap}>
                        {/* Stepper items */}
                        <View style={styles.stepperItem}>
                            <View style={[styles.stepCircle, styles.stepCompleted]}>
                                <Ionicons name="checkmark" size={14} color="#10B981" />
                            </View>
                            <AppText style={styles.stepTitle}>SQL Basics</AppText>
                            <AppText style={styles.stepStatus}>Completed</AppText>
                        </View>
                        
                        <View style={styles.stepperItem}>
                            <View style={[styles.stepCircle, styles.stepCompleted]}>
                                <Ionicons name="checkmark" size={14} color="#10B981" />
                            </View>
                            <AppText style={styles.stepTitle}>DBMS</AppText>
                            <AppText style={styles.stepStatus}>Completed</AppText>
                        </View>
                        
                        <View style={styles.stepperItem}>
                            <View style={[styles.stepCircle, styles.stepActive]}>
                                <View style={styles.activeDot} />
                            </View>
                            <AppText style={[styles.stepTitle, {fontWeight: 'bold', color: '#1E1B4B'}]}>API</AppText>
                            <AppText style={[styles.stepTitle, {fontWeight: 'bold', color: '#1E1B4B'}]}>Development</AppText>
                            <AppText style={styles.stepStatus}>In Progress</AppText>
                        </View>
                        
                        <View style={styles.stepperItem}>
                            <View style={[styles.stepCircle, styles.stepLocked]}>
                                <Ionicons name="lock-closed-outline" size={14} color="#1E1B4B" />
                            </View>
                            <AppText style={styles.stepTitle}>Mock</AppText>
                            <AppText style={styles.stepTitle}>Interview</AppText>
                            <AppText style={styles.stepStatus}>Locked</AppText>
                        </View>

                        {/* Background Lines */}
                        <View style={[styles.stepLine, {left: '12%', width: '25%', backgroundColor: '#10B981'}]} />
                        <View style={[styles.stepLine, {left: '37%', width: '25%', backgroundColor: '#C4B5FD'}]} />
                        <View style={[styles.stepLine, {left: '62%', width: '25%', backgroundColor: '#E5E7EB'}]} />
                    </View>
                </View>

                {/* 7. Ask your AI Coach Banner */}
                <TouchableOpacity style={styles.coachBanner} onPress={() => setIsChatOpen(true)}>
                    <View style={styles.coachBannerLeft}>
                        <Ionicons name="sparkles" size={24} color="#4F46E5" style={{marginRight: 12}} />
                        <View>
                            <AppText style={styles.coachBannerTitle}>Ask your AI Coach</AppText>
                            <AppText style={styles.coachBannerSub}>Get help, explanations, or guidance.</AppText>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#4F46E5" />
                </TouchableOpacity>

                <View style={{height: 40}} />
            </ScrollView>

            {/* Modal Tutor Overlay */}
            <Modal visible={isChatOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setIsChatOpen(false)}>
                <View style={{ flex: 1, backgroundColor: '#F4EFF2' }}>
                    <TutorScreen isEmbedded={true} onClose={() => setIsChatOpen(false)} />
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingTop: 16 },
    
    // Header
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    headerLeft: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E5E7EB' },
    headerTextCol: { marginLeft: 12 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E1B4B' },
    headerSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
    headerRight: { flexDirection: 'row', alignItems: 'center' },
    iconBtn: { padding: 4, position: 'relative' },
    notificationDot: { position: 'absolute', top: 4, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: '#4F46E5', borderWidth: 1, borderColor: '#F8F9FA' },
    
    // Hero Banner
    heroCard: { backgroundColor: '#F3F4F8', borderRadius: 16, padding: 20, flexDirection: 'row', marginBottom: 24, overflow: 'visible', position: 'relative', minHeight: 110, alignItems: 'center' },
    heroContent: { flex: 1, zIndex: 1, maxWidth: '65%' },
    heroMainText: { fontSize: 14, color: '#1E1B4B', lineHeight: 20, fontWeight: '500' },
    heroImage: { width: 120, height: 130, position: 'absolute', right: 0, bottom: -10, zIndex: 0 },
    tinySparkle: { position: 'absolute', left: '60%', top: '40%' },
    
    // Continue Learning
    continueCard: { marginBottom: 24 },
    continueHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    continueIconWrap: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#EBEBFE', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    continueTextCol: { flex: 1 },
    continueLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
    continueTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E1B4B' },
    continueBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    progressCol: { flex: 1, marginRight: 16 },
    progressText: { fontSize: 13, color: '#1E1B4B', marginBottom: 8 },
    progressBar: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4 },
    progressFill: { height: 8, backgroundColor: '#4F46E5', borderRadius: 4 },
    resumeBtn: { backgroundColor: '#4F46E5', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
    resumeBtnText: { color: '#FFF', fontSize: 14, fontWeight: '500' },
    
    // Section Header
    sectionHeader: { marginBottom: 16 },
    sectionTitle: { fontSize: 15, color: '#1E1B4B' },
    
    // Plan List
    planList: { marginBottom: 24 },
    planItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    planIconActive: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    planTextActive: { flex: 1, fontSize: 14, color: '#1E1B4B', fontWeight: '500' },
    planIconInactive: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: '#D1D5DB', marginRight: 12 },
    planTextInactive: { flex: 1, fontSize: 14, color: '#6B7280' },
    
    // Focus Time
    focusCard: { backgroundColor: '#F8F9FA', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, marginBottom: 32 },
    focusLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    focusIconWrap: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#EBEBFE', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    focusTextCol: { },
    focusLabel: { fontSize: 12, color: '#6B7280', marginBottom: 2 },
    focusTimer: { fontSize: 24, fontWeight: 'bold', color: '#1E1B4B', marginBottom: 2 },
    focusMotivation: { fontSize: 11, color: '#6B7280' },
    startFocusBtn: { backgroundColor: '#4F46E5', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
    startFocusText: { color: '#FFF', fontSize: 13, fontWeight: '500' },
    resetBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
    
    // Learning Roadmap
    roadmapContainer: { marginBottom: 32 },
    stepperWrap: { flexDirection: 'row', justifyContent: 'space-between', position: 'relative', marginTop: 12 },
    stepLine: { position: 'absolute', height: 2, top: 11, zIndex: 0 },
    stepperItem: { alignItems: 'center', zIndex: 1, width: '25%' },
    stepCircle: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8, backgroundColor: '#FFF' },
    stepCompleted: { borderWidth: 1.5, borderColor: '#10B981' },
    stepActive: { borderWidth: 1.5, borderColor: '#C4B5FD' },
    activeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4F46E5' },
    stepLocked: { borderWidth: 1.5, borderColor: '#D1D5DB' },
    stepTitle: { fontSize: 11, color: '#6B7280', textAlign: 'center' },
    stepStatus: { fontSize: 10, color: '#9CA3AF', marginTop: 4 },
    
    // Ask your AI Coach
    coachBanner: { backgroundColor: '#EBEBFE', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    coachBannerLeft: { flexDirection: 'row', alignItems: 'center' },
    coachBannerTitle: { fontSize: 14, fontWeight: '600', color: '#1E1B4B', marginBottom: 2 },
    coachBannerSub: { fontSize: 12, color: '#4F46E5' },
});
