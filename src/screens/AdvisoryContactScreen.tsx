import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Linking,
  Modal,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import StarRating from '../components/StarRating';
import { submitServiceRating } from '../services/ratingApi';

type Contact = {
  id: string;
  name: string;
  role: string;
  phone?: string;
  email?: string;
  region: string;
};

const SAMPLE_CONTACTS: Contact[] = [
  {
    id: '1',
    name: 'Dr. Arjun Kumar',
    role: 'Senior Agronomist',
    phone: '+91 9876543210',
    email: 'arjun@teaadvisory.org',
    region: 'North',
  },
  {
    id: '2',
    name: 'Ms. Kavita Rao',
    role: 'Crop Protection Specialist',
    phone: '+91 9123456789',
    email: 'kavita@teaadvisory.org',
    region: 'South',
  },
  {
    id: '3',
    name: 'Mr. Ramesh Das',
    role: 'Field Advisor',
    phone: '+91 9988777665',
    email: 'ramesh@teaadvisory.org',
    region: 'East',
  },
  {
    id: '4',
    name: 'Ms. Nisha Menon',
    role: 'Pest Management Lead',
    phone: '+91 9012345678',
    email: 'nisha@teaadvisory.org',
    region: 'West',
  },
  {
    id: '5',
    name: 'Mr. S. Iyer',
    role: 'Soil & Fertility Expert',
    phone: '+91 9090990909',
    email: 'iyer@teaadvisory.org',
    region: 'North',
  },
  {
    id: '6',
    name: 'Ms. Latha Pillai',
    role: 'Extension Officer',
    phone: '+91 9444433322',
    email: 'latha@teaadvisory.org',
    region: 'South',
  },
];

const REGIONS = ['All', 'North', 'South', 'East', 'West'];

const AdvisoryContactScreen: React.FC = () => {
  const navigation: any = useNavigation();
  const [region, setRegion] = useState<string>('All');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contactRatings, setContactRatings] = useState<{
    [key: string]: number;
  }>({});

  const filtered = useMemo(() => {
    if (region === 'All') return SAMPLE_CONTACTS;
    return SAMPLE_CONTACTS.filter(c => c.region === region);
  }, [region]);

  const handleContactCall = (contact: Contact) => {
    if (contact.phone) {
      Linking.openURL(`tel:${contact.phone}`);
      // Show rating modal after a delay to simulate call completion
      setTimeout(() => {
        setSelectedContact(contact);
        setShowRatingModal(true);
      }, 2000);
    }
  };

  const handleRatingSubmit = async (rating: number) => {
    if (selectedContact) {
      try {
        // Submit rating to API
        await submitServiceRating({
          serviceType: 'advisory',
          serviceId: selectedContact.id,
          rating: rating,
          contactId: selectedContact.id,
        });

        setContactRatings(prev => ({
          ...prev,
          [selectedContact.id]: rating,
        }));

        Alert.alert(
          'Thank you!',
          `You rated ${selectedContact.name} ${rating} stars. Your feedback helps improve our advisory services.`,
        );
        setShowRatingModal(false);
        setSelectedContact(null);
      } catch (error) {
        console.error('Rating submission failed:', error);
        Alert.alert(
          'Error',
          'Failed to submit rating. Please try again later.',
        );
      }
    }
  };

  const renderRow = ({ item }: { item: Contact }) => (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.name
              .split(' ')
              .map(n => n[0])
              .slice(0, 2)
              .join('')}
          </Text>
        </View>
      </View>
      <View style={styles.rowMid}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.role}>
          {item.role} · {item.region}
        </Text>
        {contactRatings[item.id] && (
          <View style={styles.ratingDisplay}>
            <Text style={styles.ratingText}>Your Rating: </Text>
            <StarRating
              rating={contactRatings[item.id]}
              size={16}
              disabled={true}
              showText={false}
            />
          </View>
        )}
        <View style={styles.contactLine}>
          {item.phone ? (
            <TouchableOpacity
              onPress={() => Linking.openURL(`tel:${item.phone}`)}
            >
              <Text style={styles.contactText}>{item.phone}</Text>
            </TouchableOpacity>
          ) : null}
          {item.email ? (
            <TouchableOpacity
              onPress={() => Linking.openURL(`mailto:${item.email}`)}
            >
              <Text style={[styles.contactText, { marginLeft: 12 }]}>
                {item.email}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
      <View style={styles.rowRight}>
        <TouchableOpacity
          style={styles.callBtn}
          onPress={() => handleContactCall(item)}
        >
          <Icon name="phone" size={18} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.rateBtn}
          onPress={() => {
            setSelectedContact(item);
            setShowRatingModal(true);
          }}
        >
          <Icon name="star" size={16} color="#FFD700" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={22} color="#234c39" />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.title}>Advisory Contacts</Text>
          <Text style={styles.subtitle}>
            Expert contacts by region — quick calls & emails
          </Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        {REGIONS.map(r => (
          <TouchableOpacity
            key={r}
            onPress={() => setRegion(r)}
            style={[styles.regionPill, region === r && styles.regionPillActive]}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.regionText,
                region === r && styles.regionTextActive,
              ]}
            >
              {r}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderText, { flex: 2 }]}>Name</Text>
        <Text style={[styles.tableHeaderText, { flex: 2 }]}>Role</Text>
        <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>
          Action
        </Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        renderItem={renderRow}
        contentContainerStyle={{ padding: 12 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />

      {/* Rating Modal */}
      <Modal
        visible={showRatingModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRatingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rate Advisory Service</Text>
              <TouchableOpacity
                onPress={() => setShowRatingModal(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedContact && (
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{selectedContact.name}</Text>
                <Text style={styles.contactRole}>{selectedContact.role}</Text>
              </View>
            )}

            <StarRating
              title="How was your advisory experience?"
              onRatingChange={handleRatingSubmit}
              size={40}
            />

            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => setShowRatingModal(false)}
            >
              <Text style={styles.skipButtonText}>Skip Rating</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f6fbf8' },
  header: { padding: 18, borderBottomWidth: 1, borderBottomColor: '#eef6ef' },
  backBtn: { position: 'absolute', left: 12, top: 18, padding: 6 },
  headerTitle: { alignItems: 'center', width: '100%' },
  title: { fontSize: 20, fontWeight: '800', color: '#0b1f12' },
  subtitle: { marginTop: 6, color: '#476a55' },

  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  regionPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e6efe8',
  },
  regionPillActive: { backgroundColor: '#1b8b47', borderColor: '#17823b' },
  regionText: { color: '#234c39', fontWeight: '700' },
  regionTextActive: { color: '#fff' },

  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    marginHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  tableHeaderText: { color: '#607a6a', fontWeight: '700' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    elevation: 1,
  },
  rowLeft: { width: 48, alignItems: 'center', justifyContent: 'center' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#e9f7ee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#0b6b3a', fontWeight: '800' },
  rowMid: { flex: 1, paddingLeft: 12 },
  name: { fontSize: 15, fontWeight: '700', color: '#092015' },
  role: { marginTop: 4, color: '#5a6f61' },
  contactLine: { flexDirection: 'row', marginTop: 8, alignItems: 'center' },
  contactText: { color: '#0b6b3a', fontWeight: '600' },
  rowRight: { width: 56, alignItems: 'center', justifyContent: 'center' },
  callBtn: {
    backgroundColor: '#1b8b47',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  rateBtn: {
    backgroundColor: '#FFF',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  ratingDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    marginRight: 4,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  contactInfo: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  contactRole: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  skipButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#999',
    fontSize: 16,
  },
});

export default AdvisoryContactScreen;
