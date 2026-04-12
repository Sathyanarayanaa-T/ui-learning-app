import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../components/atoms/AppText';
import { WebContainer } from '../../components/layout/WebContainer';
import { Colors, Spacing, Radius, FontSize, Shadow } from '../../constants/theme';
import { useTutorStore } from '../../store/useTutorStore';
import { useColors } from '../../hooks/useColors';
import { useAppStore } from '../../store/useAppStore';
import { useRouter } from 'expo-router';

export default function HistoryScreen() {
    const { sessions, loadSessions, removeSession, restoreSession } = useTutorStore();
    const colors = useColors();
    const { isDark } = useAppStore();
    const router = useRouter();
    
    // For local filtering logic
    const [activeFilter, setActiveFilter] = useState<string>('All');
    
    useEffect(() => {
        loadSessions();
    }, []);

    const FILTERS = ['All', 'Resolve', 'Mastery', 'Navigate'];
    const MODE_MAPPING: Record<string, string> = {
        'Resolve': 'normal',
        'Mastery': 'teaching',
        'Navigate': 'guiding'
    };
    
    const ICON_MAPPING: Record<string, keyof typeof Ionicons.glyphMap> = {
        'normal': 'chatbubbles-outline',
        'teaching': 'school-outline',
        'guiding': 'compass-outline'
    };

    const filteredSessions = sessions.filter(s => {
        if (activeFilter === 'All') return true;
        const targetMode = MODE_MAPPING[activeFilter];
        return (s.mode || 'normal') === targetMode;
    });

    const renderItem = ({ item }: { item: any }) => {
        const mode = item.mode || 'normal';
        const iconName = ICON_MAPPING[mode] || 'chatbubbles-outline';
        
        return (
            <TouchableOpacity 
                activeOpacity={0.8}
                onPress={async () => {
                    await restoreSession(item);
                    router.push('/(tabs)/tutor');
                }}
                style={[styles.historyItem, { backgroundColor: colors.snow, borderColor: colors.borderLight }]}
            >
                <View style={styles.historyItemBody}>
                    <AppText variant="label" style={[styles.historyTitle, { color: colors.black }]} numberOfLines={1}>{item.title}</AppText>
                    <View style={styles.subtitleRow}>
                        <Ionicons name={iconName} size={14} color={colors.silver} style={styles.subtitleIcon} />
                        
                        <Ionicons name="chatbubble-ellipses-outline" size={14} color={colors.silver} style={[styles.subtitleIcon, { marginLeft: Spacing.sm }]} />
                        <AppText variant="caption" style={styles.subtitleText}>{item.messageCount || 0}</AppText>
                        
                        <Ionicons name="calendar-outline" size={14} color={colors.silver} style={[styles.subtitleIcon, { marginLeft: Spacing.sm }]} />
                        <AppText variant="caption" style={styles.subtitleText}>{new Date(item.createdAt).toLocaleDateString()}</AppText>
                    </View>
                </View>
                <TouchableOpacity
                    onPress={() => removeSession(item.session_id)}
                    style={styles.deleteBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="close" size={20} color={colors.silver} />
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.root, { backgroundColor: colors.light }]}>
            <SafeAreaView edges={['top']} style={{ backgroundColor: colors.light, paddingTop: Spacing.md }}>
                <WebContainer>
                    <View style={styles.header}>
                        <AppText style={[styles.headerText, { color: isDark ? Colors.snow : Colors.darkBlue }]}>RECENT ACTIVITY</AppText>
                    </View>
                    
                    <View style={styles.filterContainer}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                            {FILTERS.map(filter => {
                                const isActive = activeFilter === filter;
                                return (
                                    <TouchableOpacity
                                        key={filter}
                                        onPress={() => setActiveFilter(filter)}
                                        style={[
                                            styles.filterChip,
                                            { backgroundColor: isActive ? (isDark ? Colors.silver : Colors.darkBlue) : colors.borderLight }
                                        ]}
                                    >
                                        <AppText style={[styles.filterChipText, { color: isActive ? (isDark ? Colors.darkBlue : Colors.snow) : colors.black }]}>
                                            {filter}
                                        </AppText>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                </WebContainer>
            </SafeAreaView>
            
            <View style={styles.listContainer}>
                <WebContainer>
                    <FlatList
                        data={filteredSessions}
                        keyExtractor={item => item.session_id}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={() => (
                            <View style={{ alignItems: 'center', marginTop: Spacing.xl }}>
                                <AppText style={{ color: colors.silver }}>No activity found.</AppText>
                            </View>
                        )}
                    />
                </WebContainer>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    header: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.sm,
    },
    headerText: {
        fontSize: FontSize.sm,
        fontWeight: 'bold',
        color: Colors.darkBlue,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
    },
    filterContainer: {
        paddingVertical: Spacing.sm,
    },
    filterScroll: {
        paddingHorizontal: Spacing.lg,
        gap: Spacing.sm,
    },
    filterChip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: 8,
        borderRadius: 20,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterChipText: {
        fontSize: FontSize.sm,
        fontWeight: '600',
    },
    listContainer: {
        flex: 1,
    },
    listContent: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.xl,
        paddingTop: Spacing.md,
        gap: Spacing.md,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        paddingLeft: Spacing.lg,
        paddingRight: Math.max(12, Spacing.lg), // Ensure at least 12px padding between the x icon and the right edge
        borderRadius: Radius.lg,
        borderWidth: 1,
        ...Shadow.sm,
    },
    historyItemBody: {
        flex: 1,
    },
    historyTitle: {
        fontSize: FontSize.md,
        fontWeight: 'bold',
        marginBottom: 6,
        color: Colors.darkBlue,
    },
    subtitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    subtitleIcon: {
        marginRight: 4,
    },
    subtitleText: {
        color: Colors.silver,
        fontWeight: '600',
        fontSize: FontSize.xs,
    },
    deleteBtn: {
        paddingLeft: Spacing.md,
    }
});
