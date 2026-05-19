import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Storage from '../utils/storage';
import { useTranslation } from 'react-i18next';

type TrackingEvent = { time: string; status: string; note?: string };

const OrderTrackingScreen: React.FC = () => {
  const navigation: any = useNavigation();
  const route: any = useRoute();
  const { orderId } = route.params || {};
  const { t } = useTranslation();
  const [title, setTitle] = useState<string>('');
  const [events, setEvents] = useState<TrackingEvent[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await Storage.getItem(`order_${orderId}_tracking`);
        if (raw) {
          const data = JSON.parse(raw);
          setTitle(data.title || `Order ${orderId}`);
          setEvents(data.events || []);
        }
      } catch {}
    })();
  }, [orderId]);

  return (
    <View style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Icon name="arrow-left" size={18} color="#0b3f2a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {title || (t('profile.order_tracking') as string)}
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        {events.length === 0 ? (
          <Text style={styles.muted}>
            {t('orders.tracking_empty') as string}
          </Text>
        ) : (
          events.map((e, idx) => (
            <View key={idx} style={styles.trackItem}>
              <View style={styles.dotCol}>
                <View style={styles.dot} />
                {idx < events.length - 1 && <View style={styles.vline} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.trackTitle}>{e.status}</Text>
                <Text style={styles.trackSub}>{e.time}</Text>
                {!!e.note && <Text style={styles.trackNote}>{e.note}</Text>}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

export default OrderTrackingScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f6fbf8' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: '#eaf6ef',
  },
  backBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    marginRight: 10,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0b1f12' },
  container: { padding: 16 },
  muted: { color: '#78909c' },
  trackItem: { flexDirection: 'row', marginBottom: 18 },
  dotCol: { width: 24, alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#0b6b3a' },
  vline: {
    width: 2,
    flex: 1,
    backgroundColor: 'rgba(11,107,58,0.3)',
    marginTop: 4,
  },
  trackTitle: { fontSize: 14, fontWeight: '700', color: '#0b3f2a' },
  trackSub: { fontSize: 12, color: '#607d8b', marginTop: 2 },
  trackNote: { fontSize: 12, color: '#37474f', marginTop: 4 },
});
