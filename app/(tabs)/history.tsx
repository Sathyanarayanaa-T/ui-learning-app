import React, { useEffect } from 'react';
import {
    View, StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect } from 'expo-router';
import { AppText } from '../../components/atoms/AppText';
import { StatCard } from '../../components/molecules/StatCard';
import { Card } from '../../components/atoms/Card';
import { WebContainer } from '../../components/layout/WebContainer';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../constants/theme';
import { useAppStore } from '../../store/useAppStore';
import { useColors } from '../../hooks/useColors';

export default function HistoryScreen() {
    const { history, isLoadingHistory, fetchHistory, learningPath } = useAppStore();
    const colors = useColors();
    const insets = useSafeAreaInsets();

    useEffect(() => { fetchHistory(); }, []);

    if (!learningPath) {
        return <Redirect href="/onboarding" />;
    }

    const totalCompleted = history?.total ?? 0;
    const inProgress = learningPath?.roadmap.filter(
        (s) => s.status === 'active' || s.status === 'review'
    ).length ?? 0;

    return (
        <View style={[styles.root, { backgroundColor: colors.light }]}>
            {/* ── Header ────────────────────────────────────── */}
            <LinearGradient
                colors={[Colors.darkBlue, Colors.hexawareBlue]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.header, { paddingTop: Math.max(insets.top, 40), zIndex: 10, elevation: 10 }]}
            >
                <WebContainer>
                    <View style={styles.headerInner}>
                        <View>
                            <AppText style={styles.headerSuper}>Overview</AppText>
                            <AppText style={styles.headerTitle}>My Progress</AppText>
                        </View>
                    </View>
                </WebContainer>
            </LinearGradient>

            {/* ── Content ───────────────────────────────────── */}
            <ScrollView
                style={[styles.scroll, { zIndex: 1 }]}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <WebContainer>
                    {/* Stats */}
                    <View style={styles.statsRow}>
                        <StatCard icon={<Ionicons name="checkmark-circle" size={24} color={colors.honey} />} label="Completed" value={totalCompleted} color={colors.honey} />
                        <StatCard icon={<Ionicons name="flash" size={24} color={colors.brightBlue} />} label="Active" value={inProgress} color={colors.brightBlue} />
                        <StatCard icon={<Ionicons name="book" size={24} color={colors.hexawareBlue} />} label="Total" value={learningPath?.roadmap.length ?? 0} color={colors.hexawareBlue} />
                    </View>

                    <AppText variant="title" style={styles.sectionTitle}>Completed Courses</AppText>

                    {isLoadingHistory ? (
                        <ActivityIndicator color={colors.brightBlue} style={styles.loader} />
                    ) : !history || history.courses.length === 0 ? (
                        <Card style={styles.emptyCard}>
                            <Ionicons name="file-tray-outline" size={40} color={colors.silver} style={{ marginBottom: Spacing.md }} />
                            <AppText variant="body" align="center" style={{ color: colors.silver }}>
                                No history yet. Complete your first course to see it here!
                            </AppText>
                        </Card>
                    ) : (
                        history.courses.map((course, idx) => (
                            <Card key={course.id} style={styles.historyCard}>
                                <View style={styles.historyRow}>
                                    <View style={[styles.historyIndex, { backgroundColor: colors.hexawareBlue + '15' }]}>
                                        <AppText style={[styles.historyNum, { color: colors.hexawareBlue }]}>{idx + 1}</AppText>
                                    </View>
                                    <View style={styles.historyInfo}>
                                        <AppText variant="label" numberOfLines={2}>{course.title}</AppText>
                                        <View style={styles.historyMeta}>
                                            {course.provider && (
                                                <AppText variant="caption">{course.provider}</AppText>
                                            )}
                                            {course.topic && (
                                                <AppText variant="caption" style={{ color: colors.brightBlue }}>
                                                    {'  ·  '}{course.topic}
                                                </AppText>
                                            )}
                                        </View>
                                    </View>
                                    {course.level && (
                                        <View style={[styles.levelPill, { backgroundColor: colors.honey + '20' }]}>
                                            <AppText style={[styles.levelPillText, { color: colors.honey }]}>
                                                {course.level}
                                            </AppText>
                                        </View>
                                    )}
                                </View>
                            </Card>
                        ))
                    )}

                    {/* Motivation banner */}
                    <View style={[styles.banner, { backgroundColor: colors.canary + '22', borderColor: colors.canary + '44' }]}>
                        <Ionicons name="trophy" size={32} color={colors.honey} />
                        <View style={styles.bannerText}>
                            <AppText style={[styles.bannerTitle, { color: colors.honey }]}>Keep it up!</AppText>
                            <AppText style={[styles.bannerSub, { color: colors.silver }]}>
                                Every course is a step closer to mastery.
                            </AppText>
                        </View>
                    </View>
                </WebContainer>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },

    // ── Header
    header: { paddingBottom: Spacing['2xl'] },
    headerInner: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.sm,
    },
    headerSuper: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semibold as '600',
        color: Colors.canary,
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    headerTitle: {
        fontSize: FontSize['2xl'],
        fontWeight: FontWeight.extrabold as '800',
        color: Colors.snow,
    },

    // ── Scroll
    scroll: { flex: 1, marginTop: -20 },
    scrollContent: { paddingTop: Spacing['2xl'], paddingBottom: 120 },

    // ── Stats
    statsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing['2xl'] },
    sectionTitle: { marginBottom: Spacing.lg },
    loader: { marginTop: Spacing['2xl'] },

    // ── Empty
    emptyCard: { padding: Spacing['3xl'], alignItems: 'center' },

    // ── History items
    historyCard: { marginBottom: Spacing.md, padding: Spacing.lg },
    historyRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    historyIndex: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    historyNum: { fontSize: FontSize.sm, fontWeight: FontWeight.bold as '700' },
    historyInfo: { flex: 1 },
    historyMeta: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 },
    levelPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
    levelPillText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold as '600' },

    // ── Motivation banner
    banner: {
        marginTop: Spacing['2xl'], flexDirection: 'row', alignItems: 'center',
        borderRadius: Radius.lg, padding: Spacing.xl, gap: Spacing.lg, borderWidth: 1,
    },
    bannerText: { flex: 1 },
    bannerTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold as '700', marginBottom: 2 },
    bannerSub: { fontSize: FontSize.sm, lineHeight: 20 },
});
