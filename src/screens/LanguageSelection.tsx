import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { setAppLanguage } from '../i18n';

const LANGS = [
  { code: 'en', label: 'English', native: 'English', region: 'Global' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்', region: 'Tamil Nadu, Sri Lanka' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം', region: 'Kerala' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', region: 'North India' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు', region: 'Andhra Pradesh, Telangana' },
  { code: 'as', label: 'Assamese', native: 'অসমীয়া', region: 'Assam' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা', region: 'West Bengal' },
];

const LanguageSelection = () => {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const currentCode = i18n.language?.split('-')[0] || 'en';

  const select = async (code: string) => {
    await setAppLanguage(code);
    (navigation as any).goBack();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => (navigation as any).goBack()}>
          <MaterialIcons name="arrow-back" size={22} color="#1B5E20" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t('language_screen.title')}</Text>
          <Text style={styles.headerSub}>{t('language_screen.subtitle')}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Language List */}
      <FlatList
        data={LANGS}
        keyExtractor={i => i.code}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => {
          const isSelected = item.code === currentCode;
          return (
            <TouchableOpacity
              style={[styles.row, isSelected && styles.rowSelected]}
              onPress={() => select(item.code)}
              activeOpacity={0.75}
            >
              <View style={[styles.codeTag, isSelected && styles.codeTagSelected]}>
                <Text style={[styles.codeText, isSelected && styles.codeTextSelected]}>
                  {item.code.toUpperCase()}
                </Text>
              </View>

              <View style={styles.rowContent}>
                <Text style={[styles.nativeLabel, isSelected && styles.nativeLabelSelected]}>
                  {item.native}
                </Text>
                <Text style={styles.englishLabel}>
                  {item.label} · {item.region}
                </Text>
              </View>

              {isSelected && (
                <MaterialIcons name="check-circle" size={22} color="#2E7D32" />
              )}
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F7F4' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E8F5E9',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1B5E20' },
  headerSub: { fontSize: 12, color: '#888', marginTop: 1 },
  headerRight: { width: 38 },

  // List
  list: {
    padding: 16,
  },
  separator: { height: 8 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  rowSelected: {
    borderColor: '#2E7D32',
    backgroundColor: '#F1FAF1',
  },

  codeTag: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeTagSelected: {
    backgroundColor: '#C8E6C9',
  },
  codeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#888',
    letterSpacing: 0.5,
  },
  codeTextSelected: {
    color: '#1B5E20',
  },

  rowContent: { flex: 1 },
  nativeLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    marginBottom: 3,
  },
  nativeLabelSelected: {
    color: '#1B5E20',
  },
  englishLabel: {
    fontSize: 12,
    color: '#888',
  },
});

export default LanguageSelection;
