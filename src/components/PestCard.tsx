import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { DEFAULT_HOST } from '../config/api';

type Props = {
  item: any;
  onPress?: () => void;
};

const PestCard: React.FC<Props> = ({ item, onPress }) => {
  const imgRaw = item.imagePath ? `${item.imagePath}` : null;
  let img = imgRaw;
  if (imgRaw && imgRaw.startsWith('/')) {
    img = `${DEFAULT_HOST}${imgRaw}`;
  }
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.left}>
        {img ? (
          <Image source={{ uri: img }} style={styles.image} />
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
      <View style={styles.right}>
        <Text style={styles.title}>{item.pestName}</Text>
        <Text style={styles.subtitle}>
          {item.symptoms?.slice(0, 2).join(', ')}
        </Text>
        <Text style={styles.meta}>
          {new Date(item.createdAt).toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginRight: 12,
    elevation: 2,
    alignItems: 'center',
    width: 260,
  },
  left: { width: 80, height: 80 },
  right: { flex: 1, marginLeft: 10 },
  image: { width: 80, height: 80, borderRadius: 8, resizeMode: 'cover' },
  placeholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#e9e9e9',
  },
  title: { fontSize: 14, fontWeight: '700', color: '#222' },
  subtitle: { fontSize: 12, color: '#666', marginTop: 6 },
  meta: { fontSize: 11, color: '#999', marginTop: 8 },
});

export default PestCard;
