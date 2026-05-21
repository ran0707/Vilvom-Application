import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BarChart } from 'react-native-chart-kit';
import { useNavigation } from '@react-navigation/native';
import { API_BASE_URL } from '../../config/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 48;

interface DashboardStats {
  totals: {
    users: number;
    pestScans: number;
    droneRequests: number;
    sprayLogs: number;
    pendingDrone: number;
    completedDrone: number;
  };
  monthlyUsers: Array<{ label: string; count: number }>;
  droneStatusBreakdown: Array<{ status: string; count: number }>;
  recentUsers: Array<{ name: string; phone: string; joinedAt: string }>;
}

async function fetchStats(): Promise<DashboardStats> {
  const token = await AsyncStorage.getItem('authToken');
  const res = await fetch(`${API_BASE_URL}/admin/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to load stats');
  return data;
}

const STAT_CARDS = [
  { key: 'users',        label: 'Total Users',       icon: 'account-group-outline', color: '#1565C0', bg: '#E3F2FD' },
  { key: 'pestScans',    label: 'Pest Scans',        icon: 'magnify-scan',           color: '#6A1B9A', bg: '#F3E5F5' },
  { key: 'droneRequests',label: 'Drone Requests',    icon: 'quadcopter',             color: '#2E7D32', bg: '#E8F5E9' },
  { key: 'sprayLogs',    label: 'Spray Logs',        icon: 'water-outline',          color: '#E65100', bg: '#FFF3E0' },
  { key: 'pendingDrone', label: 'Pending Bookings',  icon: 'clock-outline',          color: '#F57F17', bg: '#FFFDE7' },
  { key: 'completedDrone',label: 'Completed Jobs',   icon: 'check-circle-outline',   color: '#00695C', bg: '#E0F2F1' },
];

const STATUS_COLORS: Record<string, string> = {
  pending:   '#F57F17',
  confirmed: '#1565C0',
  completed: '#2E7D32',
  cancelled: '#C62828',
};

export default function AdminDashboard() {
  const navigation = useNavigation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove(['authToken', 'userData']);
          (navigation as any).replace('Login');
        },
      },
    ]);
  };

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      const data = await fetchStats();
      setStats(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Loading dashboard…</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#C62828" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!stats) return null;

  const monthlyLabels  = stats.monthlyUsers.map(m => m.label.slice(5));  // "01" from "2026-01"
  const monthlyData    = stats.monthlyUsers.map(m => m.count);
  const hasMonthly     = monthlyData.some(v => v > 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Text style={styles.headerSub}>Vilvom Platform Overview</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <MaterialCommunityIcons name="logout" size={16} color="#C62828" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2E7D32']} />}
      >
        {/* Stat Cards */}
        <Text style={styles.sectionTitle}>Platform Metrics</Text>
        <View style={styles.cardsGrid}>
          {STAT_CARDS.map(card => (
            <View key={card.key} style={[styles.card, { backgroundColor: card.bg }]}>
              <View style={[styles.cardIcon, { backgroundColor: card.color + '20' }]}>
                <MaterialCommunityIcons name={card.icon as any} size={22} color={card.color} />
              </View>
              <Text style={[styles.cardValue, { color: card.color }]}>
                {(stats.totals as any)[card.key] ?? 0}
              </Text>
              <Text style={styles.cardLabel}>{card.label}</Text>
            </View>
          ))}
        </View>

        {/* Monthly Users Chart */}
        {hasMonthly && (
          <View style={styles.chartCard}>
            <Text style={styles.sectionTitle}>Monthly New Users (Last 6 Months)</Text>
            <BarChart
              data={{
                labels: monthlyLabels,
                datasets: [{ data: monthlyData.length ? monthlyData : [0] }],
              }}
              width={CHART_WIDTH}
              height={200}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={{
                backgroundGradientFrom: '#FFFFFF',
                backgroundGradientTo: '#FFFFFF',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
                labelColor: () => '#555',
                barPercentage: 0.6,
              }}
              style={{ borderRadius: 8 }}
              showValuesOnTopOfBars
              fromZero
            />
          </View>
        )}

        {/* Drone Status Breakdown */}
        {stats.droneStatusBreakdown.length > 0 && (
          <View style={styles.statusCard}>
            <Text style={styles.sectionTitle}>Drone Request Status</Text>
            {stats.droneStatusBreakdown.map(item => {
              const total = stats.totals.droneRequests || 1;
              const pct   = Math.round((item.count / total) * 100);
              const color = STATUS_COLORS[item.status] || '#757575';
              return (
                <View key={item.status} style={styles.statusRow}>
                  <View style={styles.statusLeft}>
                    <View style={[styles.statusDot, { backgroundColor: color }]} />
                    <Text style={styles.statusLabel}>{item.status.charAt(0).toUpperCase() + item.status.slice(1)}</Text>
                  </View>
                  <View style={styles.statusBarWrap}>
                    <View style={[styles.statusBar, { width: `${pct}%`, backgroundColor: color }]} />
                  </View>
                  <Text style={[styles.statusCount, { color }]}>{item.count}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Recent Users */}
        {stats.recentUsers.length > 0 && (
          <View style={styles.recentCard}>
            <Text style={styles.sectionTitle}>Recent Users</Text>
            {stats.recentUsers.map((u, i) => (
              <View key={i} style={[styles.recentRow, i < stats.recentUsers.length - 1 && styles.recentBorder]}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{(u.name?.[0] || 'U').toUpperCase()}</Text>
                </View>
                <View style={styles.recentInfo}>
                  <Text style={styles.recentName}>{u.name || 'Unknown'}</Text>
                  <Text style={styles.recentPhone}>{u.phone}</Text>
                </View>
                <Text style={styles.recentDate}>
                  {new Date(u.joinedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: '#F5F7F5' },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F7F5', gap: 12 },
  loadingText: { color: '#555', fontSize: 14, marginTop: 8 },
  errorText:   { color: '#C62828', fontSize: 14, textAlign: 'center', paddingHorizontal: 32, marginTop: 8 },
  retryBtn:    { marginTop: 12, backgroundColor: '#2E7D32', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryText:   { color: '#FFF', fontWeight: '600' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8F5E9',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1B5E20' },
  headerSub:   { fontSize: 12, color: '#757575', marginTop: 2 },
  logoutBtn:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF0F0', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, gap: 5, borderWidth: 1, borderColor: '#FFCDD2' },
  logoutText:  { color: '#C62828', fontSize: 13, fontWeight: '600' },

  scroll:      { padding: 16, paddingBottom: 32 },
  sectionTitle:{ fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 10, marginTop: 4 },

  cardsGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  card: {
    width: (SCREEN_WIDTH - 42) / 2,
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  cardIcon:    { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  cardValue:   { fontSize: 26, fontWeight: '800' },
  cardLabel:   { fontSize: 12, color: '#555', fontWeight: '500' },

  chartCard:   { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },

  statusCard:  { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
  statusRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  statusLeft:  { flexDirection: 'row', alignItems: 'center', width: 90, gap: 6 },
  statusDot:   { width: 10, height: 10, borderRadius: 5 },
  statusLabel: { fontSize: 13, color: '#333', fontWeight: '500' },
  statusBarWrap: { flex: 1, height: 8, backgroundColor: '#EEE', borderRadius: 4, overflow: 'hidden' },
  statusBar:   { height: 8, borderRadius: 4 },
  statusCount: { width: 28, textAlign: 'right', fontSize: 13, fontWeight: '700' },

  recentCard:  { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
  recentRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  recentBorder:{ borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  avatarCircle:{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center' },
  avatarText:  { fontSize: 16, fontWeight: '700', color: '#2E7D32' },
  recentInfo:  { flex: 1 },
  recentName:  { fontSize: 14, fontWeight: '600', color: '#222' },
  recentPhone: { fontSize: 12, color: '#757575', marginTop: 2 },
  recentDate:  { fontSize: 12, color: '#9E9E9E' },
});
