import React from 'react';
import { View, StyleSheet, Linking } from 'react-native';
import { AppText } from '../atoms/AppText';
import { AppButton } from '../atoms/AppButton';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, Radius, FontSize, FontWeight } from '../../constants/theme';
import { useColors } from '../../hooks/useColors';
import type { Course } from '../../types';

interface CourseCardProps {
    course: Course;
    onMarkDone?: (courseId: number) => void;
    isLoading?: boolean;
}

const MatchScoreRing: React.FC<{ score: number }> = ({ score }) => {
    const colors = useColors();
    const color = score >= 90 ? colors.honey : score >= 75 ? colors.brightBlue : colors.silver;
    return (
        <View style={[styles.ring, { borderColor: color }]}>
            <AppText style={[styles.ringText, { color }]}>{Math.round(score)}</AppText>
            <AppText style={styles.ringPercent}>%</AppText>
        </View>
    );
};

export const CourseCard: React.FC<CourseCardProps> = ({ course, onMarkDone, isLoading }) => {
    const colors = useColors();

    return (
        <View style={[styles.card, { backgroundColor: colors.white, borderColor: colors.borderLight }]}>
            <View style={styles.row}>
                <View style={styles.info}>
                    <View style={styles.providerRow}>
                        <View style={[styles.providerBadge, { backgroundColor: colors.electricBlue + '18' }]}>
                            <AppText style={[styles.providerText, { color: colors.electricBlue }]}>
                                {course.provider}
                            </AppText>
                        </View>
                    </View>
                    <AppText variant="label" style={styles.title}>{course.title}</AppText>
                </View>
                <MatchScoreRing score={course.match_score} />
            </View>

            <View style={styles.matchLabel}>
                <AppText variant="caption">Match Score</AppText>
            </View>

            <View style={styles.actions}>
                <AppButton
                    label="Open Resource"
                    rightIcon={<Ionicons name="open-outline" size={16} color={colors.brightBlue} />}
                    onPress={() => Linking.openURL(course.resource_url).catch(() => { })}
                    variant="ghost"
                    size="sm"
                    style={styles.linkBtn}
                />
                {!course.is_finished ? (
                    <AppButton
                        label="Mark as Done"
                        rightIcon={<Ionicons name="checkmark" size={16} color={colors.snow} />}
                        onPress={() => onMarkDone?.(course.course_id)}
                        variant="primary"
                        size="sm"
                        loading={isLoading}
                    />
                ) : (
                    <View style={[styles.doneBadge, { backgroundColor: colors.honey + '20', flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                        <Ionicons name="checkmark-done" size={16} color={colors.honey} />
                        <AppText style={[styles.doneText, { color: colors.honey }]}>Completed</AppText>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: Radius.lg,
        borderWidth: 1,
        marginBottom: Spacing.md,
        padding: Spacing.lg,
    },
    row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    info: { flex: 1, marginRight: Spacing.md },
    providerRow: { marginBottom: Spacing.xs },
    providerBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: Radius.full,
    },
    providerText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold as '600' },
    title: { fontSize: FontSize.md, lineHeight: 22 },
    ring: {
        width: 52, height: 52, borderRadius: 26, borderWidth: 3,
        alignItems: 'center', justifyContent: 'center', flexDirection: 'row', flexShrink: 0,
    },
    ringText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold as '700' },
    ringPercent: { fontSize: 8, marginTop: 4 },
    matchLabel: { marginBottom: Spacing.md, marginTop: 2 },
    actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.sm },
    linkBtn: { flex: 1 },
    doneBadge: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full },
    doneText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold as '600' },
});
