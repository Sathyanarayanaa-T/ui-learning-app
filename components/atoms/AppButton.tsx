import React from 'react';
import {
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    ViewStyle,
    View,
    StyleProp,
} from 'react-native';
import { AppText } from './AppText';
import { Radius, Spacing, FontSize, FontWeight } from '../../constants/theme';
import { useColors } from '../../hooks/useColors';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface AppButtonProps {
    label: string;
    onPress: () => void;
    variant?: Variant;
    size?: Size;
    loading?: boolean;
    disabled?: boolean;
    fullWidth?: boolean;
    style?: StyleProp<ViewStyle>;
    icon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const AppButton: React.FC<AppButtonProps> = ({
    label,
    onPress,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    fullWidth = false,
    style,
    icon,
    rightIcon,
}) => {
    const colors = useColors();
    const isDisabled = disabled || loading;

    // ─── Dynamic background ───────────────────────────────────
    const bgColors: Record<Variant, string> = {
        primary: colors.brightBlue,
        secondary: 'transparent',
        ghost: 'transparent',
        danger: colors.error,
    };

    // ─── Dynamic border ───────────────────────────────────────
    const borders: Record<Variant, object> = {
        primary: {},
        secondary: { borderWidth: 1.5, borderColor: colors.brightBlue },
        ghost: {},
        danger: {},
    };

    // ─── Dynamic label color ──────────────────────────────────
    // Ghost and secondary use `brightBlue` (#1D86FF) — highly legible on both
    // light and dark backgrounds. Avoids the `hexawareBlue` (#3C2CDA) which
    // is too dark to read on dark card surfaces.
    const labelColors: Record<Variant, string> = {
        primary: colors.snow,           // white on blue bg — high contrast always
        secondary: colors.brightBlue,     // bright blue text on any bg
        ghost: colors.brightBlue,     // bright blue (NOT dark hexawareBlue)
        danger: colors.snow,           // white on red bg
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={isDisabled}
            activeOpacity={0.8}
            style={[
                styles.base,
                styles[`size_${size}`],
                { backgroundColor: bgColors[variant] },
                borders[variant],
                fullWidth && styles.fullWidth,
                isDisabled && styles.disabled,
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator
                    color={variant === 'primary' || variant === 'danger' ? colors.snow : colors.brightBlue}
                    size="small"
                />
            ) : (
                <View style={styles.inner}>
                    {icon && <View style={styles.iconWrap}>{icon}</View>}
                    <AppText
                        style={[
                            styles.label,
                            sizeLabel[size],
                            { color: labelColors[variant] },
                        ]}
                    >
                        {label}
                    </AppText>
                    {rightIcon && <View style={styles.rightIconWrap}>{rightIcon}</View>}
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    base: {
        borderRadius: Radius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    inner: { flexDirection: 'row', alignItems: 'center' },
    iconWrap: { marginRight: Spacing.sm },
    rightIconWrap: { marginLeft: Spacing.sm },
    size_sm: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2, minHeight: 34 },
    size_md: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, minHeight: 44 },
    size_lg: { paddingHorizontal: Spacing['2xl'], paddingVertical: Spacing.lg, minHeight: 52 },
    fullWidth: { width: '100%' },
    disabled: { opacity: 0.45 },
    label: { fontWeight: FontWeight.semibold as '600' },
});

const sizeLabel = StyleSheet.create({
    sm: { fontSize: FontSize.sm },
    md: { fontSize: FontSize.md },
    lg: { fontSize: FontSize.lg },
});
