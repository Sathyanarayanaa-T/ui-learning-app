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


export default function TabsLayout() {
    return (
        <View style={{ flex: 1 }}>
            <Tabs
                screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}
            >
                <Tabs.Screen name="tutor" />
            </Tabs>

        </View>
    );
}

const styles = StyleSheet.create({});
