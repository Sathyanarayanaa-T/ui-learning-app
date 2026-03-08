import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from '../atoms/AppText';
import { ProgressBar } from '../atoms/ProgressBar';
import { RoadmapStep } from '../molecules/RoadmapStep';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, Radius, FontSize, FontWeight } from '../../constants/theme';
import { useColors } from '../../hooks/useColors';
import type { LearningPath } from '../../types';

interface RoadmapListProps {
    learningPath: LearningPath;
}

export const RoadmapList: React.FC<RoadmapListProps> = ({ learningPath }) => {
    const colors = useColors();
    const completedSteps = learningPath.roadmap.filter((s) => s.status === 'completed').length;
    const totalSteps = learningPath.roadmap.length;
    const progressPercent = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

    return (
        <View>
            <View style={[styles.summaryCard, { backgroundColor: colors.snow, borderColor: colors.borderLight }]}>
                <View style={styles.summaryRow}>
                    <View>
                        <AppText variant="overline">Learning Path</AppText>
                        <AppText variant="title">{learningPath.role}</AppText>
                    </View>
                    <View style={styles.badgesCol}>
                        <View style={[styles.levelBadge, { backgroundColor: colors.canary + '40' }]}>
                            <AppText style={[styles.levelText, { color: colors.honey }]}>
                                {learningPath.inferred_level}
                            </AppText>
                        </View>
                        <View style={[styles.engineBadge, { backgroundColor: colors.brightBlue + '18' }]}>
                            <AppText style={[styles.engineText, { color: colors.brightBlue }]}>
                                {learningPath.engine}
                            </AppText>
                        </View>
                    </View>
                </View>
                <ProgressBar
                    progress={progressPercent}
                    label={`${completedSteps} / ${totalSteps} steps`}
                    style={styles.progressBar}
                />
                {learningPath.is_path_finished && (
                    <View style={[styles.finishedBanner, { backgroundColor: colors.honey + '18', flexDirection: 'row', gap: 6 }]}>
                        <Ionicons name="trophy" size={20} color={colors.honey} />
                        <AppText style={[styles.finishedText, { color: colors.honey }]}>
                            Path Complete! Congratulations!
                        </AppText>
                    </View>
                )}
            </View>

            {learningPath.roadmap.map((step, index) => (
                <RoadmapStep key={step.step} step={step} stepIndex={index} />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    summaryCard: {
        borderRadius: 14,
        padding: Spacing['2xl'],
        marginBottom: Spacing.lg,
        borderWidth: 1,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.lg,
    },
    badgesCol: { alignItems: 'flex-end', gap: 6 },
    levelBadge: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: 20 },
    levelText: { fontSize: 12, fontWeight: '600' },
    engineBadge: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: 20 },
    engineText: { fontSize: 10, fontWeight: '600' },
    progressBar: { marginBottom: 0 },
    finishedBanner: {
        marginTop: Spacing.md,
        padding: Spacing.md,
        borderRadius: 10,
        alignItems: 'center',
    },
    finishedText: { fontSize: 14, fontWeight: '700' },
});
