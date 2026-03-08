import React from 'react';
import { View, StyleSheet, Platform, ViewStyle } from 'react-native';
import { Layout, Spacing } from '../../constants/theme';

interface WebContainerProps {
    children: React.ReactNode;
    style?: ViewStyle;
}

/**
 * On web, constrains content to a max-width centered dashboard layout.
 * On native, renders children directly inside a regular flex container.
 */
export const WebContainer: React.FC<WebContainerProps> = ({ children, style }) => {
    if (Platform.OS !== 'web') {
        return <View style={[styles.native, style]}>{children}</View>;
    }
    return (
        <View style={styles.webOuter}>
            <View style={[styles.webInner, style]}>{children}</View>
        </View>
    );
};

const styles = StyleSheet.create({
    native: {
        paddingHorizontal: Spacing.lg,
    },
    webOuter: {
        width: '100%',
        alignItems: 'center',
    },
    webInner: {
        width: '100%',
        maxWidth: Layout.webMaxWidth,
        paddingHorizontal: Spacing['2xl'],
    },
});
