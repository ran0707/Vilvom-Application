import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Linking,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

const PPCInfoScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [openVerified, setOpenVerified] = useState(true);
  const [openSources, setOpenSources] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: '#F6F7FB' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F7FB" />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => (navigation as any).navigate('MainTabs')}
        >
          <MaterialIcons name="arrow-back" size={22} color="#222" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>PPC Info</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Image
            source={require('../../assets/tealogo.png')}
            style={styles.logo}
          />

          <Text style={styles.heading}>PPC Recommendations — Verified</Text>
          <Text style={styles.lead}>
            Recommendations are informed by our PPC engine and cross-checked
            against public guidelines and expert review.
          </Text>

          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => setOpenVerified(v => !v)}
          >
            <Text style={styles.sectionTitle}>What we verified</Text>
            <MaterialIcons
              name={openVerified ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
              size={22}
              color="#666"
            />
          </TouchableOpacity>

          {openVerified && (
            <View style={styles.sectionBody}>
              <Text style={styles.bodyText}>
                • Aligns with field-proven treatments commonly used in tea
                plantations.
              </Text>
              <Text style={styles.bodyText}>
                • Practices recommended aim to balance effectiveness and cost.
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => setOpenSources(s => !s)}
          >
            <Text style={styles.sectionTitle}>Sources</Text>
            <MaterialIcons
              name={openSources ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
              size={22}
              color="#666"
            />
          </TouchableOpacity>

          {openSources && (
            <View style={styles.sectionBody}>
              <Text style={styles.bodyText}>
                Tea Board of India — public guidance & outreach materials.
              </Text>
              <Text style={styles.bodyText}>
                Internal PPC validation and agronomist review.
              </Text>

              <TouchableOpacity
                style={styles.linkRow}
                onPress={() => Linking.openURL('https://teaboard.gov.in')}
              >
                <Text style={styles.linkText}>Open Tea Board website</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  topBar: {
    height: 56,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F6F7FB',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: { fontSize: 16, fontWeight: '700', color: '#222' },
  container: { padding: 18, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
  },
  logo: { width: 120, height: 120, marginBottom: 12 },
  heading: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  lead: { color: '#555', fontSize: 13, textAlign: 'center', marginBottom: 12 },
  toggleRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    marginTop: 8,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#222' },
  sectionBody: { width: '100%', paddingTop: 6 },
  bodyText: { color: '#444', fontSize: 13, marginBottom: 8 },
  linkRow: { marginTop: 8 },
  linkText: { color: '#2F6CE5', fontWeight: '700' },
});

export default PPCInfoScreen;
