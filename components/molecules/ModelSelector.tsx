import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText } from '../atoms/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../hooks/useColors';
import { Radius, Spacing, FontSize, FontWeight } from '../../constants/theme';

type AIModel = string;

const MODEL_LABELS: Record<string, string> = {
    'openai': 'OpenAI GPT',
    'azure-openai': 'Azure OpenAI',
    'gemini': 'Gemini',
    'llama-local': 'Llama Local',
};

const MODEL_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
    'openai': 'hardware-chip-outline',
    'azure-openai': 'cloud-outline',
    'gemini': 'sparkles-outline',
    'llama-local': 'terminal-outline',
};

interface ModelSelectorProps {
    models: AIModel[];
    selected: AIModel;
    onSelect: (model: AIModel) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ models, selected, onSelect }) => {
    const colors = useColors();
    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {models.map((model) => {
                const active = model === selected;
                return (
                    <TouchableOpacity
                        key={model}
                        onPress={() => onSelect(model)}
                        activeOpacity={0.75}
                        style={[
                            styles.chip,
                            active
                                ? { backgroundColor: colors.hexawareBlue, borderColor: colors.hexawareBlue }
                                : { backgroundColor: colors.snow, borderColor: colors.borderLight },
                        ]}
                    >
                        <Ionicons name={MODEL_ICONS[model] as any} size={16} color={active ? '#FFF' : colors.darkBlue} />
                        <AppText style={[styles.label, { color: active ? '#FFF' : colors.darkBlue }]}>
                            {MODEL_LABELS[model]}
                        </AppText>
                    </TouchableOpacity>
                );
            })}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    row: { gap: Spacing.sm, paddingVertical: Spacing.xs },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: Radius.full,
        borderWidth: 1.5,
    },
    label: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold as '600' },
});
