import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { AppText } from '../atoms/AppText';
import { AppButton } from '../atoms/AppButton';
import { SkillSelector } from '../molecules/SkillSelector';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, Radius, FontSize, FontWeight, Shadow } from '../../constants/theme';
import { useColors } from '../../hooks/useColors';
import { ROLES, type RoleOption } from '../../types';
import { useAppStore } from '../../store/useAppStore';

interface OnboardingFormProps {
    onComplete: () => void;
}

export const OnboardingForm: React.FC<OnboardingFormProps> = ({ onComplete }) => {
    const [step, setStep] = useState<1 | 2>(1);
    const [selectedRole, setSelectedRole] = useState<RoleOption | null>(null);
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
    const { fetchLearningPath, isLoadingPath, setUser } = useAppStore();
    const colors = useColors();

    const toggleSkill = (skill: string) => {
        setSelectedSkills((prev) =>
            prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
        );
    };

    const handleGenerate = async () => {
        if (!selectedRole) return;
        setUser({ userId: '', role: selectedRole.label, skills: selectedSkills });
        await fetchLearningPath(selectedRole.label, selectedSkills);
        onComplete();
    };


    return (
        <View style={styles.container}>
            {/* Step indicator */}
            <View style={styles.steps}>
                {[1, 2].map((n, i) => (
                    <React.Fragment key={n}>
                        {i > 0 && (
                            <View style={[styles.stepLine, step >= n && { backgroundColor: colors.brightBlue }]} />
                        )}
                        <View style={styles.stepItem}>
                            <View style={[styles.stepDot, step >= n && { backgroundColor: colors.brightBlue }]}>
                                <AppText style={styles.stepNum}>{n}</AppText>
                            </View>
                            <AppText style={[styles.stepLabel, step >= n && { color: colors.brightBlue, fontWeight: FontWeight.semibold as '600' }]}>
                                {n === 1 ? 'Role' : 'Skills'}
                            </AppText>
                        </View>
                    </React.Fragment>
                ))}
            </View>

            {/* Step 1: Role picker */}
            {step === 1 && (
                <View>
                    <AppText variant="title" style={styles.sectionTitle}>What's your role?</AppText>
                    <AppText variant="caption" style={styles.sectionSub}>
                        We'll tailor your learning path based on your role.
                    </AppText>
                    <View style={styles.rolesGrid}>
                        {ROLES.map((role) => {
                            const isSelected = selectedRole?.id === role.id;
                            return (
                                <TouchableOpacity
                                    key={role.id}
                                    onPress={() => setSelectedRole(role)}
                                    activeOpacity={0.8}
                                    style={[
                                        styles.roleCard,
                                        {
                                            backgroundColor: isSelected ? colors.hexawareBlue + '10' : colors.snow,
                                            borderColor: isSelected ? colors.hexawareBlue : colors.borderLight,
                                        },
                                        Shadow.sm,
                                    ]}
                                >
                                    <Ionicons name={role.icon as any} size={28} color={isSelected ? colors.hexawareBlue : colors.silver} style={{ marginBottom: 6 }} />
                                    <AppText style={[styles.roleLabel, { color: isSelected ? colors.hexawareBlue : colors.darkBlue }]}>
                                        {role.label}
                                    </AppText>
                                    <AppText style={[styles.roleDesc, { color: colors.silver }]}>{role.description}</AppText>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                    <AppButton
                        label="Next"
                        rightIcon={<Ionicons name="arrow-forward" size={18} color={colors.snow} />}
                        onPress={() => setStep(2)}
                        variant="primary"
                        size="lg"
                        fullWidth
                        disabled={!selectedRole}
                    />
                </View>
            )}

            {/* Step 2: Skills */}
            {step === 2 && (
                <View>
                    <AppText variant="title" style={styles.sectionTitle}>What do you already know?</AppText>
                    <AppText variant="caption" style={styles.sectionSub}>
                        Select any skills you already have. We'll skip those in your path.
                    </AppText>
                    <SkillSelector selected={selectedSkills} onToggle={toggleSkill} />
                    <View style={styles.stepActions}>
                        <AppButton
                            label="Back"
                            icon={<Ionicons name="arrow-back" size={18} color={colors.brightBlue} />}
                            onPress={() => setStep(1)}
                            variant="ghost"
                            size="md"
                        />
                        <AppButton
                            label="Generate Path"
                            rightIcon={<Ionicons name="rocket-outline" size={18} color={colors.snow} />}
                            onPress={handleGenerate}
                            variant="primary"
                            size="md"
                            loading={isLoadingPath}
                            style={styles.generateBtn}
                        />
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { paddingBottom: Spacing['3xl'] },
    steps: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing['2xl'] },
    stepItem: { alignItems: 'center', gap: 4 },
    stepDot: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: '#CBD0E5',
        alignItems: 'center', justifyContent: 'center',
    },
    stepNum: { fontSize: FontSize.sm, fontWeight: FontWeight.bold as '700', color: '#FFFFFF' },
    stepLine: { flex: 1, height: 2, backgroundColor: '#CBD0E5', marginHorizontal: Spacing.sm, marginBottom: 14 },
    stepLabel: { fontSize: FontSize.xs, color: '#8088A7' },
    sectionTitle: { marginBottom: 4 },
    sectionSub: { marginBottom: Spacing.xl },
    rolesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.xl },
    roleCard: {
        width: '47%', borderWidth: 1.5, borderRadius: Radius.lg, padding: Spacing.md,
    },
    roleLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold as '600', marginBottom: 2 },
    roleDesc: { fontSize: FontSize.xs },
    stepActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.xl, gap: Spacing.md },
    generateBtn: { flex: 1 },
});
