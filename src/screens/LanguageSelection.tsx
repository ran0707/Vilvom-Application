import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { setAppLanguage } from '../i18n';
import Icon from 'react-native-vector-icons/MaterialIcons';

const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'ml', label: 'മലയാളം' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'as', label: 'অসমীয়া' },
  { code: 'bn', label: 'বাংলা' },
];

const LanguageSelection = () => {
  const navigation = useNavigation();

  const select = async (code: string) => {
    await setAppLanguage(code);
    // go back to profile
    (navigation as any).goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Select Language</Text>
      <FlatList
        data={LANGS}
        keyExtractor={i => i.code}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => select(item.code)}
          >
            <Text style={styles.label}>{item.label}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, marginTop: 50, backgroundColor: '#f5f5f5' },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#333',
  },
  row: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  label: { fontSize: 18, color: '#333' },
  sellerSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  sellerLabel: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: '600',
    flex: 1,
    marginLeft: 12,
  },
});

export default LanguageSelection;
