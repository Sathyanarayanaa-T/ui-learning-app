import React from 'react';
import { Tabs } from 'expo-router';
import {
    View, TouchableOpacity, StyleSheet, Platform, Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useAppStore } from '../../store/useAppStore';
import { useColors } from '../../hooks/useColors';
import { Colors, Shadow, FontSize, FontWeight } from '../../constants/theme';
import { GlobalMockBanner } from '../../components/molecules/GlobalMockBanner';

const TABS: Record<string, { icon: keyof typeof Ionicons.glyphMap; label: string }> = {
    roadmap: { icon: 'map-outline', label: 'Roadmap' },
    history: { icon: 'book-outline', label: 'History' },
    tutor: { icon: 'chatbubbles-outline', label: 'AI Tutor' },
};

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const { isDark, toggleTheme } = useAppStore();
    const colors = useColors();

    return (
        <View style={[styles.tabBar, {
            backgroundColor: colors.snow,
            borderTopColor: colors.borderLight,
        }]}>
            {state.routes.map((route, index) => {
                const isFocused = state.index === index;
                const tab = TABS[route.name] ?? { icon: 'ellipse-outline', label: route.name };

                const onPress = () => {
                    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                    if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
                };

                return (
                    <TouchableOpacity
                        key={route.key}
                        onPress={onPress}
                        activeOpacity={0.75}
                        style={[styles.tabItem, isFocused && { backgroundColor: colors.hexawareBlue + '15' }]}
                    >
                        <Ionicons name={tab.icon} size={22} color={isFocused ? colors.hexawareBlue : colors.silver} />
                        <Text style={[
                            styles.tabLabel,
                            { color: isFocused ? colors.hexawareBlue : colors.silver },
                            isFocused && styles.tabLabelActive,
                        ]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}

            {/* ── Theme toggle ─── */}
            <TouchableOpacity
                onPress={toggleTheme}
                activeOpacity={0.8}
                style={[styles.themeBtn, { backgroundColor: isDark ? Colors.canary + '30' : Colors.hexawareBlue + '12' }]}
            >
                <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={18} color={isDark ? Colors.canary : colors.hexawareBlue} />
                <Text style={[styles.themeLabel, { color: isDark ? Colors.canary : colors.hexawareBlue }]}>
                    {isDark ? 'Light' : 'Dark'}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

export default function TabsLayout() {
    return (
        <View style={{ flex: 1 }}>
            <Tabs
                screenOptions={{ headerShown: false }}
                tabBar={(props) => <CustomTabBar {...props} />}
            >
                <Tabs.Screen name="roadmap" />
                <Tabs.Screen name="history" />
                <Tabs.Screen name="tutor" />
            </Tabs>
            {/* Banner sits above all tab content, slides in from top */}
            <GlobalMockBanner />
        </View>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        paddingBottom: Platform.OS === 'ios' ? 20 : 8,
        paddingTop: 8,
        paddingHorizontal: 4,
        minHeight: 65,
        ...Shadow.sm,
    },
    tabItem: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
        paddingVertical: 5, borderRadius: 10, gap: 2,
    },
    tabLabel: { fontSize: 10, marginTop: 2 },
    tabLabelActive: { fontWeight: FontWeight.semibold as '600' },
    themeBtn: {
        alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: 10, paddingVertical: 7,
        borderRadius: 18, gap: 2, minWidth: 52,
    },
    themeLabel: { fontSize: 9, fontWeight: FontWeight.semibold as '600' },
});
