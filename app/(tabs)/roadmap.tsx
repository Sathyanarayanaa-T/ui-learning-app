import React from 'react';
import {
    View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Redirect } from 'expo-router';
import { AppText } from '../../components/atoms/AppText';
import { AppButton } from '../../components/atoms/AppButton';
import { RoadmapList } from '../../components/organisms/RoadmapList';
import { WebContainer } from '../../components/layout/WebContainer';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '../../constants/theme';
import { useAppStore } from '../../store/useAppStore';
import { useColors } from '../../hooks/useColors';

export default function RoadmapScreen() {
    const { learningPath, isLoadingPath, user } = useAppStore();
    const colors = useColors();
    const insets = useSafeAreaInsets();

    if (isLoadingPath) {
        return (
            <View style={[styles.center, { backgroundColor: colors.light }]}>
                <ActivityIndicator size="large" color={colors.brightBlue} />
                <AppText variant="body" style={styles.loadingText}>Generating your path…</AppText>
            </View>
        );
    }

    if (!learningPath) {
        return <Redirect href="/onboarding" />;
    }

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
                        {/* Left: title block */}
                        <View style={styles.headerLeft}>
                            <AppText style={styles.headerSuper}>
                                {user?.role ?? 'Your Path'}
                            </AppText>
                            <AppText style={styles.headerTitle}>Learning Roadmap</AppText>
                        </View>
                        {/* Right: reset as text button */}
                        <TouchableOpacity
                            onPress={() => { useAppStore.getState().reset(); router.replace('/'); }}
                            style={[styles.resetBtn, { borderColor: '#FFFFFF33' }]}
                        >
                            <AppText style={styles.resetText}>Reset</AppText>
                        </TouchableOpacity>
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
                    <RoadmapList learningPath={learningPath} />
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.sm,
    },
    headerLeft: { flex: 1 },
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
    resetBtn: {
        paddingHorizontal: Spacing.md,
        paddingVertical: 7,
        borderRadius: Radius.full,
        borderWidth: 1,
    },
    resetText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semibold as '600',
        color: Colors.snow,
        opacity: 0.8,
    },

    // ── Scroll
    scroll: { flex: 1, marginTop: -20 },
    scrollContent: { paddingTop: Spacing['2xl'], paddingBottom: 120 },

    // ── Empty / Loading
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing['2xl'] },
    emptyDesc: { marginTop: 6, marginBottom: Spacing['2xl'] },
    emptyBtn: { minWidth: 200 },
    loadingText: { marginTop: Spacing.lg },
});
