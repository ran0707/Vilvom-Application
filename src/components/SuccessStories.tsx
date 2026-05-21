import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

const sampleStats = {
    farmers: 84,
    hectaresSaved: 120,
    costSavedPercent: 32,
};

const SuccessStories = () => {
    const { t } = useTranslation();
    return (
        <View style={styles.container}>
            <Text style={styles.heading}>{t('home.success_stories')}</Text>

            <View style={styles.statsRow}>
                <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{sampleStats.farmers}+</Text>
                    <Text style={styles.statLabel}>{t('home.farmers_helped')}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{sampleStats.hectaresSaved}</Text>
                    <Text style={styles.statLabel}>{t('home.hectares_protected')}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{sampleStats.costSavedPercent}%</Text>
                    <Text style={styles.statLabel}>{t('home.avg_cost_savings')}</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        marginBottom: 16,
        backgroundColor: '#F1F8F1',
        borderRadius: 16,
        padding: 20,
    },
    heading: { fontSize: 15, fontWeight: '700', marginBottom: 16, color: '#1B5E20' },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statBox: { alignItems: 'center', flex: 1 },
    statNumber: { fontSize: 22, fontWeight: '800', color: '#2E7D32' },
    statLabel: { color: '#555', fontSize: 11, marginTop: 2, textAlign: 'center' },
    divider: { width: 1, height: 36, backgroundColor: '#C8E6C9' },
});

export default SuccessStories;
