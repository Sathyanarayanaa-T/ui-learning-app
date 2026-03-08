import React, { useState } from 'react';
import {
    View, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager,
} from 'react-native';
import { AppText } from '../atoms/AppText';
import { Badge } from '../atoms/Badge';
import { CourseCard } from './CourseCard';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, Radius, FontSize, FontWeight, Shadow } from '../../constants/theme';
import { useColors } from '../../hooks/useColors';
import type { RoadmapStep as RoadmapStepType } from '../../types';
import { useAppStore } from '../../store/useAppStore';

if (Platform.OS === 'android') {
    UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

interface RoadmapStepProps {
    step: RoadmapStepType;
    stepIndex: number;
}

export const RoadmapStep: React.FC<RoadmapStepProps> = ({ step, stepIndex }) => {
    const [expanded, setExpanded] = useState(step.status === 'active');
    const [loadingCourseId, setLoadingCourseId] = useState<number | null>(null);
    const markCourseFinished = useAppStore((s) => s.markCourseFinished);
    const colors = useColors();

    const isLocked = step.status === 'locked';
    const isDone = step.status === 'completed' || step.status === 'review';

    const toggle = () => {
        if (isLocked) return;
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded((p) => !p);
    };

    const handleMarkDone = async (courseId: number) => {
        setLoadingCourseId(courseId);
        await markCourseFinished(stepIndex, courseId);
        setLoadingCourseId(null);
    };

    const stepColor =
        isDone ? colors.honey
            : step.status === 'active' ? colors.brightBlue
                : colors.borderLight;

    return (
        <View style={[
            styles.wrapper,
            { backgroundColor: colors.snow, borderColor: colors.borderLight },
            isLocked && styles.wrapperLocked,
        ]}>
            {/* Colour accent bar at top */}
            <View style={[styles.connectorLine, { backgroundColor: stepColor }]} />

            <TouchableOpacity
                onPress={toggle}
                activeOpacity={isLocked ? 1 : 0.8}
                style={styles.header}
            >
                <View style={[styles.circle, { backgroundColor: stepColor, borderColor: stepColor }]}>
                    {isDone ? (
                        <Ionicons name="checkmark" size={18} color="#FFF" />
                    ) : isLocked ? (
                        <Ionicons name="lock-closed" size={16} color="#FFF" />
                    ) : (
                        <AppText style={styles.circleText}>{String(step.step)}</AppText>
                    )}
                </View>

                <View style={styles.headerText}>
                    <AppText
                        variant="label"
                        style={[styles.topicLabel, isLocked && { color: colors.silver }]}
                    >
                        {step.topic}
                    </AppText>
                    {step.suggested_courses.length > 0 && (
                        <AppText variant="caption">
                            {step.suggested_courses.length} course{step.suggested_courses.length !== 1 ? 's' : ''}
                        </AppText>
                    )}
                </View>

                <View style={styles.right}>
                    <Badge status={step.status} />
                    {!isLocked && (
                        <Ionicons
                            name={expanded ? 'chevron-up' : 'chevron-down'}
                            size={18}
                            color={colors.silver}
                            style={styles.chevron}
                        />
                    )}
                </View>
            </TouchableOpacity>

            {expanded && step.suggested_courses.length > 0 && (
                <View style={styles.coursesContainer}>
                    {step.suggested_courses.map((course) => (
                        <CourseCard
                            key={course.course_id}
                            course={course}
                            onMarkDone={handleMarkDone}
                            isLoading={loadingCourseId === course.course_id}
                        />
                    ))}
                </View>
            )}

            {expanded && step.suggested_courses.length === 0 && (
                <View style={[styles.emptyCourses, { backgroundColor: colors.light }]}>
                    <Ionicons name="rocket-outline" size={20} color={colors.silver} style={{ marginBottom: 4 }} />
                    <AppText variant="caption" align="center">
                        Courses will unlock as you progress
                    </AppText>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        marginBottom: Spacing.sm,
        borderRadius: Radius.lg,
        borderWidth: 1,
        overflow: 'hidden',
        ...Shadow.sm,
    },
    wrapperLocked: { opacity: 0.65 },
    connectorLine: { height: 3, width: '100%' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
        gap: Spacing.md,
    },
    circle: {
        width: 38, height: 38, borderRadius: 19, borderWidth: 2,
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    circleText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold as '700', color: '#FFFFFF' },
    headerText: { flex: 1 },
    topicLabel: { fontSize: FontSize.md, marginBottom: 2 },
    right: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    chevron: { marginLeft: 4 },
    coursesContainer: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
    emptyCourses: { paddingVertical: Spacing.xl, paddingHorizontal: Spacing.lg, alignItems: 'center' },
});
