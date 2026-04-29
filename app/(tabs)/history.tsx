import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../components/atoms/AppText';
import { useColors } from '../../hooks/useColors';
import { useAppStore } from '../../store/useAppStore';
import { LinearGradient } from 'expo-linear-gradient';
import TutorScreen from './tutor';

const { width } = Dimensions.get('window');

export default function HistoryScreen() {
    const colors = useColors();
    // Safely type cast to bypass any typescript errors on user object structure
    const user = useAppStore(s => (s as any).user);
    const username = user?.name || 'Ethan';
    const [isChatOpen, setIsChatOpen] = useState(false);

    return (
        <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: '#F9FAFB' }]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                
                {/* 1. Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Image source={require('../../assets/botchat.png')} style={styles.avatar} />
                        <View style={styles.headerTextCol}>
                            <AppText style={styles.headerTitle}>Hello {username} 👋</AppText>
                            <AppText style={styles.headerSubtitle}>Your Personal Learning Coach</AppText>
                        </View>
                    </View>
                    <View style={styles.headerRight}>
                        <TouchableOpacity style={styles.iconBtn}>
                            <Ionicons name="notifications-outline" size={24} color="#1E1B4B" />
                            <View style={styles.notificationDot} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconBtn}>
                            <Ionicons name="calendar-outline" size={24} color="#1E1B4B" />
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.streakWrapper}>
                    <View style={styles.streakBadge}>
                        <AppText style={styles.streakText}>🔥 7 Day Streak</AppText>
                    </View>
                </View>

                {/* 2. Hero Card */}
                <LinearGradient colors={['#E6E9FF', '#D3DAFF']} style={styles.heroCard}>
                    <View style={styles.heroContent}>
                        <AppText style={styles.heroTitle}>Hi {username}! 👋</AppText>
                        <AppText style={styles.heroMainText}>You're <AppText style={{color: '#3C2CDA', fontWeight: 'bold'}}>72%</AppText> done with{"\n"}your weekly goal</AppText>
                        <AppText style={styles.heroSubText}>Complete <AppText style={{fontWeight: 'bold', color: '#3C2CDA'}}>2</AppText> more modules today{"\n"}to keep your streak alive!</AppText>
                        
                        <View style={styles.heroButtons}>
                            <TouchableOpacity style={styles.primaryBtn}>
                                <AppText style={styles.primaryBtnText}>Start Learning</AppText>
                                <Ionicons name="chevron-forward" size={16} color="#FFF" style={{marginLeft: 4}} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.secondaryBtn}>
                                <AppText style={styles.secondaryBtnText}>View Roadmap</AppText>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <Image source={require('../../assets/botwave.png')} style={styles.heroImage} resizeMode="contain" />
                </LinearGradient>

                {/* 3. Your Learning Roadmap */}
                <View style={styles.sectionHeader}>
                    <AppText style={styles.sectionTitle}>Your Learning Roadmap</AppText>
                    <TouchableOpacity><AppText style={styles.seeAllText}>View full roadmap ></AppText></TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.roadmapScroll}>
                    <View style={styles.roadmapCard}>
                        <View style={[styles.iconCircle, {backgroundColor: '#10B981'}]}><Ionicons name="checkmark" size={16} color="#FFF"/></View>
                        <AppText style={styles.roadmapCardTitle}>SQL Basics</AppText>
                        <AppText style={styles.roadmapCardStatusGreen}>Completed</AppText>
                        <View style={styles.timeRow}><Ionicons name="time-outline" size={12} color="#6B7280" /><AppText style={styles.timeText}>2h 30m</AppText></View>
                    </View>
                    <View style={styles.roadmapConnector} />
                    <View style={styles.roadmapCard}>
                        <View style={[styles.iconCircle, {backgroundColor: '#10B981'}]}><Ionicons name="checkmark" size={16} color="#FFF"/></View>
                        <AppText style={styles.roadmapCardTitle}>DBMS</AppText>
                        <AppText style={styles.roadmapCardStatusGreen}>Completed</AppText>
                        <View style={styles.timeRow}><Ionicons name="time-outline" size={12} color="#6B7280" /><AppText style={styles.timeText}>3h 45m</AppText></View>
                    </View>
                    <View style={styles.roadmapConnector} />
                    <View style={[styles.roadmapCard, styles.roadmapCardActive]}>
                        <View style={[styles.iconCircle, {backgroundColor: '#EEF2FF'}]}><Ionicons name="radio-button-on" size={16} color="#3C2CDA"/></View>
                        <AppText style={styles.roadmapCardTitle}>API Development</AppText>
                        <View style={styles.progressRow}>
                            <View style={styles.progressBar}><View style={[styles.progressFill, {width: '65%'}]} /></View>
                            <AppText style={styles.progressText}>65%</AppText>
                        </View>
                        <View style={styles.timeRow}><Ionicons name="time-outline" size={12} color="#6B7280" /><AppText style={styles.timeText}>4h 20m</AppText></View>
                    </View>
                    <View style={styles.roadmapConnector} />
                    <View style={styles.roadmapCard}>
                        <View style={[styles.iconCircle, {backgroundColor: '#F3F4F6'}]}><Ionicons name="lock-closed" size={16} color="#9CA3AF"/></View>
                        <AppText style={styles.roadmapCardTitle}>Mock Interview</AppText>
                        <AppText style={styles.roadmapCardStatusGray}>Locked</AppText>
                        <View style={styles.timeRow}><Ionicons name="time-outline" size={12} color="#6B7280" /><AppText style={styles.timeText}>2h 00m</AppText></View>
                    </View>
                </ScrollView>

                {/* 4. Smart Recommendations */}
                <View style={styles.sectionHeader}>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <AppText style={styles.sectionTitle}>Smart Recommendations ✨</AppText>
                        <AppText style={styles.sectionSubtitleInline}>AI powered for you</AppText>
                    </View>
                    <TouchableOpacity><AppText style={styles.seeAllText}>See all ></AppText></TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recScroll}>
                    <View style={styles.recCard}>
                        <View style={[styles.recIconBox, {backgroundColor: '#EEF2FF'}]}><Ionicons name="book" size={20} color="#3C2CDA" /></View>
                        <AppText style={styles.recTitle}>Revise Weak Topic</AppText>
                        <AppText style={styles.recDesc} numberOfLines={2}>Data Normalization in DBMS</AppText>
                        <TouchableOpacity style={styles.recLink}><AppText style={styles.recLinkText}>Start Now ></AppText></TouchableOpacity>
                    </View>
                    <View style={styles.recCard}>
                        <View style={[styles.recIconBox, {backgroundColor: '#ECFDF5'}]}><Ionicons name="play" size={20} color="#10B981" /></View>
                        <AppText style={styles.recTitle}>Continue Course</AppText>
                        <AppText style={styles.recDesc} numberOfLines={2}>Introduction to AI{"\n"}72% completed</AppText>
                        <TouchableOpacity style={styles.recLink}><AppText style={styles.recLinkText}>Continue ></AppText></TouchableOpacity>
                    </View>
                    <View style={styles.recCard}>
                        <View style={[styles.recIconBox, {backgroundColor: '#FFF7ED'}]}><Ionicons name="code-slash" size={20} color="#F97316" /></View>
                        <AppText style={styles.recTitle}>Practice Challenge</AppText>
                        <AppText style={styles.recDesc} numberOfLines={2}>Two Sum Problem (Easy)</AppText>
                        <TouchableOpacity style={styles.recLink}><AppText style={styles.recLinkText}>Start Now ></AppText></TouchableOpacity>
                    </View>
                    <View style={styles.recCard}>
                        <View style={[styles.recIconBox, {backgroundColor: '#EFF6FF'}]}><Ionicons name="videocam" size={20} color="#3B82F6" /></View>
                        <AppText style={styles.recTitle}>Watch Lesson</AppText>
                        <AppText style={styles.recDesc} numberOfLines={2}>Understanding APIs</AppText>
                        <TouchableOpacity style={styles.recLink}><AppText style={styles.recLinkText}>Start Now ></AppText></TouchableOpacity>
                    </View>
                </ScrollView>

                {/* 5. Focus Mode & Progress */}
                <View style={styles.splitSection}>
                    <View style={styles.focusCard}>
                        <View style={styles.focusHeader}>
                            <AppText style={styles.focusTitle}>Focus Mode</AppText>
                            <Ionicons name="help-circle-outline" size={16} color="#6B7280" />
                        </View>
                        <AppText style={styles.focusTimer}>25:00</AppText>
                        <AppText style={styles.focusSession}>Focus • Session 1 of 4</AppText>
                        <View style={styles.focusControls}>
                            <TouchableOpacity style={styles.playBtn}><Ionicons name="play" size={24} color="#FFF" /></TouchableOpacity>
                            <TouchableOpacity style={styles.resetBtn}><Ionicons name="refresh" size={20} color="#1E1B4B" /></TouchableOpacity>
                        </View>
                        <View style={styles.focusToggles}>
                            <View style={styles.togglePill}><Ionicons name="cafe-outline" size={14} color="#6B7280" /><AppText style={styles.toggleText}>Break Mode</AppText></View>
                            <View style={[styles.togglePill, {backgroundColor: '#EEF2FF', borderColor: '#3C2CDA'}]}><Ionicons name="musical-notes-outline" size={14} color="#3C2CDA" /><AppText style={[styles.toggleText, {color: '#3C2CDA'}]}>Focus Music</AppText><View style={styles.switchOn}/></View>
                        </View>
                    </View>

                    <View style={styles.progressCardMain}>
                        <View style={styles.sectionHeaderInner}>
                            <AppText style={styles.sectionTitle}>This Week's Progress</AppText>
                            <TouchableOpacity><AppText style={styles.seeAllText}>View analytics ></AppText></TouchableOpacity>
                        </View>
                        <View style={styles.progressGrid}>
                            <View style={styles.progressGridItem}>
                                <View style={[styles.gridIcon, {backgroundColor: '#EFF6FF'}]}><Ionicons name="stats-chart" size={16} color="#3B82F6" /></View>
                                <View>
                                    <AppText style={styles.gridLabel}>Hours Studied</AppText>
                                    <AppText style={styles.gridValue}>12h 45m</AppText>
                                    <AppText style={styles.gridChangeGreen}>↑ 18% <AppText style={styles.gridChangeLabel}>vs last week</AppText></AppText>
                                </View>
                            </View>
                            <View style={styles.progressGridItem}>
                                <View style={[styles.gridIcon, {backgroundColor: '#ECFDF5'}]}><Ionicons name="checkmark-circle" size={16} color="#10B981" /></View>
                                <View>
                                    <AppText style={styles.gridLabel}>Quiz Accuracy</AppText>
                                    <AppText style={styles.gridValue}>84%</AppText>
                                    <AppText style={styles.gridChangeGreen}>↑ 9% <AppText style={styles.gridChangeLabel}>vs last week</AppText></AppText>
                                </View>
                            </View>
                            <View style={styles.progressGridItem}>
                                <View style={[styles.gridIcon, {backgroundColor: '#EEF2FF'}]}><Ionicons name="clipboard" size={16} color="#3C2CDA" /></View>
                                <View>
                                    <AppText style={styles.gridLabel}>Assignments</AppText>
                                    <AppText style={styles.gridValue}>8/10</AppText>
                                    <AppText style={styles.gridChangeGreen}>↑ 2 <AppText style={styles.gridChangeLabel}>more vs last week</AppText></AppText>
                                </View>
                            </View>
                            <View style={styles.progressGridItem}>
                                <View style={[styles.gridIcon, {backgroundColor: '#FEF2F2'}]}><Ionicons name="warning" size={16} color="#EF4444" /></View>
                                <View>
                                    <AppText style={styles.gridLabel}>Weak Topic</AppText>
                                    <AppText style={styles.gridValue}>Joins in SQL</AppText>
                                    <AppText style={styles.gridChangeGray}>Focus more to improve</AppText>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* 6. AI Mock Interview */}
                <View style={styles.mockInterviewCard}>
                    <View style={styles.sectionHeaderInner}>
                        <View>
                            <AppText style={styles.sectionTitle}>AI Mock Interview</AppText>
                            <AppText style={styles.mockSub}>Improve your confidence</AppText>
                        </View>
                        <TouchableOpacity><AppText style={styles.seeAllText}>Start Practice ></AppText></TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mockScroll}>
                        <View style={styles.mockItem}>
                            <View style={[styles.mockIcon, {backgroundColor: '#EFF6FF'}]}><Ionicons name="mic" size={18} color="#3B82F6"/></View>
                            <View>
                                <AppText style={styles.mockItemTitle}>Voice Practice</AppText>
                                <AppText style={styles.mockItemSub}>Speak & improve</AppText>
                            </View>
                        </View>
                        <View style={styles.mockItem}>
                            <View style={[styles.mockIcon, {backgroundColor: '#ECFDF5'}]}><Ionicons name="document-text" size={18} color="#10B981"/></View>
                            <View>
                                <AppText style={styles.mockItemTitle}>Resume Review</AppText>
                                <AppText style={styles.mockItemSub}>AI feedback</AppText>
                            </View>
                        </View>
                        <View style={styles.mockItem}>
                            <View style={[styles.mockIcon, {backgroundColor: '#FFF7ED'}]}><Ionicons name="people" size={18} color="#F97316"/></View>
                            <View>
                                <AppText style={styles.mockItemTitle}>HR Interview Prep</AppText>
                                <AppText style={styles.mockItemSub}>Common questions</AppText>
                            </View>
                        </View>
                        <View style={styles.mockItem}>
                            <View style={[styles.mockIcon, {backgroundColor: '#F3E8FF'}]}><Ionicons name="code-slash" size={18} color="#A855F7"/></View>
                            <View>
                                <AppText style={styles.mockItemTitle}>Technical Prep</AppText>
                                <AppText style={styles.mockItemSub}>DSA & System Design</AppText>
                            </View>
                        </View>
                    </ScrollView>
                </View>

                {/* 7. Mood & Deadlines */}
                <View style={styles.splitSection}>
                    <View style={styles.moodCard}>
                        <AppText style={styles.sectionTitle}>How are you feeling today?</AppText>
                        <AppText style={styles.moodSub}>Your mood helps me personalize your learning plan</AppText>
                        <View style={styles.moodGrid}>
                            <View style={styles.moodItem}><AppText style={styles.moodEmoji}>😊</AppText><AppText style={[styles.moodLabel, {color: '#10B981'}]}>Good</AppText></View>
                            <View style={styles.moodItem}><AppText style={styles.moodEmoji}>😴</AppText><AppText style={[styles.moodLabel, {color: '#F59E0B'}]}>Tired</AppText></View>
                            <View style={styles.moodItem}><AppText style={styles.moodEmoji}>😰</AppText><AppText style={[styles.moodLabel, {color: '#3B82F6'}]}>Stressed</AppText></View>
                            <View style={styles.moodItem}><AppText style={styles.moodEmoji}>🔥</AppText><AppText style={[styles.moodLabel, {color: '#EF4444'}]}>Motivated</AppText></View>
                        </View>
                    </View>
                    <View style={styles.deadlinesCard}>
                        <View style={styles.sectionHeaderInner}>
                            <AppText style={styles.sectionTitle}>Upcoming & Deadlines</AppText>
                            <TouchableOpacity><AppText style={styles.seeAllText}>View all ></AppText></TouchableOpacity>
                        </View>
                        <View style={styles.deadlineList}>
                            <View style={styles.deadlineItem}>
                                <View style={[styles.dlIcon, {backgroundColor: '#FFF7ED'}]}><Ionicons name="calendar" size={14} color="#F97316" /></View>
                                <View>
                                    <AppText style={styles.dlTitle}>DBMS Assignment</AppText>
                                    <AppText style={styles.dlSub}>Due in 2 days</AppText>
                                </View>
                            </View>
                            <View style={styles.deadlineItem}>
                                <View style={[styles.dlIcon, {backgroundColor: '#FEF2F2'}]}><Ionicons name="document" size={14} color="#EF4444" /></View>
                                <View>
                                    <AppText style={styles.dlTitle}>SQL Quiz</AppText>
                                    <AppText style={styles.dlSub}>Due in 3 days</AppText>
                                </View>
                            </View>
                            <View style={styles.deadlineItem}>
                                <View style={[styles.dlIcon, {backgroundColor: '#EFF6FF'}]}><Ionicons name="laptop" size={14} color="#3B82F6" /></View>
                                <View>
                                    <AppText style={styles.dlTitle}>System Design Exam</AppText>
                                    <AppText style={styles.dlSub}>Due in 7 days</AppText>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* 8. Habit Tracker & Achievements */}
                <View style={styles.splitSection}>
                    <View style={styles.habitCard}>
                        <AppText style={styles.sectionTitle}>Habit Tracker</AppText>
                        <AppText style={styles.habitSub}>Track your daily habits</AppText>
                        <View style={styles.habitGrid}>
                            <View style={styles.habitItem}>
                                <View style={[styles.circleProgress, {borderColor: '#3C2CDA'}]}><Ionicons name="moon" size={18} color="#3C2CDA"/></View>
                                <AppText style={styles.habitTitle}>Sleep</AppText>
                                <AppText style={styles.habitValue}>7h 30m</AppText>
                                <View style={styles.habitCheck}><Ionicons name="checkmark" size={10} color="#FFF"/></View>
                            </View>
                            <View style={styles.habitItem}>
                                <View style={[styles.circleProgress, {borderColor: '#3B82F6'}]}><Ionicons name="water" size={18} color="#3B82F6"/></View>
                                <AppText style={styles.habitTitle}>Water</AppText>
                                <AppText style={styles.habitValue}>6/8 cups</AppText>
                                <View style={styles.habitCheck}><Ionicons name="checkmark" size={10} color="#FFF"/></View>
                            </View>
                            <View style={styles.habitItem}>
                                <View style={[styles.circleProgress, {borderColor: '#F97316'}]}><Ionicons name="book" size={18} color="#F97316"/></View>
                                <AppText style={styles.habitTitle}>Study</AppText>
                                <AppText style={styles.habitValue}>3.5/5 hrs</AppText>
                            </View>
                            <View style={styles.habitItem}>
                                <View style={[styles.circleProgress, {borderColor: '#10B981'}]}><Ionicons name="walk" size={18} color="#10B981"/></View>
                                <AppText style={styles.habitTitle}>Exercise</AppText>
                                <AppText style={styles.habitValue}>20/30 min</AppText>
                                <View style={styles.habitCheck}><Ionicons name="checkmark" size={10} color="#FFF"/></View>
                            </View>
                        </View>
                    </View>
                    <View style={styles.achievementsCard}>
                        <View style={styles.sectionHeaderInner}>
                            <AppText style={styles.sectionTitle}>Achievements</AppText>
                            <TouchableOpacity><AppText style={styles.seeAllText}>See all ></AppText></TouchableOpacity>
                        </View>
                        <View style={styles.badgesRow}>
                            <View style={styles.badgeItem}>
                                <View style={styles.badgeImage}><AppText style={{fontSize: 24}}>🔥</AppText></View>
                                <AppText style={styles.badgeLabel}>7 Day{"\n"}Streak</AppText>
                            </View>
                            <View style={styles.badgeItem}>
                                <View style={styles.badgeImage}><AppText style={{fontSize: 24}}>🎓</AppText></View>
                                <AppText style={styles.badgeLabel}>Course{"\n"}Completed</AppText>
                            </View>
                            <View style={styles.badgeItem}>
                                <View style={styles.badgeImage}><AppText style={{fontSize: 24}}>⭐</AppText></View>
                                <AppText style={styles.badgeLabel}>Top{"\n"}Performer</AppText>
                            </View>
                            <View style={styles.badgeItem}>
                                <View style={styles.badgeImage}><AppText style={{fontSize: 24}}>🏆</AppText></View>
                                <AppText style={styles.badgeLabel}>Quiz{"\n"}Master</AppText>
                            </View>
                        </View>
                    </View>
                </View>

                {/* 9. Quick Actions */}
                <View style={styles.quickActionsWrap}>
                    <AppText style={styles.sectionTitle}>Quick Actions</AppText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.qaScroll}>
                        <TouchableOpacity style={styles.qaPill}><Ionicons name="calendar-outline" size={14} color="#3B82F6"/><AppText style={styles.qaText}>Create Study Plan</AppText></TouchableOpacity>
                        <TouchableOpacity style={styles.qaPill}><Ionicons name="create-outline" size={14} color="#3C2CDA"/><AppText style={styles.qaText}>Revise Topic</AppText></TouchableOpacity>
                        <TouchableOpacity style={styles.qaPill}><Ionicons name="help-circle-outline" size={14} color="#3B82F6"/><AppText style={styles.qaText}>Practice Test</AppText></TouchableOpacity>
                        <TouchableOpacity style={styles.qaPill}><Ionicons name="briefcase-outline" size={14} color="#3C2CDA"/><AppText style={styles.qaText}>Career Advice</AppText></TouchableOpacity>
                        <TouchableOpacity style={styles.qaPill}><Ionicons name="bulb-outline" size={14} color="#F59E0B"/><AppText style={styles.qaText}>Productivity Tips</AppText></TouchableOpacity>
                    </ScrollView>
                </View>
                
                {/* Spacer for floating button */}
                <View style={{height: 100}} />
            </ScrollView>

            {/* 10. Floating Ask Coach Button */}
            <View style={styles.floatingCoach}>
                <Image source={require('../../assets/botchat.png')} style={{width: 40, height: 40, borderRadius: 20}} />
                <View style={styles.floatTextCol}>
                    <AppText style={styles.floatTitle}>Ask Coach</AppText>
                    <AppText style={styles.floatSub}>Get instant help</AppText>
                </View>
                <TouchableOpacity style={styles.floatBtn} onPress={() => setIsChatOpen(true)}>
                    <Ionicons name="chatbubbles" size={20} color="#FFF" />
                </TouchableOpacity>
            </View>

            {/* 11. Modal Tutor Overlay */}
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
    scrollContent: { paddingHorizontal: 16, paddingTop: 16 },
    // Header
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    headerLeft: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E5E7EB' },
    headerTextCol: { marginLeft: 12 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E1B4B' },
    headerSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
    headerRight: { flexDirection: 'row', gap: 12 },
    iconBtn: { padding: 4 },
    notificationDot: { position: 'absolute', top: 4, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 1, borderColor: '#FFF' },
    streakWrapper: { alignItems: 'flex-end', marginBottom: 16 },
    streakBadge: { backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    streakText: { fontSize: 12, fontWeight: 'bold', color: '#F97316' },
    // Hero
    heroCard: { borderRadius: 20, padding: 20, flexDirection: 'row', marginBottom: 24, overflow: 'hidden', position: 'relative', minHeight: 180 },
    heroContent: { flex: 1, zIndex: 1, maxWidth: '65%' },
    heroTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E1B4B', marginBottom: 8 },
    heroMainText: { fontSize: 16, color: '#1E1B4B', marginBottom: 8, lineHeight: 22 },
    heroSubText: { fontSize: 12, color: '#4B5563', marginBottom: 16, maxWidth: '90%' },
    heroButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    primaryBtn: { backgroundColor: '#3C2CDA', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
    primaryBtnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
    secondaryBtn: { backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
    secondaryBtnText: { color: '#3C2CDA', fontSize: 12, fontWeight: 'bold' },
    heroImage: { width: 140, height: 160, position: 'absolute', right: 0, bottom: -10, zIndex: 0 },
    // Shared Sections
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionHeaderInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E1B4B' },
    sectionSubtitleInline: { fontSize: 12, color: '#6B7280', marginLeft: 8 },
    seeAllText: { fontSize: 12, color: '#3C2CDA', fontWeight: '500' },
    splitSection: { flexDirection: 'column', gap: 16, marginBottom: 24 },
    // Roadmap
    roadmapScroll: { gap: 12, paddingBottom: 24 },
    roadmapCard: { backgroundColor: '#FFF', padding: 12, borderRadius: 16, width: 140, borderWidth: 1, borderColor: '#E5E7EB' },
    roadmapCardActive: { borderColor: '#3C2CDA', borderWidth: 2, shadowColor: '#3C2CDA', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
    iconCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    roadmapCardTitle: { fontSize: 14, fontWeight: 'bold', color: '#1E1B4B', marginBottom: 4 },
    roadmapCardStatusGreen: { fontSize: 11, color: '#10B981', fontWeight: 'bold', marginBottom: 8 },
    roadmapCardStatusGray: { fontSize: 11, color: '#6B7280', fontWeight: 'bold', marginBottom: 8 },
    timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    timeText: { fontSize: 11, color: '#6B7280' },
    progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    progressBar: { flex: 1, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2 },
    progressFill: { height: 4, backgroundColor: '#3C2CDA', borderRadius: 2 },
    progressText: { fontSize: 11, fontWeight: 'bold', color: '#1E1B4B' },
    roadmapConnector: { width: 16, height: 2, backgroundColor: '#E5E7EB', alignSelf: 'center', marginTop: -20 },
    // Smart Recs
    recScroll: { gap: 12, paddingBottom: 24 },
    recCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, width: 160, borderWidth: 1, borderColor: '#E5E7EB' },
    recIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    recTitle: { fontSize: 14, fontWeight: 'bold', color: '#1E1B4B', marginBottom: 4 },
    recDesc: { fontSize: 12, color: '#6B7280', marginBottom: 12, minHeight: 32 },
    recLink: { },
    recLinkText: { fontSize: 12, color: '#3C2CDA', fontWeight: 'bold' },
    // Focus & Progress
    focusCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB' },
    focusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    focusTitle: { fontSize: 14, fontWeight: 'bold', color: '#1E1B4B' },
    focusTimer: { fontSize: 36, fontWeight: 'bold', color: '#1E1B4B', textAlign: 'center', marginBottom: 4 },
    focusSession: { fontSize: 11, color: '#6B7280', textAlign: 'center', marginBottom: 16 },
    focusControls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, marginBottom: 16 },
    playBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#3C2CDA', alignItems: 'center', justifyContent: 'center' },
    resetBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
    focusToggles: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
    togglePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB' },
    toggleText: { fontSize: 10, color: '#6B7280', fontWeight: '500' },
    switchOn: { width: 24, height: 14, borderRadius: 7, backgroundColor: '#3C2CDA', marginLeft: 4, opacity: 0.8 },
    
    progressCardMain: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB' },
    progressGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
    progressGridItem: { width: '48%', flexDirection: 'row', gap: 8, marginBottom: 8 },
    gridIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    gridLabel: { fontSize: 10, color: '#1E1B4B', fontWeight: 'bold' },
    gridValue: { fontSize: 14, fontWeight: 'bold', color: '#1E1B4B', marginVertical: 2 },
    gridChangeGreen: { fontSize: 9, color: '#10B981', fontWeight: 'bold' },
    gridChangeLabel: { color: '#6B7280', fontWeight: 'normal' },
    gridChangeGray: { fontSize: 9, color: '#6B7280' },
    // Mock Interview
    mockInterviewCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 24 },
    mockSub: { fontSize: 11, color: '#6B7280', marginTop: 2 },
    mockScroll: { gap: 12 },
    mockItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F9FAFB', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', width: 200 },
    mockIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    mockItemTitle: { fontSize: 13, fontWeight: 'bold', color: '#1E1B4B' },
    mockItemSub: { fontSize: 11, color: '#6B7280' },
    // Mood & Deadlines
    moodCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB' },
    moodSub: { fontSize: 11, color: '#6B7280', marginBottom: 16, marginTop: 4 },
    moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' },
    moodItem: { width: '48%', backgroundColor: '#F9FAFB', alignItems: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
    moodEmoji: { fontSize: 24, marginBottom: 4 },
    moodLabel: { fontSize: 11, fontWeight: 'bold' },
    deadlinesCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB' },
    deadlineList: { gap: 12 },
    deadlineItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    dlIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    dlTitle: { fontSize: 12, fontWeight: 'bold', color: '#1E1B4B' },
    dlSub: { fontSize: 10, color: '#6B7280' },
    habitCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB' },
    habitSub: { fontSize: 11, color: '#6B7280', marginBottom: 16, marginTop: 4 },
    habitGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-around' },
    habitItem: { alignItems: 'center', width: '45%', marginBottom: 12, position: 'relative' },
    circleProgress: { width: 44, height: 44, borderRadius: 22, borderWidth: 3, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    habitTitle: { fontSize: 11, fontWeight: 'bold', color: '#1E1B4B' },
    habitValue: { fontSize: 9, color: '#6B7280' },
    habitCheck: { position: 'absolute', top: 0, right: 4, width: 14, height: 14, borderRadius: 7, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FFF' },
    
    achievementsCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB' },
    badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' },
    badgeItem: { alignItems: 'center', width: '22%', marginBottom: 12 },
    badgeImage: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    badgeLabel: { fontSize: 10, fontWeight: 'bold', color: '#1E1B4B', textAlign: 'center' },
    // Quick Actions
    quickActionsWrap: { marginBottom: 24 },
    qaScroll: { gap: 12, paddingTop: 12 },
    qaPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB' },
    qaText: { fontSize: 12, fontWeight: '500', color: '#1E1B4B' },
    // Floating Bot
    floatingCoach: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 30, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.15, shadowRadius: 10, elevation: 8 },
    floatTextCol: { marginHorizontal: 12 },
    floatTitle: { fontSize: 13, fontWeight: 'bold', color: '#1E1B4B' },
    floatSub: { fontSize: 10, color: '#6B7280' },
    floatBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#3C2CDA', alignItems: 'center', justifyContent: 'center', marginLeft: 12 }
});
