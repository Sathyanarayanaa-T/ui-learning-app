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
    const colors = useColors();
    const isDark = useAppStore((s) => s.isDark);
    
    return (
        <View style={{ flex: 1 }}>
            <Tabs
                initialRouteName="index"
                screenOptions={{ 
                    headerShown: false,
                    tabBarStyle: {
                        backgroundColor: isDark ? colors.white : Colors.darkBlue,
                        height: 62,
                        borderTopWidth: 1,
                        borderTopColor: isDark ? colors.borderLight : 'transparent',
                        elevation: 0,
                    },
                    tabBarActiveTintColor: '#FFFFFF',
                    tabBarInactiveTintColor: '#FFFFFF55',
                    tabBarLabelStyle: {
                        fontSize: 11,
                        fontWeight: '500',
                        marginBottom: 4,
                    },
                    tabBarIconStyle: {
                        marginTop: 4,
                    }
                }}
            >
                <Tabs.Screen 
                    name="index" 
                    options={{
                        title: 'Home',
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="home" size={24} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen 
                    name="chatbot" 
                    options={{
                        title: 'HexaLearn',
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="chatbubble-ellipses" size={24} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen 
                    name="tutor" 
                    options={{
                        title: 'TutorX',
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="bulb" size={24} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen 
                    name="history" 
                    options={{
                        href: null,
                    }}
                />
            </Tabs>
        </View>
    );
}

const styles = StyleSheet.create({});
