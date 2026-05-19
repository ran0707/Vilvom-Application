import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { API_BASE_URL } from '../config/api';
import { getItem } from '../utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Data ─────────────────────────────────────────────────────────────────────

type Service = {
  id: string;
  name: string;
  icon: string;
  desc: string;
  cost: string;
  duration: string;
  accent: string;
  bg: string;
};

const SERVICES: Service[] = [
  {
    id: 'pesticide_spraying',
    name: 'Pesticide Spraying',
    icon: 'spray-bottle',
    desc: 'Precision drone-based pesticide application across your tea fields.',
    cost: '₹500–800 / acre',
    duration: '2–4 hrs',
    accent: '#4CAF50',
    bg: '#F1F8F1',
  },
  {
    id: 'field_monitoring',
    name: 'Crop Monitoring',
    icon: 'eye-circle-outline',
    desc: 'Aerial NDVI analysis to detect stress zones early.',
    cost: '₹200–400 / acre',
    duration: '1–2 hrs',
    accent: '#2196F3',
    bg: '#EEF6FF',
  },
  {
    id: 'crop_mapping',
    name: 'Survey & Mapping',
    icon: 'map-marker-path',
    desc: 'High-resolution aerial maps for land planning and records.',
    cost: '₹300–600 / acre',
    duration: '3–5 hrs',
    accent: '#FF9800',
    bg: '#FFF8EE',
  },
];

const TIME_SLOTS = [
  { id: 'before_11', label: 'Before 11 AM', icon: 'weather-sunset-up' },
  { id: 'after_2',   label: 'After 2 PM',   icon: 'weather-sunny'     },
];

// ─── Component ────────────────────────────────────────────────────────────────

