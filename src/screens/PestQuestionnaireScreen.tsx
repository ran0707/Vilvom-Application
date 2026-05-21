import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const PESTICIDE_OPTIONS = [
  'Never used',
  'Less than 1 week ago',
  '1–2 weeks ago',
  '3–4 weeks ago',
  '1–2 months ago',
  'More than 2 months ago',
];

const PestQuestionnaireScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  const [isFirstTime, setIsFirstTime] = useState<boolean | null>(null);
  const [sectionName, setSectionName] = useState('');
  const [acreSize, setAcreSize] = useState(1);
  const [lastPesticide, setLastPesticide] = useState('');

  const isEscalated = isFirstTime === false;

  const handleSubmit = () => {
    if (isFirstTime === null) {
      Alert.alert('Required', 'Please select whether this is your first scan of this section.');
      return;
    }
    if (!sectionName.trim()) {
      Alert.alert('Required', 'Please enter the section name or identifier.');
      return;
    }
    if (!lastPesticide) {
      Alert.alert('Required', 'Please select when you last used pesticide.');
      return;
    }

    const params = (route as any).params || {};
    (navigation as any).navigate('PestResult', {
      ...params,
      questionnaire: {
        isFirstTimeUpload: isFirstTime,
        sectionName: sectionName.trim(),
        acreSize,
        lastPesticideUse: lastPesticide,
      },
      recommendationLevel: isFirstTime ? 'standard' : 'escalated',
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (navigation as any).goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#1B5E20" />
        </TouchableOpacity>
        <Image
          source={require('../../assets/vilvom_logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.pageTitle}>Scan Context</Text>
        <Text style={styles.pageSubtitle}>
          Help us tailor the recommendation to your situation
        </Text>

        {/* Q1: First time or rechecking */}
        <View style={styles.card}>
          <View style={styles.qHeader}>
            <View style={styles.qBadge}><Text style={styles.qBadgeText}>1</Text></View>
            <Text style={styles.qTitle}>Is this your first scan of this section?</Text>
          </View>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, isFirstTime === true && styles.toggleBtnActive]}
              onPress={() => setIsFirstTime(true)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="leaf"
                size={20}
                color={isFirstTime === true ? '#fff' : '#2E7D32'}
              />
              <Text style={[styles.toggleLabel, isFirstTime === true && styles.toggleLabelActive]}>
                First Time
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, styles.toggleBtnWarn, isFirstTime === false && styles.toggleBtnWarnActive]}
              onPress={() => setIsFirstTime(false)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="refresh-circle"
                size={20}
                color={isFirstTime === false ? '#fff' : '#E65100'}
              />
              <Text style={[styles.toggleLabel, styles.toggleLabelWarn, isFirstTime === false && styles.toggleLabelWarnActive]}>
                Rechecking
              </Text>
            </TouchableOpacity>
          </View>

          {/* Inline context hint */}
          {isFirstTime !== null && (
            <View style={[styles.hintBanner, isEscalated ? styles.hintBannerWarn : styles.hintBannerGreen]}>
              <MaterialCommunityIcons
                name={isEscalated ? 'alert-circle-outline' : 'check-circle-outline'}
                size={16}
                color={isEscalated ? '#E65100' : '#2E7D32'}
              />
              <Text style={[styles.hintText, isEscalated ? styles.hintTextWarn : styles.hintTextGreen]}>
                {isEscalated
                  ? 'Escalated treatment plan — higher dose + advisory contact will be shown'
                  : 'Standard PPC recommendation will be shown'}
              </Text>
            </View>
          )}
        </View>

        {/* Q2: Section name */}
        <View style={styles.card}>
          <View style={styles.qHeader}>
            <View style={styles.qBadge}><Text style={styles.qBadgeText}>2</Text></View>
            <Text style={styles.qTitle}>Section name / identifier</Text>
          </View>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Block A, North Field, Row 3…"
            placeholderTextColor="#BDBDBD"
            value={sectionName}
            onChangeText={setSectionName}
            returnKeyType="done"
          />
        </View>

        {/* Q3: Acre size */}
        <View style={styles.card}>
          <View style={styles.qHeader}>
            <View style={styles.qBadge}><Text style={styles.qBadgeText}>3</Text></View>
            <Text style={styles.qTitle}>Tea plantation size</Text>
          </View>
          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => setAcreSize(a => Math.max(parseFloat((a - 0.5).toFixed(1)), 0.5))}
            >
              <MaterialIcons name="remove" size={24} color="#2E7D32" />
            </TouchableOpacity>
            <View style={styles.stepDisplay}>
              <Text style={styles.stepValue}>{acreSize}</Text>
              <Text style={styles.stepUnit}>Hectares</Text>
            </View>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => setAcreSize(a => Math.min(parseFloat((a + 0.5).toFixed(1)), 100))}
            >
              <MaterialIcons name="add" size={24} color="#2E7D32" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Q4: Last pesticide use */}
        <View style={styles.card}>
          <View style={styles.qHeader}>
            <View style={styles.qBadge}><Text style={styles.qBadgeText}>4</Text></View>
            <Text style={styles.qTitle}>Last pesticide application</Text>
          </View>
          <View style={styles.optionList}>
            {PESTICIDE_OPTIONS.map(option => {
              const selected = lastPesticide === option;
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.optionRow, selected && styles.optionRowSelected]}
                  onPress={() => setLastPesticide(option)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                    {selected && <View style={styles.radioInner} />}
                  </View>
                  <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Escalated advisory notice */}
        {isEscalated && (
          <View style={styles.advisoryCard}>
            <MaterialCommunityIcons name="phone-in-talk-outline" size={22} color="#E65100" />
            <View style={styles.advisoryTextBlock}>
              <Text style={styles.advisoryTitle}>Advisory Contact Will Be Shown</Text>
              <Text style={styles.advisoryBody}>
                Since the pest was not controlled previously, the result page will include an escalated dose plan and a direct link to connect with a plant protection advisor.
              </Text>
            </View>
          </View>
        )}

      </ScrollView>

      {/* Sticky submit */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.submitBtn, isEscalated && styles.submitBtnWarn]}
          onPress={handleSubmit}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons
            name={isEscalated ? 'clipboard-alert-outline' : 'clipboard-check-outline'}
            size={22}
            color="#fff"
          />
          <Text style={styles.submitLabel}>
            {isEscalated ? 'Get Escalated Treatment Plan' : 'Get Recommendation'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7F5' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8F5E9',
  },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  logo:        { width: 100, height: 36 },
  headerRight: { width: 36 },

  scroll:       { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 12 },

  pageTitle:    { fontSize: 22, fontWeight: '800', color: '#1B5E20', marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: '#666', lineHeight: 19, marginBottom: 20 },

  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },

  qHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 },
  qBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  qTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: '#1B1B1B' },

  /* Q1 toggle */
  toggleRow: { flexDirection: 'row', gap: 12 },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2E7D32',
    backgroundColor: '#F1FAF1',
  },
  toggleBtnActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  toggleBtnWarn: {
    borderColor: '#E65100',
    backgroundColor: '#FFF3EE',
  },
  toggleBtnWarnActive: {
    backgroundColor: '#E65100',
    borderColor: '#E65100',
  },
  toggleLabel: { fontSize: 14, fontWeight: '700', color: '#2E7D32' },
  toggleLabelActive: { color: '#fff' },
  toggleLabelWarn: { color: '#E65100' },
  toggleLabelWarnActive: { color: '#fff' },

  hintBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
  },
  hintBannerGreen: { backgroundColor: '#E8F5E9' },
  hintBannerWarn:  { backgroundColor: '#FFF3E0' },
  hintText: { flex: 1, fontSize: 12, lineHeight: 17 },
  hintTextGreen: { color: '#2E7D32' },
  hintTextWarn:  { color: '#E65100' },

  /* Q2 text input */
  textInput: {
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#FAFAFA',
  },

  /* Q3 stepper */
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24 },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDisplay: { alignItems: 'center', minWidth: 70 },
  stepValue: { fontSize: 26, fontWeight: '800', color: '#2E7D32' },
  stepUnit:  { fontSize: 12, color: '#888', marginTop: 2 },

  /* Q4 options */
  optionList: { gap: 8 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
  },
  optionRowSelected: {
    borderColor: '#2E7D32',
    backgroundColor: '#F1FAF1',
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#BDBDBD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: { borderColor: '#2E7D32' },
  radioInner: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: '#2E7D32' },
  optionLabel: { fontSize: 14, color: '#555' },
  optionLabelSelected: { color: '#1B5E20', fontWeight: '600' },

  /* Escalated advisory notice */
  advisoryCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FFF8F0',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#E65100',
  },
  advisoryTextBlock: { flex: 1 },
  advisoryTitle: { fontSize: 14, fontWeight: '700', color: '#E65100', marginBottom: 4 },
  advisoryBody:  { fontSize: 13, color: '#795548', lineHeight: 19 },

  /* Footer */
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: '#F5F7F5',
    borderTopWidth: 1,
    borderTopColor: '#E8F5E9',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#2E7D32',
    paddingVertical: 16,
    borderRadius: 14,
    elevation: 3,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  submitBtnWarn: {
    backgroundColor: '#E65100',
    shadowColor: '#E65100',
  },
  submitLabel: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default PestQuestionnaireScreen;
