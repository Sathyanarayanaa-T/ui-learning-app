import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, FlatList, NativeSyntheticEvent, NativeScrollEvent, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PromoBanner } from '../../components/molecules/PromoBanner';
import { HomeCourseCard } from '../../components/molecules/HomeCourseCard';
import { MentorCard } from '../../components/molecules/MentorCard';
import { BANNERS, CATEGORIES, COURSES, MENTORS } from '../../constants/mockData';
import { useTutorStore } from '../../store/useTutorStore';
import { useAppStore } from '../../store/useAppStore';
import { useColors } from '../../hooks/useColors';
import { Colors } from '../../constants/theme';

export default function HomeScreen() {
    const [activeBannerIndex, setActiveBannerIndex] = useState(0);
    const { sessions } = useTutorStore(); // Read-only access to see if there is recent activity
    const isDark = useAppStore((s) => s.isDark);
    const colors = useColors();

    const handleBannerScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const slideSize = event.nativeEvent.layoutMeasurement.width;
        const index = event.nativeEvent.contentOffset.x / slideSize;
        setActiveBannerIndex(Math.round(index));
    };

    const hasSessions = sessions && sessions.length > 0;
    const mostRecentSession = hasSessions ? sessions[0] : null;

    return (
        <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.light }]}>
            <ScrollView 
                style={styles.container} 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header Row */}
                <View style={styles.header}>
                    <View style={styles.headerTextContainer}>
                        <Text style={[styles.greeting, { color: colors.black }]}>Hi, Ronald A. Martin</Text>
                        <Text style={[styles.subtitle, { color: colors.silver }]}>What Would you like to learn Today? Search Below.</Text>
                    </View>
                    <TouchableOpacity style={[styles.profileBtn, { backgroundColor: colors.snow, borderColor: colors.hexawareBlue }]}>
                        <Ionicons name="notifications-outline" size={24} color={colors.black} />
                        <View style={styles.notificationBadge} />
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <View style={[styles.searchInputContainer, { backgroundColor: colors.white }]}>
                        <Ionicons name="search" size={20} color={colors.silver} style={styles.searchIcon} />
                        <TextInput 
                            placeholder="Search for.."
                            placeholderTextColor={colors.silver}
                            style={[styles.searchInput, { color: colors.black }]}
                        />
                    </View>
                    <TouchableOpacity style={[styles.filterBtn, { backgroundColor: colors.hexawareBlue }]}>
                        <Ionicons name="options" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                {/* Promo Banner Carousel */}
                <View style={styles.carouselContainer}>
                    <FlatList
                        data={BANNERS}
                        keyExtractor={(item) => item.id}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={handleBannerScroll}
                        renderItem={({ item }) => (
                            <View style={styles.bannerWrapper}>
                                <PromoBanner {...item} />
                            </View>
                        )}
                    />
                    <View style={styles.pagination}>
                        {BANNERS.map((_, i) => (
                            <View 
                                key={i} 
                                style={[
                                    styles.dot, 
                                    activeBannerIndex === i ? styles.activeDot : styles.inactiveDot
                                ]} 
                            />
                        ))}
                    </View>
                </View>

                {/* Continue Where You Left (Conditional) */}
                {hasSessions && mostRecentSession && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.black }]}>Continue Where You Left</Text>
                        <TouchableOpacity style={[styles.continueCard, { backgroundColor: colors.snow }]}>
                            <View style={styles.continueThumb} />
                            <View style={styles.continueInfo}>
                                <Text style={styles.continueCategory}>{mostRecentSession.mode === 'teaching' ? 'Mastery' : 'Graphic Design'}</Text>
                                <Text style={[styles.continueTitle, { color: colors.black }]} numberOfLines={2}>
                                    {mostRecentSession.title || 'Untitled Session'}
                                </Text>
                            </View>
                            <TouchableOpacity style={styles.playBtn}>
                                <Ionicons name="play" size={16} color={colors.hexawareBlue} style={{ marginLeft: 2 }} />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Categories */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.black }]}>Categories</Text>
                        <TouchableOpacity>
                            <Text style={styles.seeAllText}>SEE ALL ›</Text>
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={CATEGORIES}
                        keyExtractor={(item) => item.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.horizontalListPad}
                        renderItem={({ item, index }) => (
                            <TouchableOpacity style={[
                                styles.pill, 
                                { backgroundColor: index === 1 ? colors.hexawareBlue : colors.white }
                            ]}>
                                <Text style={[
                                    styles.pillText, 
                                    { color: index === 1 ? '#FFFFFF' : colors.black }
                                ]}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>

                {/* Popular Courses */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.black }]}>Popular Courses</Text>
                        <TouchableOpacity>
                            <Text style={styles.seeAllText}>SEE ALL ›</Text>
                        </TouchableOpacity>
                    </View>
                    
                    <FlatList
                        data={[{ id: 'all', label: 'All' }, ...CATEGORIES]}
                        keyExtractor={(item) => item.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={[styles.horizontalListPad, { marginBottom: 16 }]}
                        renderItem={({ item, index }) => (
                            <TouchableOpacity style={[
                                styles.pill, 
                                { backgroundColor: index === 1 ? colors.hexawareBlue : colors.white }
                            ]}>
                                <Text style={[
                                    styles.pillText, 
                                    { color: index === 1 ? '#FFFFFF' : colors.black }
                                ]}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />

                    <View style={styles.gridContainer}>
                        {COURSES.map((course) => (
                            <View key={course.id} style={styles.gridItem}>
                                <HomeCourseCard {...course} />
                            </View>
                        ))}
                    </View>
                </View>

                {/* Top Mentor */}
                <View style={[styles.section, styles.lastSection]}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.black }]}>Top Mentor</Text>
                        <TouchableOpacity>
                            <Text style={styles.seeAllText}>SEE ALL ›</Text>
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={MENTORS}
                        keyExtractor={(item) => item.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.horizontalListPad}
                        renderItem={({ item }) => <MentorCard {...item} />}
                    />
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F8F8F8', // Using a light background
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 80, // Clear bottom tab bar
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
    },
    headerTextContainer: {
        flex: 1,
        paddingRight: 20,
    },
    greeting: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1B1F5E',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
        color: '#888888',
        lineHeight: 18,
    },
    profileBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        borderWidth: 1,
        borderColor: '#3D3BF3',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
    },
    notificationBadge: {
        position: 'absolute',
        top: 10,
        right: 12,
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#E85D04',
    },
    searchContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 20,
        gap: 12,
    },
    searchInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F2F2F2',
        borderRadius: 12,
        height: 45,
        paddingHorizontal: 16,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#111111',
    },
    filterBtn: {
        width: 45,
        height: 45,
        backgroundColor: '#3D3BF3',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    carouselContainer: {
        marginBottom: 24,
    },
    bannerWrapper: {
        width: 375, // Assuming typical screen width, will pad internally
        paddingHorizontal: 20,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        bottom: 16,
        width: '100%',
        gap: 6,
    },
    dot: {
        height: 6,
        borderRadius: 3,
    },
    activeDot: {
        width: 16,
        backgroundColor: '#FFFFFF',
    },
    inactiveDot: {
        width: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
    },
    section: {
        marginBottom: 24,
    },
    lastSection: {
        marginBottom: 40,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1B1F5E',
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    seeAllText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#3D3BF3',
    },
    horizontalListPad: {
        paddingHorizontal: 20,
        gap: 8,
    },
    pill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
    },
    activePill: {
        backgroundColor: '#3D3BF3',
    },
    inactivePill: {
        backgroundColor: '#F2F2F2',
    },
    pillText: {
        fontSize: 12,
        fontWeight: '600',
    },
    activePillText: {
        color: '#FFFFFF',
    },
    inactivePillText: {
        color: '#111111',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 15, // 5 less to account for card margin
    },
    gridItem: {
        width: '50%',
    },
    continueCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        marginHorizontal: 20,
        padding: 12,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    continueThumb: {
        width: 80,
        height: 60,
        backgroundColor: '#222',
        borderRadius: 8,
        marginRight: 12,
    },
    continueInfo: {
        flex: 1,
    },
    continueCategory: {
        color: '#E85D04',
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    continueTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1B1F5E',
    },
    playBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#3D3BF315',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 12,
    },
});
