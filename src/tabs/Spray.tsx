import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, TextInput, Alert, ScrollView, KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getItem, setItem } from '../utils/storage';
import { API_BASE_URL } from '../config/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type SprayerType = 'hand' | 'machine' | 'drone';

type ChemEntry = {
  id: string;
  chemical: string;
  quantity: string;
  unit: 'ml' | 'L' | 'g' | 'kg';
};

type SprayLog = {
  id: string;          // local device ID
  serverId?: string;   // MongoDB _id after sync
  date: string;        // YYYY-MM-DD
  section: string;
  color: string;
  sprayerType: SprayerType;
  composition: ChemEntry[];
  notes: string;
  completed: boolean;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'spray_logs_v2';

const SECTION_PALETTE = [
  '#4CAF50', '#2196F3', '#FF9800', '#E91E63',
  '#9C27B0', '#00BCD4', '#FF5722', '#795548',
  '#607D8B', '#F44336', '#3F51B5', '#009688',
];

const UNITS: ChemEntry['unit'][] = ['ml', 'L', 'g', 'kg'];

const SPRAYER_OPTS: { type: SprayerType; label: string; icon: string }[] = [
  { type: 'hand',    label: 'Hand',    icon: 'hand-water'   },
  { type: 'machine', label: 'Machine', icon: 'engine'        },
  { type: 'drone',   label: 'Drone',   icon: 'quadcopter'   },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSectionColor(section: string, overrideColor?: string): string {
  if (overrideColor) return overrideColor;
  if (!section) return SECTION_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < section.length; i++) {
    hash = ((hash << 5) - hash + section.charCodeAt(i)) | 0;
  }
  return SECTION_PALETTE[Math.abs(hash) % SECTION_PALETTE.length];
}

function fmtDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function newChemEntry(): ChemEntry {
  return { id: Date.now().toString() + Math.random(), chemical: '', quantity: '', unit: 'ml' };
}

// ─── Component ────────────────────────────────────────────────────────────────

// ─── API helpers ──────────────────────────────────────────────────────────────

async function getAuthHeader(): Promise<Record<string, string>> {
  const token = await AsyncStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiPost(path: string, body: any) {
  const headers = await getAuthHeader();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  return res.ok ? res.json() : null;
}

async function apiPatch(path: string, body: any) {
  const headers = await getAuthHeader();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  return res.ok ? res.json() : null;
}

async function apiDelete(path: string) {
  const headers = await getAuthHeader();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'DELETE',
    headers: { ...headers },
  });
  return res.ok;
}

// ─── Component ────────────────────────────────────────────────────────────────

