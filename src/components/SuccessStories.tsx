import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

type Story = {
    id: string;
    name: string;
    location?: string;
    text: string;
    image?: string;
};

const sampleStats = {
    farmers: 84,
    hectaresSaved: 120,
    costSavedPercent: 32,
};

const testimonials: Story[] = [
    {
        id: '1',
        name: 'Ravi Kumar',
        location: 'Coimbatore, TN',
        text: 'Using the drone service reduced our labor and pesticide costs significantly. We saw immediate reduction in pest incidence.',
        image: 'https://randomuser.me/api/portraits/men/1.jpg',
    },
    {
        id: '2',
        name: 'Lakshmi',
        location: 'Nilgiris, TN',
        text: 'The spray recommendations and drone execution saved our crop at a critical time. Highly recommend!',
        image: 'https://randomuser.me/api/portraits/women/2.jpg',
    },
    {
        id: '3',
        name: 'M. Ramesh',
        location: 'Erode, TN',
        text: 'We reduced costs and increased yield after switching to targeted drone spraying suggested by the app.',
        image: 'https://randomuser.me/api/portraits/men/3.jpg',
    },
];

const SuccessStories = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Success Stories</Text>

            <View style={styles.statsRow}>
                <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{sampleStats.farmers}+</Text>
                    <Text style={styles.statLabel}>Farmers helped</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{sampleStats.hectaresSaved}</Text>
                    <Text style={styles.statLabel}>Hectares protected</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{sampleStats.costSavedPercent}%</Text>
                    <Text style={styles.statLabel}>Avg cost savings</Text>
                </View>
            </View>

            <Text style={styles.subheading}>What farmers say</Text>

            <FlatList
                data={testimonials}
                horizontal
                keyExtractor={i => i.id}
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <Image source={{ uri: item.image }} style={styles.avatar} />
                        <Text style={styles.name}>{item.name}</Text>
                        {item.location ? <Text style={styles.location}>{item.location}</Text> : null}
                        <Text style={styles.text} numberOfLines={3}>{item.text}</Text>
                    </View>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { padding: 16, backgroundColor: '#fff', marginBottom: 12 },
    heading: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: '#333' },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    statBox: { alignItems: 'center', flex: 1 },
    statNumber: { fontSize: 20, fontWeight: '800', color: '#4CAF50' },
    statLabel: { color: '#666', fontSize: 12 },
    subheading: { fontSize: 16, fontWeight: '700', marginBottom: 8, color: '#333' },
    card: { width: width * 0.6, backgroundColor: '#f9f9f9', padding: 12, borderRadius: 10, marginRight: 12, elevation: 2 },
    avatar: { width: 48, height: 48, borderRadius: 24, marginBottom: 8 },
    name: { fontWeight: '700', color: '#333' },
    location: { fontSize: 12, color: '#777', marginBottom: 6 },
    text: { color: '#444', marginTop: 6 },
});

export default SuccessStories;
