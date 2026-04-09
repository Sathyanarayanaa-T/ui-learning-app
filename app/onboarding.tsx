import React, { useEffect } from 'react';
import {
    View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Dimensions, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AppText } from '../components/atoms/AppText';
import { OnboardingForm } from '../components/organisms/OnboardingForm';
import { WebContainer } from '../components/layout/WebContainer';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';
import { useColors } from '../hooks/useColors';

const { height } = Dimensions.get('window');

export default function OnboardingScreen() {
    const learningPath = useAppStore((s) => s.learningPath);
    const { isDark, toggleTheme } = useAppStore();
    const colors = useColors();
    const insets = useSafeAreaInsets();

    useEffect(() => {
        if (learningPath) router.replace('/(tabs)/roadmap');
    }, [learningPath]);

    return (
        <View style={[styles.root, { backgroundColor: colors.light }]}>
            {/* ── Hero gradient ───────────────────────────── */}
            <View
                style={[styles.hero, { backgroundColor: Colors.darkBlue, paddingTop: Math.max(insets.top, 24) }]}
            >
                <WebContainer>
                    <View style={[styles.heroContent, { zIndex: 10, elevation: 10 }]}>
                        {/* ── Top nav ─────────────────────────── */}
                        <View style={styles.topNav}>
                            {/* Wordmark */}
                            <View style={styles.wordmark}>
                                <View style={styles.wordmarkDot} />
                                <AppText style={styles.wordmarkText}>hexaware</AppText>
                            </View>
                            <View style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' }}>
                                {/* Subtle theme pill */}
                                <TouchableOpacity
                                    onPress={toggleTheme}
                                    style={[styles.themePill, { backgroundColor: '#FFFFFF18' }]}
                                >
                                    <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={14} color={Colors.snow} style={{ marginRight: 6 }} />
                                    <AppText style={styles.themePillText}>
                                        {isDark ? 'Light' : 'Dark'}
                                    </AppText>
                                </TouchableOpacity>

                                {/* Close button */}
                                <TouchableOpacity
                                    onPress={() => {
                                        if (router.canGoBack()) router.back();
                                        else router.replace('/(tabs)/tutor');
                                    }}
                                    style={styles.closeBtn}
                                >
                                    <Ionicons name="close" size={20} color={Colors.snow} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* ── Hero copy ───────────────────────── */}
                        <AppText style={styles.heroTagline}>AI-Powered Learning</AppText>
                        <AppText style={styles.heroTitle}>Build Your Expert{'\n'}Career Path</AppText>
                        <AppText style={styles.heroSub}>Personalized roadmaps tailored to your role and skill level.</AppText>

                        {/* ── Stats strip ─────────────────────── */}
                        <View style={styles.statsRow}>
                            {[{ num: '500+', label: 'Courses' }, { num: '50+', label: 'Roles' }, { num: '10K+', label: 'Trainees' }].map((s, i) => (
                                <React.Fragment key={s.label}>
                                    {i > 0 && <View style={styles.statDivider} />}
                                    <View style={styles.statItem}>
                                        <AppText style={styles.statNum}>{s.num}</AppText>
                                        <AppText style={styles.statLabel}>{s.label}</AppText>
                                    </View>
                                </React.Fragment>
                            ))}
                        </View>
                    </View>
                </WebContainer>
            </View>

            {/* ── Form panel ──────────────────────────────── */}
            <KeyboardAvoidingView
                style={[styles.formPanel, { backgroundColor: colors.light, zIndex: 1 }]}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                pointerEvents="box-none"
            >
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    <WebContainer>
                        <View style={styles.formHeader}>
                            <View>
                                <AppText variant="subheading">Get Started</AppText>
                                <AppText variant="caption" style={styles.formSub}>
                                    Tell us about yourself to generate your path.
                                </AppText>
                            </View>
                            {/* Step badge */}
                            <View style={[styles.stepBadge, { backgroundColor: colors.brightBlue + '18' }]}>
                                <AppText style={[styles.stepBadgeText, { color: colors.brightBlue }]}>2 steps</AppText>
                            </View>
                        </View>
                        <OnboardingForm onComplete={() => router.replace('/(tabs)/roadmap')} />
                    </WebContainer>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    hero: { paddingBottom: Spacing['4xl'] },
    heroContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },

    // ── Top nav
    topNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing['3xl'],
    },
    wordmark: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    wordmarkDot: {
        width: 8, height: 8, borderRadius: 4,
        backgroundColor: Colors.canary,
    },
    wordmarkText: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.extrabold as '800',
        color: Colors.snow,
        letterSpacing: 1,
    },
    themePill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#FFFFFF22',
    },
    themePillText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semibold as '600',
        color: Colors.snow,
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FFFFFF18',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // ── Hero copy
    heroTagline: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semibold as '600',
        color: Colors.canary,
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: Spacing.sm,
    },
    heroTitle: {
        fontSize: 32,
        fontWeight: FontWeight.extrabold as '800',
        color: Colors.snow,
        lineHeight: 40,
        marginBottom: Spacing.md,
    },
    heroSub: {
        fontSize: FontSize.md,
        color: Colors.snow,
        opacity: 0.75,
        lineHeight: 22,
        marginBottom: Spacing['2xl'],
    },

    // ── Stats
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF10',
        borderRadius: Radius.lg,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xl,
    },
    statItem: { flex: 1, alignItems: 'center' },
    statDivider: { width: 1, height: 28, backgroundColor: '#FFFFFF22' },
    statNum: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold as '800', color: Colors.canary },
    statLabel: { fontSize: FontSize.xs, color: Colors.snow, opacity: 0.6, marginTop: 2 },

    // ── Form panel
    formPanel: {
        flex: 1,
        marginTop: -28,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
    },
    scrollContent: { paddingTop: Spacing['2xl'], paddingBottom: 120 },
    formHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing['2xl'],
        paddingHorizontal: Spacing.lg,
    },
    formSub: { marginTop: 4 },
    stepBadge: {
        paddingHorizontal: Spacing.md,
        paddingVertical: 6,
        borderRadius: Radius.full,
        marginTop: 6,
    },
    stepBadgeText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semibold as '600',
    },
});