const SprayTab = () => {
  const [logs,         setLogs]         = useState<SprayLog[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [showModal,    setShowModal]    = useState(false);
  const [editing,      setEditing]      = useState<SprayLog | null>(null);
  const [syncing,      setSyncing]      = useState(false);

  // form state
  const [section,      setSection]      = useState('');
  const [sectionColor, setSectionColor] = useState(SECTION_PALETTE[0]);
  const [sprayerType,  setSprayerType]  = useState<SprayerType>('hand');
  const [composition,  setComposition]  = useState<ChemEntry[]>([newChemEntry()]);
  const [notes,        setNotes]        = useState('');
  const [completed,    setCompleted]    = useState(false);

  useEffect(() => { loadLogs(); }, []);

  const loadLogs = async () => {
    // Always load local first for instant display
    try {
      const raw = await getItem(STORAGE_KEY);
      const local: SprayLog[] = raw ? JSON.parse(raw) : [];
      setLogs(local);
    } catch { setLogs([]); }

    // Then fetch from server and merge (server is source of truth for serverId)
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`${API_BASE_URL}/spray-log`, { headers });
      if (!res.ok) return;
      const data = await res.json();
      if (!data?.logs?.length) return;

      // Rebuild local list: server logs are authoritative, keep local ones not yet synced
      const serverLogs: SprayLog[] = data.logs.map((l: any) => ({
        id:          l.localId ?? l.id,
        serverId:    l.id,
        date:        l.date,
        section:     l.section,
        color:       l.color ?? getSectionColor(l.section),
        sprayerType: l.sprayerType,
        composition: l.composition,
        notes:       l.notes ?? '',
        completed:   l.completed ?? false,
      }));

      setLogs(serverLogs);
      await setItem(STORAGE_KEY, JSON.stringify(serverLogs));
    } catch { /* offline — local data is fine */ }
  };

  const persistLogs = async (items: SprayLog[]) => {
    await setItem(STORAGE_KEY, JSON.stringify(items));
    setLogs(items);
  };

  // ── Form helpers ────────────────────────────────────────────────────────────

  const openAdd = () => {
    setEditing(null);
    setSection('');
    setSectionColor(SECTION_PALETTE[0]);
    setSprayerType('hand');
    setComposition([newChemEntry()]);
    setNotes('');
    setCompleted(false);
    setShowModal(true);
  };

  const openEdit = (log: SprayLog) => {
    setEditing(log);
    setSection(log.section);
    setSectionColor(log.color);
    setSprayerType(log.sprayerType);
    setComposition(log.composition.length ? log.composition : [newChemEntry()]);
    setNotes(log.notes);
    setCompleted(log.completed);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!section.trim()) { Alert.alert('Required', 'Please enter a section name.'); return; }
    const validChem = composition.filter(c => c.chemical.trim());
    if (!validChem.length) { Alert.alert('Required', 'Add at least one chemical.'); return; }

    const color = getSectionColor(section, sectionColor);
    const localId = editing?.id ?? Date.now().toString();
    const log: SprayLog = {
      id:          localId,
      serverId:    editing?.serverId,
      date:        selectedDate,
      section:     section.trim(),
      color,
      sprayerType,
      composition: validChem,
      notes:       notes.trim(),
      completed,
    };

    // 1. Save locally immediately
    const updated = editing
      ? logs.map(l => l.id === editing.id ? log : l)
      : [log, ...logs];
    await persistLogs(updated);
    setShowModal(false);

    // 2. Sync to server in background
    const payload = {
      date: log.date, section: log.section, color: log.color,
      sprayerType: log.sprayerType,
      composition: validChem.map(({ chemical, quantity, unit }) => ({ chemical, quantity, unit })),
      notes: log.notes, completed: log.completed, localId,
    };
    try {
      if (editing?.serverId) {
        // Update existing server record
        await apiPatch(`/spray-log/${editing.serverId}`, payload);
      } else {
        // Create new — store serverId back into local
        const res = await apiPost('/spray-log', payload);
        if (res?.log?.id) {
          const withServerId = updated.map(l =>
            l.id === localId ? { ...l, serverId: res.log.id } : l
          );
          await persistLogs(withServerId);
        }
      }
    } catch { /* offline — will sync on next load */ }
  };

  const handleDelete = (id: string) => {
    const target = logs.find(l => l.id === id);
    Alert.alert('Delete log', 'Remove this spray log?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await persistLogs(logs.filter(l => l.id !== id));
          // Sync delete to server
          if (target?.serverId) {
            try { await apiDelete(`/spray-log/${target.serverId}`); } catch {}
          }
        },
      },
    ]);
  };

  const toggleDone = async (id: string) => {
    const target = logs.find(l => l.id === id);
    if (!target) return;
    const updated = logs.map(l => l.id === id ? { ...l, completed: !l.completed } : l);
    await persistLogs(updated);
    if (target.serverId) {
      try { await apiPatch(`/spray-log/${target.serverId}`, { completed: !target.completed }); } catch {}
    }
  };

  // ── Composition row helpers ─────────────────────────────────────────────────

  const updateChem = (id: string, field: keyof ChemEntry, val: string) => {
    setComposition(prev => prev.map(c => c.id === id ? { ...c, [field]: val } : c));
  };

  const cycleUnit = (id: string) => {
    setComposition(prev => prev.map(c => {
      if (c.id !== id) return c;
      const idx = (UNITS.indexOf(c.unit) + 1) % UNITS.length;
      return { ...c, unit: UNITS[idx] };
    }));
  };

  const removeChem = (id: string) => {
    if (composition.length <= 1) return;
    setComposition(prev => prev.filter(c => c.id !== id));
  };

  // ── Calendar ────────────────────────────────────────────────────────────────

  const buildCalendar = () => {
    const d   = new Date(selectedDate + 'T12:00:00');
    const y   = d.getFullYear();
    const m   = d.getMonth();
    const first = new Date(y, m, 1).getDay();
    const days  = new Date(y, m + 1, 0).getDate();
    const cells: (number | null)[] = [...Array(first).fill(null)];
    for (let i = 1; i <= days; i++) cells.push(i);
    const rows: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return { y, m, rows };
  };

  const shiftMonth = (delta: number) => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(1);
    d.setMonth(d.getMonth() + delta);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const { y, m, rows } = buildCalendar();

  const logsForDate = logs
    .filter(l => l.date === selectedDate)
    .sort((a, b) => a.section.localeCompare(b.section));

  // unique sections across all logs for legend
  const sectionLegend = Array.from(
    new Map(logs.map(l => [l.section, l.color])).entries()
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <View style={s.pageHeader}>
        <View>
          <Text style={s.pageTitle}>Spray Log</Text>
          <Text style={s.pageSub}>Tea garden spray records</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={openAdd}>
          <MaterialCommunityIcons name="plus" size={20} color="#fff" />
          <Text style={s.addBtnText}>Add Log</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── Month nav ──────────────────────────────────────────────────── */}
        <View style={s.monthRow}>
          <TouchableOpacity style={s.arrowBtn} onPress={() => shiftMonth(-1)}>
            <MaterialCommunityIcons name="chevron-left" size={22} color="#333" />
          </TouchableOpacity>
          <Text style={s.monthLabel}>
            {new Date(y, m).toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity style={s.arrowBtn} onPress={() => shiftMonth(1)}>
            <MaterialCommunityIcons name="chevron-right" size={22} color="#333" />
          </TouchableOpacity>
        </View>

        {/* ── Calendar ───────────────────────────────────────────────────── */}
        <View style={s.calBox}>
          {/* Day headers */}
          <View style={s.calHeadRow}>
            {['S','M','T','W','T','F','S'].map((d, i) => (
              <Text key={i} style={s.calHead}>{d}</Text>
            ))}
          </View>
          {rows.map((row, ri) => (
            <View key={ri} style={s.calRow}>
              {row.map((day, ci) => {
                const dateStr = day
                  ? `${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
                  : '';
                const isSelected = dateStr === selectedDate;
                const isToday    = dateStr === new Date().toISOString().slice(0, 10);
                const dayLogs    = day ? logs.filter(l => l.date === dateStr) : [];

                return (
                  <TouchableOpacity
                    key={ci}
                    style={[s.calCell, isSelected && s.calCellSelected, isToday && !isSelected && s.calCellToday]}
                    onPress={() => day && setSelectedDate(dateStr)}
                    disabled={!day}
                  >
                    <Text style={[s.calDayText, isSelected && s.calDayTextSel, isToday && !isSelected && s.calDayTextToday]}>
                      {day || ''}
                    </Text>
                    {/* Section color dots */}
                    {dayLogs.length > 0 && (
                      <View style={s.dotRow}>
                        {dayLogs.slice(0, 3).map((l, di) => (
                          <View key={di} style={[s.dot, { backgroundColor: l.color }]} />
                        ))}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* ── Section legend ─────────────────────────────────────────────── */}
        {sectionLegend.length > 0 && (
          <View style={s.legendRow}>
            {sectionLegend.map(([sec, col]) => (
              <View key={sec} style={s.legendChip}>
                <View style={[s.legendDot, { backgroundColor: col }]} />
                <Text style={s.legendText}>{sec}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Logs for selected date ─────────────────────────────────────── */}
        <View style={s.dateHeader}>
          <Text style={s.dateLabel}>{fmtDate(selectedDate)}</Text>
          {logsForDate.length > 0 && (
            <Text style={s.dateCount}>{logsForDate.length} log{logsForDate.length > 1 ? 's' : ''}</Text>
          )}
        </View>

        {logsForDate.length === 0 ? (
          <View style={s.emptyBox}>
            <MaterialCommunityIcons name="spray" size={38} color="#C8E6C9" />
            <Text style={s.emptyTitle}>No logs yet</Text>
            <Text style={s.emptySub}>Tap "Add Log" to record today's spray activity</Text>
          </View>
        ) : (
          logsForDate.map(log => {
            const sprayer = SPRAYER_OPTS.find(o => o.type === log.sprayerType)!;
            const chems   = log.composition;
            return (
              <TouchableOpacity
                key={log.id}
                style={s.card}
                onPress={() => openEdit(log)}
                activeOpacity={0.85}
              >
                {/* Left color bar */}
                <View style={[s.cardBar, { backgroundColor: log.color }]} />

                <View style={s.cardBody}>
                  {/* Row 1: section badge + sprayer + status */}
                  <View style={s.cardTopRow}>
                    <View style={[s.sectionBadge, { backgroundColor: log.color + '22', borderColor: log.color }]}>
                      <Text style={[s.sectionBadgeText, { color: log.color }]}>
                        {log.section}
                      </Text>
                    </View>
                    <View style={s.sprayerTag}>
                      <MaterialCommunityIcons name={sprayer.icon} size={14} color="#555" />
                      <Text style={s.sprayerTagText}>{sprayer.label}</Text>
                    </View>
                    <TouchableOpacity
                      style={[s.statusBtn, log.completed ? s.statusDone : s.statusPending]}
                      onPress={() => toggleDone(log.id)}
                    >
                      <MaterialCommunityIcons
                        name={log.completed ? 'check-circle' : 'clock-outline'}
                        size={14}
                        color={log.completed ? '#4CAF50' : '#FF9800'}
                      />
                      <Text style={[s.statusText, { color: log.completed ? '#4CAF50' : '#FF9800' }]}>
                        {log.completed ? 'Done' : 'Pending'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Row 2: chemicals */}
                  <View style={s.chemRow}>
                    <MaterialCommunityIcons name="flask-outline" size={14} color="#888" />
                    <Text style={s.chemText} numberOfLines={1}>
                      {chems.slice(0, 2).map(c => `${c.chemical} ${c.quantity}${c.unit}`).join('  ·  ')}
                      {chems.length > 2 ? `  +${chems.length - 2} more` : ''}
                    </Text>
                  </View>

                  {/* Row 3: notes + delete */}
                  <View style={s.cardBottomRow}>
                    {log.notes ? (
                      <Text style={s.notesPreview} numberOfLines={1}>{log.notes}</Text>
                    ) : <View />}
                    <TouchableOpacity onPress={() => handleDelete(log.id)} style={s.deleteBtn}>
                      <MaterialCommunityIcons name="trash-can-outline" size={16} color="#F44336" />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ── Add / Edit Modal ─────────────────────────────────────────────────── */}
      <Modal visible={showModal} animationType="slide" onRequestClose={() => setShowModal(false)}>
        <SafeAreaView style={s.modalSafe} edges={['top']}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView contentContainerStyle={s.modalScroll} keyboardShouldPersistTaps="handled">

              {/* Modal header */}
              <View style={s.modalHeader}>
                <Text style={s.modalTitle}>{editing ? 'Edit Log' : 'New Spray Log'}</Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <MaterialCommunityIcons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <Text style={s.fieldLabel}>Section Name *</Text>
              <View style={s.sectionInputRow}>
                {/* Color swatch row */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.colorScroll}>
                  {SECTION_PALETTE.map(col => (
                    <TouchableOpacity
                      key={col}
                      style={[s.colorSwatch, { backgroundColor: col }, sectionColor === col && s.colorSwatchSelected]}
                      onPress={() => setSectionColor(col)}
                    />
                  ))}
                </ScrollView>
              </View>
              <View style={s.sectionFieldRow}>
                <View style={[s.colorDot, { backgroundColor: sectionColor }]} />
                <TextInput
                  style={s.sectionInput}
                  placeholder="e.g.  Section A,  Block 3,  North Hill"
                  placeholderTextColor="#aaa"
                  value={section}
                  onChangeText={setSection}
                />
              </View>

              {/* Sprayer type */}
              <Text style={[s.fieldLabel, { marginTop: 16 }]}>Sprayer Type *</Text>
              <View style={s.sprayerRow}>
                {SPRAYER_OPTS.map(opt => {
                  const active = sprayerType === opt.type;
                  return (
                    <TouchableOpacity
                      key={opt.type}
                      style={[s.sprayerChip, active && s.sprayerChipActive]}
                      onPress={() => setSprayerType(opt.type)}
                    >
                      <MaterialCommunityIcons name={opt.icon} size={22} color={active ? '#fff' : '#555'} />
                      <Text style={[s.sprayerChipText, active && s.sprayerChipTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Composition */}
              <View style={s.compHeader}>
                <Text style={s.fieldLabel}>Composition *</Text>
                <TouchableOpacity
                  style={s.addChemBtn}
                  onPress={() => setComposition(prev => [...prev, newChemEntry()])}
                >
                  <MaterialCommunityIcons name="plus-circle-outline" size={18} color="#4CAF50" />
                  <Text style={s.addChemText}>Add Chemical</Text>
                </TouchableOpacity>
              </View>

              {/* Column headers */}
              <View style={s.chemTableHead}>
                <Text style={[s.chemColHead, { flex: 5 }]}>Chemical / Input</Text>
                <Text style={[s.chemColHead, { flex: 2, textAlign: 'center' }]}>Qty</Text>
                <Text style={[s.chemColHead, { flex: 2, textAlign: 'center' }]}>Unit</Text>
                <View style={{ width: 28 }} />
              </View>

              {composition.map((entry, idx) => (
                <View key={entry.id} style={s.chemRow2}>
                  <TextInput
                    style={[s.chemInput, { flex: 5 }]}
                    placeholder={`Chemical ${idx + 1}`}
                    placeholderTextColor="#bbb"
                    value={entry.chemical}
                    onChangeText={v => updateChem(entry.id, 'chemical', v)}
                  />
                  <TextInput
                    style={[s.chemInput, { flex: 2, textAlign: 'center' }]}
                    placeholder="50"
                    placeholderTextColor="#bbb"
                    value={entry.quantity}
                    onChangeText={v => updateChem(entry.id, 'quantity', v)}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity style={s.unitBtn} onPress={() => cycleUnit(entry.id)}>
                    <Text style={s.unitBtnText}>{entry.unit}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.removeChemBtn} onPress={() => removeChem(entry.id)}>
                    <MaterialCommunityIcons name="close" size={16} color={composition.length <= 1 ? '#ddd' : '#F44336'} />
                  </TouchableOpacity>
                </View>
              ))}

              {/* Notes */}
              <Text style={[s.fieldLabel, { marginTop: 16 }]}>Notes (optional)</Text>
              <TextInput
                style={s.notesInput}
                placeholder="Additional instructions, weather conditions, coverage area…"
                placeholderTextColor="#aaa"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />

              {/* Status toggle */}
              <TouchableOpacity
                style={[s.completedToggle, completed && s.completedToggleActive]}
                onPress={() => setCompleted(v => !v)}
              >
                <MaterialCommunityIcons
                  name={completed ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                  size={22}
                  color={completed ? '#4CAF50' : '#aaa'}
                />
                <Text style={[s.completedText, completed && { color: '#4CAF50' }]}>
                  {completed ? 'Marked as completed' : 'Mark as completed'}
                </Text>
              </TouchableOpacity>

              {/* Buttons */}
              <View style={s.modalActions}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => setShowModal(false)}>
                  <Text style={s.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
                  <MaterialCommunityIcons name="content-save-outline" size={18} color="#fff" />
                  <Text style={s.saveBtnText}>Save Log</Text>
                </TouchableOpacity>
              </View>

            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: '#F7F9F7' },
  scroll: { paddingHorizontal: 16, paddingBottom: 20 },

  // Page header
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#F7F9F7',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0EE',
  },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#111' },
  pageSub:   { fontSize: 12, color: '#888', marginTop: 1 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 24,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Month nav
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 10,
  },
  arrowBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  monthLabel: { fontSize: 16, fontWeight: '700', color: '#222' },

  // Calendar
  calBox: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  calHeadRow: { flexDirection: 'row', marginBottom: 4 },
  calHead: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: '#888' },
  calRow:  { flexDirection: 'row', marginBottom: 2 },
  calCell: {
    flex: 1, alignItems: 'center', paddingVertical: 6,
    borderRadius: 8, minHeight: 44, justifyContent: 'center',
  },
  calCellSelected: { backgroundColor: '#4CAF50' },
  calCellToday:    { borderWidth: 1.5, borderColor: '#4CAF50' },
  calDayText:        { fontSize: 13, color: '#333' },
  calDayTextSel:     { color: '#fff', fontWeight: '700' },
  calDayTextToday:   { color: '#4CAF50', fontWeight: '700' },
  dotRow: { flexDirection: 'row', gap: 2, marginTop: 2 },
  dot:    { width: 5, height: 5, borderRadius: 3 },

  // Legend
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  legendChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#fff',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    elevation: 1,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  legendDot:  { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: '#444', fontWeight: '500' },

  // Date header
  dateHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 10,
  },
  dateLabel: { fontSize: 15, fontWeight: '700', color: '#222' },
  dateCount: {
    fontSize: 12, color: '#4CAF50', fontWeight: '600',
    backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10,
  },

  // Empty state
  emptyBox: {
    backgroundColor: '#fff',
    borderRadius: 14, padding: 32,
    alignItems: 'center', justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#888', marginTop: 12 },
  emptySub:   { fontSize: 13, color: '#aaa', textAlign: 'center', marginTop: 4 },

  // Log card
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardBar:  { width: 5 },
  cardBody: { flex: 1, padding: 14 },
  cardTopRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8,
  },
  sectionBadge: {
    borderRadius: 8, borderWidth: 1,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  sectionBadgeText: { fontSize: 12, fontWeight: '700' },
  sprayerTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F5F5F5', borderRadius: 8,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  sprayerTagText: { fontSize: 11, color: '#555', fontWeight: '500' },
  statusBtn: {
    marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 3,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2,
  },
  statusDone:    { backgroundColor: '#E8F5E9' },
  statusPending: { backgroundColor: '#FFF3E0' },
  statusText: { fontSize: 11, fontWeight: '600' },
  chemRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6,
  },
  chemText: { flex: 1, fontSize: 12, color: '#666' },
  cardBottomRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  notesPreview: { flex: 1, fontSize: 11, color: '#999', fontStyle: 'italic' },
  deleteBtn:    { padding: 4 },

  // ── Modal ──────────────────────────────────────────────────────────────────

  modalSafe:   { flex: 1, backgroundColor: '#F7F9F7' },
  modalScroll: { paddingHorizontal: 16, paddingBottom: 40 },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 16, paddingBottom: 20,
  },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#111' },

  fieldLabel: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 8 },

  // Section color + input
  colorScroll: { marginBottom: 8 },
  colorSwatch: {
    width: 28, height: 28, borderRadius: 14, marginRight: 8,
  },
  colorSwatchSelected: {
    borderWidth: 3, borderColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }, elevation: 4,
  },
  sectionInputRow: { marginBottom: 8 },
  sectionFieldRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E0E0E0',
    paddingHorizontal: 12, paddingVertical: 4, marginBottom: 4,
  },
  colorDot:    { width: 14, height: 14, borderRadius: 7, marginRight: 10 },
  sectionInput: { flex: 1, fontSize: 15, color: '#222', paddingVertical: 10 },

  // Sprayer chips
  sprayerRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  sprayerChip: {
    flex: 1, flexDirection: 'column', alignItems: 'center', gap: 5,
    paddingVertical: 12, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#E0E0E0', backgroundColor: '#fff',
  },
  sprayerChipActive:     { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  sprayerChipText:       { fontSize: 12, fontWeight: '600', color: '#555' },
  sprayerChipTextActive: { color: '#fff' },

  // Composition table
  compHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6,
  },
  addChemBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addChemText: { fontSize: 13, color: '#4CAF50', fontWeight: '600' },
  chemTableHead: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 4, marginBottom: 4,
  },
  chemColHead: { fontSize: 11, color: '#aaa', fontWeight: '600' },
  chemRow2: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 6,
  },
  chemInput: {
    backgroundColor: '#fff', borderRadius: 10,
    borderWidth: 1, borderColor: '#E0E0E0',
    paddingHorizontal: 10, paddingVertical: 9,
    fontSize: 13, color: '#222',
  },
  unitBtn: {
    flex: 2, backgroundColor: '#E8F5E9', borderRadius: 10,
    paddingVertical: 9, alignItems: 'center', justifyContent: 'center',
  },
  unitBtnText:    { fontSize: 12, fontWeight: '700', color: '#4CAF50' },
  removeChemBtn:  { width: 28, alignItems: 'center' },

  // Notes
  notesInput: {
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: '#E0E0E0',
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: '#222', minHeight: 80,
    textAlignVertical: 'top', marginBottom: 12,
  },

  // Completed toggle
  completedToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: '#E0E0E0',
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 20,
  },
  completedToggleActive: { borderColor: '#4CAF50', backgroundColor: '#F1FAF1' },
  completedText: { fontSize: 14, fontWeight: '600', color: '#aaa' },

  // Modal actions
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  cancelBtnText: { color: '#666', fontWeight: '600', fontSize: 15 },
  saveBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 12,
    backgroundColor: '#4CAF50',
    shadowColor: '#4CAF50', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

export default SprayTab;
