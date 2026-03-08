import React from 'react';
import { Text, StyleSheet, StyleProp, TextStyle } from 'react-native';
import { FontSize, FontWeight } from '../../constants/theme';
import { useColors } from '../../hooks/useColors';

type Variant = 'heading' | 'subheading' | 'title' | 'body' | 'caption' | 'label' | 'overline';
type Align = 'left' | 'center' | 'right';

interface AppTextProps {
    children: React.ReactNode;
    variant?: Variant;
    color?: string;
    align?: Align;
    numberOfLines?: number;
    style?: StyleProp<TextStyle>;
}

export const AppText: React.FC<AppTextProps> = ({
    children, variant = 'body', color, align = 'left', numberOfLines, style,
}) => {
    const colors = useColors();

    const defaultColors: Record<Variant, string> = {
        heading: colors.darkBlue,
        subheading: colors.darkBlue,
        title: colors.darkBlue,
        body: colors.black,
        caption: colors.silver,
        label: colors.darkBlue,
        overline: colors.silver,
    };

    return (
        <Text
            style={[styles[variant], { color: color ?? defaultColors[variant], textAlign: align }, style]}
            numberOfLines={numberOfLines}
        >
            {children}
        </Text>
    );
};

const styles = StyleSheet.create({
    heading: { fontSize: FontSize['3xl'], fontWeight: FontWeight.extrabold, lineHeight: FontSize['3xl'] * 1.25 },
    subheading: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, lineHeight: FontSize['2xl'] * 1.3 },
    title: { fontSize: FontSize.xl, fontWeight: FontWeight.semibold, lineHeight: FontSize.xl * 1.4 },
    body: { fontSize: FontSize.md, fontWeight: FontWeight.regular, lineHeight: FontSize.md * 1.6 },
    caption: { fontSize: FontSize.sm, fontWeight: FontWeight.regular, lineHeight: FontSize.sm * 1.5 },
    label: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, lineHeight: FontSize.sm * 1.4 },
    overline: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, lineHeight: FontSize.xs * 1.5, letterSpacing: 1, textTransform: 'uppercase' },
});
