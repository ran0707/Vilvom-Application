import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { PublicFeedback } from '../services/feedbackApi';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.78;

interface Props {
  item: PublicFeedback;
}

const AVATAR_COLORS = [
  '#2E7D32', '#1565C0', '#6A1B9A', '#C62828', '#E65100', '#00695C',
];

const initials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

const avatarColor = (name: string) =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const FeedbackCard: React.FC<Props> = ({ item }) => (
  <View style={styles.card}>
    {/* Quote decoration */}
    <MaterialCommunityIcons
      name="format-quote-open"
      size={32}
      color="#E8F5E9"
      style={styles.quoteIcon}
    />

    {/* Stars */}
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((s) => (
        <MaterialCommunityIcons
          key={s}
          name={s <= item.rating ? 'star' : 'star-outline'}
          size={18}
          color={s <= item.rating ? '#FFB300' : '#DDD'}
        />
      ))}
    </View>

    {/* Feedback text */}
    <Text style={styles.feedback} numberOfLines={4}>
      {item.feedback}
    </Text>

    {/* Divider */}
    <View style={styles.divider} />

    {/* Profile row */}
    <View style={styles.profileRow}>
      <View style={[styles.avatar, { backgroundColor: avatarColor(item.name) }]}>
        <Text style={styles.avatarText}>{initials(item.name)}</Text>
      </View>
      <View style={styles.meta}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        {item.location ? (
          <View style={styles.locRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={12} color="#888" />
            <Text style={styles.location} numberOfLines={1}>{item.location}</Text>
          </View>
        ) : null}
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginRight: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  quoteIcon: {
    position: 'absolute',
    top: 12,
    right: 14,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: 12,
  },
  feedback: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
    flex: 0,
    marginBottom: 16,
    minHeight: 66,
  },
  divider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginBottom: 14,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  meta: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },
  location: { fontSize: 12, color: '#888', flex: 1 },
});

export default FeedbackCard;
