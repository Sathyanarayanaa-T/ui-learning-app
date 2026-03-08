import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { AppText } from './AppText';
import { Radius, Spacing, FontSize, FontWeight } from '../../constants/theme';
import { useColors } from '../../hooks/useColors';

interface ChipProps {
    label: string;
    selected?: boolean;
    onPress?: () => void;
    style?: StyleProp<ViewStyle>;
}

export const Chip: React.FC<ChipProps> = ({ label, selected = false, onPress, style }) => {
    const colors = useColors();
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.75}
            style={[
                styles.chip,
                selected
                    ? { backgroundColor: colors.hexawareBlue, borderColor: colors.hexawareBlue }
                    : { backgroundColor: colors.snow, borderColor: colors.borderLight },
                style,
            ]}
        >
            <AppText
                style={[styles.label, { color: selected ? colors.snow : colors.darkBlue }]}
            >
                {selected ? '✓ ' : ''}{label}
            </AppText>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    chip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs + 2,
        borderRadius: Radius.full,
        marginRight: Spacing.sm,
        marginBottom: Spacing.sm,
        borderWidth: 1.5,
    },
    label: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium as '500',
    },
});
