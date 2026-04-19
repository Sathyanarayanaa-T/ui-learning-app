import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface HomeCourseCardProps {
    category: string;
    title: string;
    price: string;
    rating: string;
    studentCount: string;
    imageUrl?: string;
}

export function HomeCourseCard({ category, title, price, rating, studentCount, imageUrl }: HomeCourseCardProps) {
    const [isBookmarked, setIsBookmarked] = useState(false);

    return (
        <View style={styles.card}>
            <View style={styles.imagePlaceholder}>
                <TouchableOpacity
                    style={styles.bookmarkButton}
                    onPress={() => setIsBookmarked(!isBookmarked)}
                >
                    <Ionicons
                        name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                        size={16}
                        color={isBookmarked ? '#3D3BF3' : '#888888'}
                    />
                </TouchableOpacity>
            </View>
            <View style={styles.content}>
                <View style={styles.categoryPill}>
                    <Text style={styles.category}>{category}</Text>
                </View>
                <Text style={styles.title} numberOfLines={2}>
                    {title}
                </Text>
                <View style={styles.footer}>
                    <Text style={styles.price}>{price}</Text>
                    <Text style={styles.separator}>|</Text>
                    <Ionicons name="star" size={10} color="#FFD700" style={{ marginRight: 2 }} />
                    <Text style={styles.rating}>{rating}</Text>
                    <Text style={styles.separator}>|</Text>
                    <Text style={styles.studentCount}>{studentCount}</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        flex: 1,
        marginBottom: 10,
        marginHorizontal: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    imagePlaceholder: {
        height: 100,
        backgroundColor: '#222',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        padding: 8,
        alignItems: 'flex-end',
    },
    bookmarkButton: {
        backgroundColor: '#FFFFFF',
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        padding: 10,
    },
    categoryPill: {
        alignSelf: 'flex-start',
        marginBottom: 6,
    },
    category: {
        color: '#E85D04', 
        fontSize: 9,
        fontWeight: 'bold',
    },
    title: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1B1F5E',
        marginBottom: 10,
        minHeight: 34,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    price: {
        color: '#3D3BF3',
        fontWeight: 'bold',
        fontSize: 11,
    },
    separator: {
        color: '#888888',
        marginHorizontal: 4,
        fontSize: 10,
    },
    rating: {
        color: '#111111',
        fontSize: 10,
        fontWeight: 'bold',
    },
    studentCount: {
        color: '#888888',
        fontSize: 9,
    },
});
