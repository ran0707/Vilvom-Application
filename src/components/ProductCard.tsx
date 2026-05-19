import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';

type Props = {
  item: {
    id: string;
    title: string;
    price: string;
    image: string;
    tag?: string;
    dealerName?: string;
    coords?: { lat: number; lon: number };
  };
  onPress?: () => void;
  userLocation?: { lat: number; lon: number } | null;
};

// Distance calculation function
function distanceInKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDLat = Math.sin(dLat / 2) * Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const h = sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

const ProductCard = ({ item, onPress, userLocation }: Props) => {
  const distance =
    userLocation && item.coords
      ? distanceInKm(userLocation, item.coords)
      : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <Image source={{ uri: item.image }} style={styles.image} />
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        {item.dealerName && (
          <Text style={styles.dealer} numberOfLines={1}>
            📍 {item.dealerName}
          </Text>
        )}
        <View style={styles.row}>
          <Text style={styles.price}>{item.price}</Text>
          {item.tag ? <Text style={styles.tag}>{item.tag}</Text> : null}
        </View>
        {distance !== null && (
          <View style={styles.distanceRow}>
            <Text style={styles.distance}>
              🚗{' '}
              {distance < 1
                ? `${Math.round(distance * 1000)}m`
                : `${distance.toFixed(1)}km`}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexBasis: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    marginHorizontal: '1%',
    elevation: 3,
  },
  image: { width: '100%', height: 110 },
  body: { padding: 10 },
  title: { fontSize: 14, fontWeight: '700', color: '#222' },
  dealer: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  price: { fontSize: 14, color: '#4CAF50', fontWeight: '800' },
  tag: {
    backgroundColor: '#E8F5E9',
    color: '#2E7D32',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 12,
  },
  distanceRow: {
    marginTop: 6,
    alignItems: 'flex-start',
  },
  distance: {
    fontSize: 11,
    color: '#FF9800',
    fontWeight: '600',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
});

export default ProductCard;
