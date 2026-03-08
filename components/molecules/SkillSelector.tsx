import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Chip } from '../atoms/Chip';
import { AppText } from '../atoms/AppText';
import { SKILLS } from '../../types';
import { Colors, Spacing } from '../../constants/theme';

interface SkillSelectorProps {
    selected: string[];
    onToggle: (skill: string) => void;
}

export const SkillSelector: React.FC<SkillSelectorProps> = ({ selected, onToggle }) => {
    return (
        <View>
            <View style={styles.header}>
                <AppText variant="label">Current Skills</AppText>
                <AppText variant="caption">{selected.length} selected</AppText>
            </View>
            <View style={styles.chips}>
                {SKILLS.map((skill) => (
                    <Chip
                        key={skill}
                        label={skill}
                        selected={selected.includes(skill)}
                        onPress={() => onToggle(skill)}
                    />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    chips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
});
