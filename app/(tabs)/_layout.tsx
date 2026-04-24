import React from 'react';
import { Tabs } from 'expo-router';
import {
    View, StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../store/useAppStore';

export default function TabsLayout() {
    const isDark = useAppStore((s) => s.isDark);
    
    return (
        <View style={{ flex: 1 }}>
            <Tabs
                initialRouteName="index"
                screenOptions={{ 
                    headerShown: false,
                    tabBarStyle: {
                        backgroundColor: '#FFFFFF',
                        height: 62,
                        borderTopWidth: 1,
                        borderTopColor: '#E5E7EB',
                        elevation: 0,
                    },
                    tabBarActiveTintColor: '#4F46E5',
                    tabBarInactiveTintColor: '#9CA3AF',
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
                        tabBarIcon: ({ color }) => (
                            <Ionicons name="home" size={24} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen 
                    name="chatbot" 
                    options={{
                        title: 'Search',
                        tabBarIcon: ({ color }) => (
                            <Ionicons name="search" size={24} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen 
                    name="tutor" 
                    options={{
                        title: 'Courses',
                        tabBarIcon: ({ color }) => (
                            <Ionicons name="book" size={24} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen 
                    name="history" 
                    options={{
                        title: 'Achievements',
                        tabBarIcon: ({ color }) => (
                            <Ionicons name="trophy" size={24} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen 
                    name="profile" 
                    options={{
                        title: 'Profile',
                        tabBarIcon: ({ color }) => (
                            <Ionicons name="person" size={24} color={color} />
                        ),
                    }}
                />
            </Tabs>
        </View>
    );
}

const styles = StyleSheet.create({});
