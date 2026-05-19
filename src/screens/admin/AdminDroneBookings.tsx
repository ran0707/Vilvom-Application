import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../config/api';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface DroneBooking {
  _id: string;
  phone: string;
  userName: string;
  serviceType: string;
  status: string;
  preferredDate?: string;
  preferredTime?: string;
  cropType?: string;
  area?: { location?: string; size?: number; unit?: string };
  additionalNotes?: string;
  urgency?: string;
  createdAt: string;
}

interface PaginatedResponse {
  requests: DroneBooking[];
  pagination: { total: number; page: number; pages: number; limit: number };
}

const STATUS_FILTERS = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];

const STATUS_META: Record<string, { color: string; bg: string; icon: string }> = {
  pending:   { color: '#F57F17', bg: '#FFFDE7', icon: 'clock-outline' },
  confirmed: { color: '#1565C0', bg: '#E3F2FD', icon: 'check-outline' },
  completed: { color: '#2E7D32', bg: '#E8F5E9', icon: 'check-circle-outline' },
  cancelled: { color: '#C62828', bg: '#FFEBEE', icon: 'close-circle-outline' },
};

const SERVICE_LABELS: Record<string, string> = {
  pesticide_spraying: 'Pesticide Spraying',
  field_monitoring:   'Field Monitoring',
  crop_mapping:       'Crop Mapping',
};

async function fetchBookings(page: number, status: string): Promise<PaginatedResponse> {
  const token = await AsyncStorage.getItem('authToken');
  const statusParam = status !== 'all' ? `&status=${status}` : '';
  const res = await fetch(`${API_BASE_URL}/admin/drone-bookings?page=${page}&limit=15${statusParam}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to load bookings');
  return data;
}

export default function AdminDroneBookings() {
  const [bookings, setBookings]     = useState<DroneBooking[]>([]);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]           = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading]       = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [search, setSearch]         = useState('');

  const load = useCallback(async (pg: number, status: string, reset: boolean) => {
    try {
      if (reset) setLoading(true);
      setError(null);
      const data = await fetchBookings(pg, status);
      setBookings(prev => reset ? data.requests : [...prev, ...data.requests]);
      setPage(data.pagination.page);
      setTotalPages(data.pagination.pages);
      setTotal(data.pagination.total);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    load(1, statusFilter, true);
  }, [statusFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    load(1, statusFilter, true);
  };

  const loadMore = () => {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    load(page + 1, statusFilter, false);
  };

  const filtered = search.trim()
    ? bookings.filter(b =>
        b.phone?.includes(search.trim()) ||
        b.userName?.toLowerCase().includes(search.trim().toLowerCase()),
      )
    : bookings;

  const renderBooking = ({ item }: { item: DroneBooking }) => {
    const meta   = STATUS_META[item.status] || { color: '#757575', bg: '#F5F5F5', icon: 'help-circle-outline' };
    const service = SERVICE_LABELS[item.serviceType] || item.serviceType;
    const date   = item.preferredDate
      ? new Date(item.preferredDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—';
    const booked = new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    return (
      <View style={styles.card}>
        {/* Top row: phone (primary) + status badge */}
        <View style={styles.cardTop}>
          <View style={styles.phoneRow}>
            <MaterialCommunityIcons name="phone-outline" size={16} color="#2E7D32" />
            <Text style={styles.phoneText}>{item.phone || '—'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
            <MaterialCommunityIcons name={meta.icon as any} size={13} color={meta.color} />
            <Text style={[styles.statusText, { color: meta.color }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>

        {/* User name */}
        <Text style={styles.userName}>{item.userName || 'Unknown User'}</Text>

        {/* Service + date */}
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="quadcopter" size={14} color="#555" />
          <Text style={styles.infoText}>{service}</Text>
        </View>
        {item.preferredDate && (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="calendar-outline" size={14} color="#555" />
            <Text style={styles.infoText}>{date}{item.preferredTime ? `  ·  ${item.preferredTime}` : ''}</Text>
          </View>
        )}
        {item.cropType && (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="leaf-outline" size={14} color="#555" />
            <Text style={styles.infoText}>{item.cropType}</Text>
          </View>
        )}
        {item.area?.location && (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={14} color="#555" />
            <Text style={styles.infoText}>{item.area.location}</Text>
          </View>
        )}
        {item.additionalNotes && (
          <Text style={styles.notes} numberOfLines={2}>{item.additionalNotes}</Text>
        )}

        <Text style={styles.bookedAt}>Booked {booked}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Drone Bookings</Text>
          <Text style={styles.headerSub}>{total} total request{total !== 1 ? 's' : ''}</Text>
        </View>
        <MaterialCommunityIcons name="quadcopter" size={28} color="#2E7D32" />
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <MaterialCommunityIcons name="magnify" size={18} color="#9E9E9E" style={{ marginLeft: 10 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by phone or name…"
          placeholderTextColor="#BDBDBD"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} style={{ paddingHorizontal: 10 }}>
            <MaterialCommunityIcons name="close" size={16} color="#9E9E9E" />
          </TouchableOpacity>
        )}
      </View>

      {/* Status filter chips */}
      <View style={styles.filterRow}>
        {STATUS_FILTERS.map(s => (
          <TouchableOpacity
            key={s}
            onPress={() => setStatusFilter(s)}
            style={[styles.chip, statusFilter === s && styles.chipActive]}
          >
            <Text style={[styles.chipText, statusFilter === s && styles.chipTextActive]}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Loading bookings…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#C62828" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load(1, statusFilter, true)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id}
          renderItem={renderBooking}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2E7D32']} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="quadcopter" size={56} color="#C8E6C9" />
              <Text style={styles.emptyTitle}>No bookings found</Text>
              <Text style={styles.emptyText}>
                {statusFilter !== 'all' ? `No ${statusFilter} bookings yet.` : 'No drone booking requests yet.'}
              </Text>
            </View>
          }
          ListFooterComponent={loadingMore ? <ActivityIndicator color="#2E7D32" style={{ marginVertical: 16 }} /> : null}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#F5F7F5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingBottom: 60 },

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

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 12,
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    height: 44,
  },
  searchInput: { flex: 1, paddingHorizontal: 8, fontSize: 14, color: '#222' },

  filterRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 6, marginBottom: 8, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#EEE',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  chipActive:     { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  chipText:       { fontSize: 12, color: '#555', fontWeight: '500' },
  chipTextActive: { color: '#FFF' },

  list: { padding: 12, paddingBottom: 32, gap: 10 },

  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  phoneRow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  phoneText:   { fontSize: 16, fontWeight: '700', color: '#1B5E20', letterSpacing: 0.3 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  statusText:  { fontSize: 11, fontWeight: '600' },
  userName:    { fontSize: 13, color: '#555', marginBottom: 8 },

  infoRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  infoText: { fontSize: 13, color: '#444' },
  notes:    { fontSize: 12, color: '#888', fontStyle: 'italic', marginTop: 4, lineHeight: 17 },
  bookedAt: { fontSize: 11, color: '#BDBDBD', marginTop: 8 },

  empty:      { paddingTop: 80, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#555' },
  emptyText:  { fontSize: 13, color: '#9E9E9E' },

  loadingText: { color: '#555', fontSize: 14 },
  errorText:   { color: '#C62828', fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
  retryBtn:    { backgroundColor: '#2E7D32', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryText:   { color: '#FFF', fontWeight: '600' },
});
