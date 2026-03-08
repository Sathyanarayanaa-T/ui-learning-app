import React from 'react';
import { View, StyleSheet, Platform, StyleProp, ViewStyle } from 'react-native';
import { Radius, Shadow, Spacing } from '../../constants/theme';
import { Layout } from '../../constants/theme';
import { useColors } from '../../hooks/useColors';

interface CardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    webMaxWidth?: boolean;
    variant?: 'default' | 'elevated' | 'outlined';
    padding?: number;
}

export const Card: React.FC<CardProps> = ({
    children, style, webMaxWidth = false, variant = 'default', padding = Spacing.lg,
}) => {
    const colors = useColors();

    const variantStyle: ViewStyle =
        variant === 'elevated'
            ? { ...Shadow.md }
            : variant === 'outlined'
                ? { borderWidth: 1.5, borderColor: colors.hexawareBlue }
                : { borderWidth: 1, borderColor: colors.borderLight, ...Shadow.sm };

    return (
        <View
            style={[
                styles.base,
                { backgroundColor: colors.snow, padding },
                variantStyle,
                webMaxWidth && Platform.OS === 'web' && styles.webConstrained,
                style,
            ]}
        >
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    base: {
        borderRadius: Radius.lg,
        overflow: 'hidden',
    },
    webConstrained: {
        maxWidth: Layout.webMaxWidth,
        width: '100%',
        alignSelf: 'center',
    },
});