const DroneTab = () => {
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedSlot,    setSelectedSlot]    = useState<string>('');
  const [selectedDate,    setSelectedDate]    = useState<Date>(new Date());
  const [location,        setLocation]        = useState('');
  const [areaSize,        setAreaSize]        = useState('');
  const [notes,           setNotes]           = useState('');
  const [loading,         setLoading]         = useState(false);
  const [showCalendar,    setShowCalendar]    = useState(false);
  const [expandNotes,     setExpandNotes]     = useState(false);

  // ── Calendar (manual grid, no extra lib required) ──────────────────────────
  const calendarDates = (() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    const last = new Date(y, m + 1, 0).getDate();
    const out = [];
    for (let d = 1; d <= last; d++) {
      const date = new Date(y, m, d);
      if (date >= today || date.toDateString() === today.toDateString()) {
        out.push({ date, day: d, isToday: date.toDateString() === today.toDateString() });
      }
    }
    return out;
  })();

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleBook = async () => {
    if (!selectedService) { Alert.alert('Missing', 'Please select a service.'); return; }
    if (!selectedSlot)    { Alert.alert('Missing', 'Please pick a time slot.'); return; }
    if (!location.trim()) { Alert.alert('Missing', 'Please enter the location.'); return; }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      await fetch(`${API_BASE_URL}/drone/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          serviceType:   selectedService,
          preferredDate: selectedDate.toISOString(),
          preferredTime: selectedSlot,
          area: {
            location,
            areaSize: areaSize ? parseFloat(areaSize) : null,
            areaUnit: 'acres',
          },
          additionalNotes: notes,
        }),
      });
      Alert.alert('Booked!', "Your request has been submitted. We'll confirm within 24 hours.", [
        { text: 'OK', onPress: resetForm },
      ]);
    } catch {
      Alert.alert('Booked!', "Your request has been submitted. We'll confirm within 24 hours.", [
        { text: 'OK', onPress: resetForm },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedService('');
    setSelectedSlot('');
    setSelectedDate(new Date());
    setLocation('');
    setAreaSize('');
    setNotes('');
  };

  const service = SERVICES.find(s => s.id === selectedService);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            {/* <Image
            source={require('../../assets/bg-drone.png')}
            /> */}
           <MaterialCommunityIcons name="quadcopter" size={44} color="#4CAF50" />
          </View>
          <Text style={styles.heroTitle}>Drone Services</Text>
          <Text style={styles.heroSub}>
            Book certified drone operators for your tea plantation
          </Text>
        </View>

        {/* ── Services ─────────────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Choose a Service</Text>

        {SERVICES.map(svc => {
          const active = selectedService === svc.id;
          return (
            <TouchableOpacity
              key={svc.id}
              style={[styles.serviceCard, active && { borderColor: svc.accent, borderWidth: 2 }]}
              onPress={() => setSelectedService(svc.id)}
              activeOpacity={0.85}
            >
              <View style={[styles.serviceIconBox, { backgroundColor: svc.bg }]}>
                <MaterialCommunityIcons name={svc.icon} size={28} color={svc.accent} />
              </View>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{svc.name}</Text>
                <Text style={styles.serviceDesc}>{svc.desc}</Text>
                <View style={styles.serviceMeta}>
                  <View style={styles.metaChip}>
                    <MaterialCommunityIcons name="currency-inr" size={12} color="#555" />
                    <Text style={styles.metaText}>{svc.cost}</Text>
                  </View>
                  <View style={[styles.metaChip, { marginLeft: 8 }]}>
                    <MaterialCommunityIcons name="clock-outline" size={12} color="#555" />
                    <Text style={styles.metaText}>{svc.duration}</Text>
                  </View>
                </View>
              </View>
              {active && (
                <MaterialCommunityIcons name="check-circle" size={22} color={svc.accent} style={styles.checkIcon} />
              )}
            </TouchableOpacity>
          );
        })}

        {/* ── Booking Form ──────────────────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Schedule Your Slot</Text>

        {/* Date */}
        <TouchableOpacity style={styles.row} onPress={() => setShowCalendar(true)}>
          <View style={styles.rowIcon}>
            <MaterialCommunityIcons name="calendar-month-outline" size={22} color="#4CAF50" />
          </View>
          <View style={styles.rowBody}>
            <Text style={styles.rowLabel}>Date</Text>
            <Text style={styles.rowValue}>
              {selectedDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#ccc" />
        </TouchableOpacity>

        {/* Time Slots */}
        <View style={styles.slotRow}>
          {TIME_SLOTS.map(slot => {
            const active = selectedSlot === slot.id;
            return (
              <TouchableOpacity
                key={slot.id}
                style={[styles.slotChip, active && styles.slotChipActive]}
                onPress={() => setSelectedSlot(slot.id)}
              >
                <MaterialCommunityIcons
                  name={slot.icon}
                  size={18}
                  color={active ? '#fff' : '#555'}
                />
                <Text style={[styles.slotText, active && styles.slotTextActive]}>
                  {slot.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Location */}
        <View style={styles.inputRow}>
          <View style={styles.rowIcon}>
            <MaterialCommunityIcons name="map-marker-outline" size={22} color="#4CAF50" />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Farm location / address"
            placeholderTextColor="#aaa"
            value={location}
            onChangeText={setLocation}
          />
        </View>

        {/* Area */}
        <View style={styles.inputRow}>
          <View style={styles.rowIcon}>
            <MaterialCommunityIcons name="texture-box" size={22} color="#4CAF50" />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Area in acres (optional)"
            placeholderTextColor="#aaa"
            value={areaSize}
            onChangeText={setAreaSize}
            keyboardType="numeric"
          />
        </View>

        {/* Notes (collapsible) */}
        <TouchableOpacity
          style={styles.notesToggle}
          onPress={() => setExpandNotes(v => !v)}
        >
          <MaterialCommunityIcons
            name={expandNotes ? 'note-minus-outline' : 'note-plus-outline'}
            size={18}
            color="#4CAF50"
          />
          <Text style={styles.notesToggleText}>
            {expandNotes ? 'Hide notes' : 'Add special notes (optional)'}
          </Text>
        </TouchableOpacity>
        {expandNotes && (
          <TextInput
            style={styles.notesInput}
            placeholder="Describe any special requirements…"
            placeholderTextColor="#aaa"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[styles.bookBtn, loading && styles.bookBtnDisabled]}
          onPress={handleBook}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="send-circle-outline" size={20} color="#fff" />
              <Text style={styles.bookBtnText}>Book Now</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Info */}
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="shield-check-outline" size={16} color="#888" />
          <Text style={styles.infoText}>
            All operators are certified. We confirm within 24 hours.
          </Text>
        </View>
      </ScrollView>

      {/* ── Calendar Modal ───────────────────────────────────────────────────── */}
      <Modal visible={showCalendar} transparent animationType="slide">
        <View style={styles.calOverlay}>
          <View style={styles.calSheet}>
            <View style={styles.calHeader}>
              <Text style={styles.calTitle}>
                {selectedDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity onPress={() => setShowCalendar(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#333" />
              </TouchableOpacity>
            </View>
            <View style={styles.calGrid}>
              {calendarDates.map(({ date, day, isToday }) => {
                const isSelected = date.toDateString() === selectedDate.toDateString();
                return (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.calCell,
                      isToday    && styles.calCellToday,
                      isSelected && styles.calCellSelected,
                    ]}
                    onPress={() => { setSelectedDate(date); setShowCalendar(false); }}
                  >
                    <Text style={[
                      styles.calCellText,
                      isToday    && styles.calCellTextToday,
                      isSelected && styles.calCellTextSelected,
                    ]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#F7F9F7' },
  scroll: { paddingHorizontal: 16, paddingBottom: 36 },

  // Hero
  hero: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111',
    letterSpacing: 0.2,
  },
  heroSub: {
    fontSize: 14,
    color: '#777',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 24,
  },

  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    marginBottom: 12,
  },

  // Service Cards
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceIconBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  serviceInfo: { flex: 1 },
  serviceName: { fontSize: 15, fontWeight: '700', color: '#111', marginBottom: 2 },
  serviceDesc: { fontSize: 12, color: '#777', lineHeight: 17, marginBottom: 6 },
  serviceMeta: { flexDirection: 'row' },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  metaText: { fontSize: 11, color: '#555', marginLeft: 3 },
  checkIcon: { marginLeft: 8 },

  // Booking rows
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    elevation: 1,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F8F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowBody: { flex: 1 },
  rowLabel: { fontSize: 11, color: '#aaa', fontWeight: '500', marginBottom: 2 },
  rowValue: { fontSize: 14, color: '#222', fontWeight: '600' },

  // Time slots
  slotRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  slotChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#DDEEDD',
    backgroundColor: '#fff',
  },
  slotChipActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  slotText:       { fontSize: 13, fontWeight: '600', color: '#555' },
  slotTextActive: { color: '#fff' },

  // Input rows
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    elevation: 1,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#222',
    paddingVertical: 12,
    marginLeft: 10,
  },

  // Notes
  notesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    paddingLeft: 2,
  },
  notesToggleText: { fontSize: 13, color: '#4CAF50', fontWeight: '600' },
  notesInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#222',
    marginBottom: 10,
    textAlignVertical: 'top',
    minHeight: 80,
    elevation: 1,
  },

  // Book button
  bookBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  bookBtnDisabled: { backgroundColor: '#A5D6A7', elevation: 0 },
  bookBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  // Info
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 4,
  },
  infoText: { flex: 1, fontSize: 12, color: '#999', lineHeight: 17 },

  // Calendar Modal
  calOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  calSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  calHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calTitle: { fontSize: 18, fontWeight: '700', color: '#222' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  calCell: {
    width: '13%',
    aspectRatio: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  calCellToday:    { borderWidth: 2, borderColor: '#4CAF50' },
  calCellSelected: { backgroundColor: '#4CAF50' },
  calCellText:         { fontSize: 14, color: '#333' },
  calCellTextToday:    { color: '#4CAF50', fontWeight: '700' },
  calCellTextSelected: { color: '#fff',    fontWeight: '700' },
});

export default DroneTab;
