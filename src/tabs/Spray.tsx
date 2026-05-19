import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  Switch,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getItem, setItem, removeItem, debugStore } from '../utils/storage';
// Notifications: remove dependency on expo-notifications to avoid bundler errors.
// Provide a safe no-op notification service that matches the minimal API
// used by this file so the app can run without native Expo packages.

const STORAGE_KEY = 'spray_logs';

type SprayLog = {
  id: string;
  title: string;
  datetime: string; // ISO
  notes?: string;
  section: string;
  completed: boolean;
  cropType?: string;
  sprayType?: string;
};

// Minimal no-op notification service to keep the same API surface used
// by this screen. Replace with a real implementation if you install
// and configure a notification library (expo-notifications or
// react-native-push-notification) for production.
const sprayLogNotificationService = {
  async scheduleReminders(_log: any) {
    // No-op: scheduling not available in current build. Keep promise
    // semantics so callers can await without error.
    return Promise.resolve();
  },
  startNotificationScheduler() {
    // No background scheduler in this lightweight implementation.
  },
};

const SprayTab = () => {
  const [logs, setLogs] = useState<SprayLog[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<SprayLog | null>(null);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [section, setSection] = useState('');
  const [completed, setCompleted] = useState(false);
  const [cropType, setCropType] = useState('');
  const [sprayType, setSprayType] = useState('');

  useEffect(() => {
    loadLogs();
    sprayLogNotificationService.startNotificationScheduler();
    try {
      console.log('Storage debug', debugStore());
    } catch (e) {}
  }, []);

  const loadLogs = async () => {
    try {
      const raw = await getItem(STORAGE_KEY);
      const parsed: SprayLog[] = raw ? JSON.parse(raw) : [];
      setLogs(parsed);
    } catch (e) {
      console.warn('Failed to load spray logs', e);
    }
  };

  // Save logs and schedule push notifications for new/edited logs
  const saveLogs = async (items: SprayLog[]) => {
    try {
      await setItem(STORAGE_KEY, JSON.stringify(items));
      setLogs(items);
      // Find logs that are new or have changed datetime
      const newOrUpdatedLogs = items.filter(
        log => !logs.find(existing => existing.id === log.id)
          || logs.find(existing => existing.id === log.id && existing.datetime !== log.datetime)
      );
      for (const log of newOrUpdatedLogs) {
        await sprayLogNotificationService.scheduleReminders(log);
      }
      return true;
    } catch (e) {
      console.warn('Failed to save spray logs', e);
      Alert.alert('Error', 'Failed to save spray logs');
      return false;
    }
  };

  const addOrUpdateLog = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Title is required');
      console.log('Validation failed: Title missing');
      return;
    }
    if (!section.trim()) {
      Alert.alert('Error', 'Section is required');
      console.log('Validation failed: Section missing');
      return;
    }
    const iso = `${selectedDate}T${time || '09:00'}:00`;
    if (editing) {
      const updated = logs.map(l =>
        l.id === editing.id
          ? {
              ...l,
              title,
              datetime: iso,
              notes,
              section,
              completed,
              cropType,
              sprayType,
            }
          : l,
      );
      const result = await saveLogs(updated);
      if (result) {
        resetForm();
      }
    } else {
      const newLog: SprayLog = {
        id: Date.now().toString(),
        title,
        datetime: iso,
        notes,
        section,
        completed,
        cropType,
        sprayType,
      };
      const result = await saveLogs([newLog, ...logs]);
      if (result) {
        resetForm();
      }
    }
  };

  const resetForm = () => {
    setModalVisible(false);
    setEditing(null);
    setTitle('');
    setTime('');
    setNotes('');
    setSection('');
    setCompleted(false);
    setCropType('');
    setSprayType('');
  };

  const removeLog = (id: string) => {
    Alert.alert(
      'Delete log',
      'Are you sure you want to delete this log?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updated = logs.filter(l => l.id !== id);
            await saveLogs(updated);
          },
        },
      ],
    );
  };

  const toggleCompleted = (id: string) => {
    const updated = logs.map(log =>
      log.id === id ? { ...log, completed: !log.completed } : log
    );
    saveLogs(updated);
  };

  const logsForSelectedDate = logs
    .filter(l => l.datetime.slice(0, 10) === selectedDate)
    .sort((a, b) => (a.datetime > b.datetime ? 1 : -1));

  // Calendar generator
  const renderCalendar = () => {
    const today = new Date(selectedDate);
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const rows: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

    return (
      <View style={styles.calendarContainer}>
        <View style={styles.calendarHeaderRow}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <Text key={d} style={styles.calendarHeaderText}>
              {d}
            </Text>
          ))}
        </View>
        {rows.map((row, rIdx) => (
          <View key={rIdx} style={styles.calendarRow}>
            {row.map((day, idx) => {
              const dateStr = day
                ? `${year}-${String(month + 1).padStart(2, '0')}-${String(
                    day,
                  ).padStart(2, '0')}`
                : '';
              const hasLog = day
                ? logs.some(l => l.datetime.startsWith(dateStr))
                : false;
              const isSelected = dateStr === selectedDate;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                  onPress={() => day && setSelectedDate(dateStr)}
                  disabled={!day}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isSelected && styles.dayTextSelected,
                    ]}
                  >
                    {day || ''}
                  </Text>
                  {hasLog && <View style={styles.dot} />}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16 }}
    >
      <Text style={styles.title}>Spray Logs</Text>

      <View style={styles.monthSwitcher}>
        <TouchableOpacity
          onPress={() => {
            const d = new Date(selectedDate);
            d.setMonth(d.getMonth() - 1);
            setSelectedDate(d.toISOString().slice(0, 10));
          }}
          style={styles.switchBtn}
        >
          <Text style={styles.switchBtnText}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>
          {new Date(selectedDate).toLocaleString(undefined, {
            month: 'long',
            year: 'numeric',
          })}
        </Text>
        <TouchableOpacity
          onPress={() => {
            const d = new Date(selectedDate);
            d.setMonth(d.getMonth() + 1);
            setSelectedDate(d.toISOString().slice(0, 10));
          }}
          style={styles.switchBtn}
        >
          <Text style={styles.switchBtnText}>{'>'}</Text>
        </TouchableOpacity>
      </View>

      {renderCalendar()}

      <View style={styles.logsHeader}>
        <Text style={styles.subtitle}>Logs for {selectedDate}</Text>
        <TouchableOpacity
          onPress={() => {
            resetForm();
            setModalVisible(true);
            setTime('09:00');
          }}
          style={styles.switchBtn}
        >
          <Text style={styles.addText}>+ Add Log</Text>
        </TouchableOpacity>
      </View>

      {logsForSelectedDate.length === 0 ? (
        <Text style={styles.empty}>No logs for this date.</Text>
      ) : (
        <FlatList
          data={logsForSelectedDate}
          keyExtractor={i => i.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.logItem,
                item.completed && styles.logItemCompleted
              ]}
              onPress={() => {
                setEditing(item);
                setTitle(item.title);
                setTime(item.datetime.slice(11, 16));
                setNotes(item.notes || '');
                setSection(item.section);
                setCompleted(item.completed);
                setCropType(item.cropType || '');
                setSprayType(item.sprayType || '');
                setModalVisible(true);
              }}
              onLongPress={() => removeLog(item.id)}
            >
              <View style={styles.logHeader}>
                <Text style={styles.logTitle}>{item.title}</Text>
                <TouchableOpacity
                  onPress={() => toggleCompleted(item.id)}
                  style={[
                    styles.statusBadge,
                    item.completed ? styles.completedBadge : styles.pendingBadge
                  ]}
                >
                  <Text style={[
                    styles.statusText,
                    item.completed ? styles.completedText : styles.pendingText
                  ]}>
                    {item.completed ? '✓ Completed' : '⏳ Pending'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.logDetails}>
                <Text style={styles.logSection}>Section: {item.section}</Text>
                <Text style={styles.logTime}>
                  {new Date(item.datetime).toLocaleString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: 'short',
                  })}
                </Text>
              </View>
              {item.cropType && (
                <Text style={styles.logInfo}>Tea Type: {item.cropType}</Text>
              )}
              {item.sprayType && (
                <Text style={styles.logInfo}>Spray Type: {item.sprayType}</Text>
              )}
              {item.notes ? (
                <Text style={styles.logNotes}>Notes: {item.notes}</Text>
              ) : null}
            </TouchableOpacity>
          )}
        />
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <ScrollView style={styles.modalContainer}>
          <Text style={styles.modalTitle}>
            {editing ? 'Edit Log' : 'Add Log'}
          </Text>

          <Text style={styles.inputLabel}>Title *</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Enter log title"
            placeholderTextColor="#999"
            style={styles.input}
          />

          <Text style={styles.inputLabel}>Section *</Text>
          <TextInput
            value={section}
            onChangeText={setSection}
            placeholder="e.g., North Field, Block A, etc."
            placeholderTextColor="#999"
            style={styles.input}
          />

          <Text style={styles.inputLabel}>Time</Text>
          <TextInput
            value={time}
            onChangeText={setTime}
            placeholder="e.g., 09:00"
            placeholderTextColor="#999"
            style={styles.input}
          />

          <Text style={styles.inputLabel}>Tea Type</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={cropType}
              onValueChange={setCropType}
              style={styles.picker}
            >
              <Picker.Item label="Select tea type" value="" />
              <Picker.Item label="Green Tea" value="Green Tea" />
              <Picker.Item label="Black Tea" value="Black Tea" />
              <Picker.Item label="White Tea" value="White Tea" />
              <Picker.Item label="Oolong Tea" value="Oolong Tea" />
              <Picker.Item label="Orthodox Tea" value="Orthodox Tea" />
              <Picker.Item label="CTC Tea" value="CTC Tea" />
            </Picker>
          </View>

          <Text style={styles.inputLabel}>Spray Type</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={sprayType}
              onValueChange={setSprayType}
              style={styles.picker}
            >
              <Picker.Item label="Select spray type" value="" />
              <Picker.Item label="Pesticide" value="Pesticide" />
              <Picker.Item label="Herbicide" value="Herbicide" />
              <Picker.Item label="Fungicide" value="Fungicide" />
              <Picker.Item label="Fertilizer" value="Fertilizer" />
              <Picker.Item label="Insecticide" value="Insecticide" />
              <Picker.Item label="Other" value="Other" />
            </Picker>
          </View>

          <View style={styles.switchContainer}>
            <Text style={styles.inputLabel}>Completed</Text>
            <Switch
              value={completed}
              onValueChange={setCompleted}
              trackColor={{ false: '#ddd', true: '#4CAF50' }}
              thumbColor={completed ? '#fff' : '#f4f3f4'}
            />
          </View>

          <Text style={styles.inputLabel}>Notes</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any notes here"
            placeholderTextColor="#999"
            style={[styles.input, { height: 100 }]}
            multiline
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalBtn, styles.cancelBtn]}
              onPress={resetForm}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalBtn, styles.saveBtn]}
              onPress={addOrUpdateLog}
            >
              <Text style={styles.saveBtnText}>
                {editing ? 'Save' : 'Add'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12, color: '#333' },
  monthSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  switchBtn: { padding: 8, backgroundColor: '#f2f2f2', borderRadius: 8 },
  switchBtnText: {
    color: '#333',
    fontWeight: '600'
  },
  monthLabel: { fontSize: 16, fontWeight: '600', color: '#333' },
  calendarContainer: {
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  calendarHeaderText: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontWeight: '700',
    color: '#555',
  },
  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  dayCell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  dayCellSelected: { backgroundColor: '#4CAF50' },
  dayText: { color: '#333' },
  dayTextSelected: { color: '#fff', fontWeight: '700' },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
    marginTop: 6,
  },
  subtitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  addText: { color: '#4CAF50', fontWeight: '700' },
  logsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  empty: { color: '#777', paddingVertical: 12 },
  logItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  logItemCompleted: {
    backgroundColor: '#f8fff8',
    borderColor: '#4CAF50',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logTitle: { fontSize: 16, fontWeight: '700', color: '#333', flex: 1 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  completedBadge: { backgroundColor: '#e8f5e8', },
  pendingBadge: { backgroundColor: '#fff3e0', },
  statusText: { fontSize: 12, fontWeight: '600', },
  completedText: { color: '#4CAF50', },
  pendingText: { color: '#ff9800', },
  logDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  logSection: { fontSize: 14, fontWeight: '600', color: '#666', },
  logTime: { color: '#4CAF50', fontSize: 14, fontWeight: '500' },
  logInfo: { fontSize: 13, color: '#555', marginBottom: 2, },
  logNotes: { color: '#555', marginTop: 8, fontSize: 13, fontStyle: 'italic' },
  modalContainer: { flex: 1, padding: 16, backgroundColor: '#fff' },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 20, color: '#333' },
  inputLabel: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#333', },
  input: {
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 16,
    color: '#333',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 16,
  },
  picker: { color: '#333' },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  saveBtn: {
    backgroundColor: '#4CAF50',
  },
  cancelBtnText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default SprayTab;
