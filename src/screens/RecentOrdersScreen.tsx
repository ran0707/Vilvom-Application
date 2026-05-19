import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import * as Storage from '../utils/storage';

type Order = {
  id: string;
  title: string;
  date: string;
  total?: number;
  status?: string;
};

const RecentOrdersScreen: React.FC = () => {
  const navigation: any = useNavigation();
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await Storage.getItem('recent_orders');
        if (raw) setOrders(JSON.parse(raw));
      } catch {}
      setLoading(false);
    })();
  }, []);

  return (
    <View style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Icon name="arrow-left" size={18} color="#0b3f2a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.recent_orders')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {loading ? (
          <Text style={styles.muted}>{t('common.loading') as string}</Text>
        ) : orders.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Icon name="shopping-bag" size={42} color="#9e9e9e" />
            <Text style={styles.emptyTitle}>{t('profile.recent_orders')}</Text>
            <Text style={styles.emptySub}>{t('orders.empty') as string}</Text>
            <TouchableOpacity
              style={styles.cta}
              onPress={() =>
                navigation.navigate('MainTabs', { screen: 'PesticideHub' })
              }
            >
              <Text style={styles.ctaText}>
                {t('orders.shop_cta') as string}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          orders.map(o => (
            <TouchableOpacity
              key={o.id}
              style={styles.orderItem}
              onPress={() =>
                navigation.navigate('OrderTracking', { orderId: o.id })
              }
            >
              <View style={styles.orderIconWrap}>
                <Icon name="receipt" size={18} color="#0b6b3a" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.orderTitle}>{o.title}</Text>
                <Text style={styles.orderSub}>{o.date}</Text>
              </View>
              <Icon name="chevron-right" size={16} color="#78909c" />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

export default RecentOrdersScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f6fbf8' },
  container: { padding: 16 },
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
  muted: { color: '#78909c' },
  emptyWrap: { alignItems: 'center', marginTop: 40 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#263238',
    marginTop: 10,
  },
  emptySub: { color: '#78909c', marginTop: 6 },
  cta: {
    marginTop: 12,
    backgroundColor: '#0b6b3a',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  ctaText: { color: '#fff', fontWeight: '700' },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    elevation: 1,
  },
  orderIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(11,107,58,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  orderTitle: { fontSize: 14, fontWeight: '700', color: '#0b3f2a' },
  orderSub: { fontSize: 12, color: '#607d8b', marginTop: 2 },
});
