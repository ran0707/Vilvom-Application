import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { getUserProfile } from '../services/authApi';

const SUPPORT_EMAIL = 'info@vilvom.com';

const FAQ_ITEMS = [
  {
    q: 'How does pest detection work?',
    a: 'Take a clear photo of the affected crop area using the camera feature. Our AI model analyses the image and identifies pest infestations, then provides treatment recommendations tailored to your region.',
  },
  {
    q: 'How do I book a drone service?',
    a: 'Go to the Drone tab or Profile → Drone Service. Select your preferred date and time slot, confirm your GPS farm location, and submit the booking. Our team will contact you to confirm the operation.',
  },
  {
    q: 'Is my farm data kept private?',
    a: 'Yes. Your farm location, crop images, and personal details are stored securely and are never sold to third parties. Please refer to our Privacy Policy at vilvom.com for full details.',
  },
  {
    q: 'What should I do if the app crashes or freezes?',
    a: 'Force-close and reopen the app. If the issue persists, clear the app cache from your device settings or reinstall the latest version. Contact us at info@vilvom.com if the problem continues.',
  },
  {
    q: 'How do I change my language?',
    a: 'Go to Profile → App Language and select your preferred language. The app supports English, Tamil, Malayalam, Hindi, Telugu, Assamese, and Bengali.',
  },
  {
    q: 'How do I update my profile information?',
    a: 'Tap your profile avatar or name at the top of the Profile tab to edit it inline. For full profile details, use the Edit Profile option in your account settings.',
  },
];

const ContactCard = ({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  onPress,
}: {
  icon: string;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  onPress?: () => void;
}) => (
  <TouchableOpacity
    style={styles.contactCard}
    onPress={onPress}
    activeOpacity={onPress ? 0.75 : 1}
    disabled={!onPress}
  >
    <View style={[styles.contactIconWrap, { backgroundColor: iconBg }]}>
      <MaterialIcons name={icon as any} size={22} color={iconColor} />
    </View>
    <View style={styles.contactInfo}>
      <Text style={styles.contactLabel}>{label}</Text>
      <Text style={[styles.contactValue, onPress && styles.contactValueLink]}>{value}</Text>
    </View>
    {onPress && <MaterialIcons name="chevron-right" size={20} color="#ccc" />}
  </TouchableOpacity>
);

const FaqItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.faqItem}>
      <TouchableOpacity style={styles.faqQuestion} onPress={() => setOpen(v => !v)} activeOpacity={0.8}>
        <Text style={styles.faqQuestionText}>{q}</Text>
        <MaterialIcons name={open ? 'expand-less' : 'expand-more'} size={22} color="#2E7D32" />
      </TouchableOpacity>
      {open && <Text style={styles.faqAnswer}>{a}</Text>}
    </View>
  );
};

const HelpSupportScreen = () => {
  const navigation = useNavigation();
  const [showDeleteForm, setShowDeleteForm] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleEmailSupport = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Support%20Request%20-%20Vilvom%20App`);
  };

  const handleDeleteRequest = async () => {
    Alert.alert(
      'Confirm Account Deletion Request',
      'This will send a deletion request email to our support team. Your account will be reviewed and permanently deleted within 7 business days.\n\nThis action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Request',
          style: 'destructive',
          onPress: async () => {
            setSubmitting(true);
            try {
              let userEmail = '';
              let userName = '';
              try {
                const res = await getUserProfile();
                userEmail = res.user?.email || res.user?.phone || '';
                userName = res.user?.profileInfo?.fullName || res.user?.name || '';
              } catch {
                // proceed without user details
              }

              const reason = deleteReason.trim() || 'No reason provided';
              const subject = encodeURIComponent('Account Deletion Request – Vilvom App');
              const body = encodeURIComponent(
                `Hello Vilvom Support Team,\n\nI would like to request the permanent deletion of my Vilvom account and all associated data.\n\nAccount Details:\n  Name: ${userName}\n  Email / Phone: ${userEmail}\n\nReason for deletion:\n  ${reason}\n\nPlease confirm once my account and data have been removed.\n\nThank you,\n${userName}`,
              );

              await Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`);
              setShowDeleteForm(false);
              setDeleteReason('');
            } catch {
              Alert.alert('Error', `Unable to open email client. Please send your request manually to ${SUPPORT_EMAIL}`);
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help &amp; Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Hero banner ── */}
        <View style={styles.heroBanner}>
          <View style={styles.heroIconWrap}>
            <MaterialIcons name="support-agent" size={36} color="#2E7D32" />
          </View>
          <Text style={styles.heroTitle}>How can we help you?</Text>
          <Text style={styles.heroSub}>
            Our support team is available Monday to Friday, 09:00 – 18:00 IST.
            We usually respond within one business day.
          </Text>
        </View>

        {/* ── Contact Us ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CONTACT US</Text>
          <View style={styles.card}>
            <ContactCard
              icon="email"
              iconBg="#E8F5E9"
              iconColor="#2E7D32"
              label="Email Support"
              value={SUPPORT_EMAIL}
              onPress={handleEmailSupport}
            />
            <View style={styles.divider} />
            <ContactCard
              icon="schedule"
              iconBg="#FFF3E0"
              iconColor="#E65100"
              label="Support Hours"
              value="Mon – Fri  •  09:00 – 18:00 IST"
            />
          </View>
        </View>

        {/* ── FAQ ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>FREQUENTLY ASKED QUESTIONS</Text>
          <View style={styles.card}>
            {FAQ_ITEMS.map((item, i) => (
              <View key={i}>
                <FaqItem q={item.q} a={item.a} />
                {i < FAQ_ITEMS.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>

        {/* ── Account & Data ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCOUNT &amp; DATA</Text>
          <View style={styles.card}>

            {/* Privacy Policy */}
            <TouchableOpacity
              style={styles.accountRow}
              onPress={() => Linking.openURL('https://vilvom.com/privacy-policy')}
              activeOpacity={0.75}
            >
              <View style={[styles.accountIconWrap, { backgroundColor: '#F3E5F5' }]}>
                <MaterialIcons name="privacy-tip" size={20} color="#7B1FA2" />
              </View>
              <View style={styles.accountRowText}>
                <Text style={styles.accountRowTitle}>Privacy Policy</Text>
                <Text style={styles.accountRowSub}>How we handle your data</Text>
              </View>
              <MaterialIcons name="open-in-new" size={18} color="#ccc" />
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Delete Account */}
            <TouchableOpacity
              style={styles.accountRow}
              onPress={() => setShowDeleteForm(v => !v)}
              activeOpacity={0.75}
            >
              <View style={[styles.accountIconWrap, { backgroundColor: '#FFEBEE' }]}>
                <MaterialIcons name="delete-forever" size={20} color="#C62828" />
              </View>
              <View style={styles.accountRowText}>
                <Text style={[styles.accountRowTitle, { color: '#C62828' }]}>Delete My Account</Text>
                <Text style={styles.accountRowSub}>Request permanent account deletion</Text>
              </View>
              <MaterialIcons
                name={showDeleteForm ? 'expand-less' : 'expand-more'}
                size={22}
                color="#C62828"
              />
            </TouchableOpacity>

            {/* Delete Account Form — expands inline */}
            {showDeleteForm && (
              <View style={styles.deleteForm}>
                <View style={styles.deleteWarningRow}>
                  <Ionicons name="warning" size={18} color="#E65100" />
                  <Text style={styles.deleteWarningText}>
                    Your account, farm data, pest detection history, and drone booking records will be
                    permanently deleted within <Text style={{ fontWeight: '700' }}>7 business days</Text>.
                    This action is irreversible.
                  </Text>
                </View>

                <Text style={styles.deleteReasonLabel}>Reason for deletion (optional)</Text>
                <TextInput
                  style={styles.deleteReasonInput}
                  multiline
                  numberOfLines={3}
                  placeholder="e.g. No longer using the service, switching to another platform…"
                  placeholderTextColor="#bbb"
                  value={deleteReason}
                  onChangeText={setDeleteReason}
                  textAlignVertical="top"
                />

                <Text style={styles.deleteEmailNote}>
                  A deletion request email will be sent to{' '}
                  <Text style={styles.deleteEmailBold}>{SUPPORT_EMAIL}</Text> with your account
                  details. Our team will confirm once your data has been removed.
                </Text>

                <TouchableOpacity
                  style={styles.deleteSubmitBtn}
                  onPress={handleDeleteRequest}
                  disabled={submitting}
                  activeOpacity={0.8}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <MaterialIcons name="send" size={18} color="#fff" />
                      <Text style={styles.deleteSubmitText}>Send Deletion Request</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* ── App version ── */}
        <Text style={styles.versionText}>Vilvom v1.0.0  •  info@vilvom.com</Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F7F4' },
  scroll: { flex: 1 },

  // ── Header ──
  header: {
    backgroundColor: '#2E7D32',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },

  // ── Hero ──
  heroBanner: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 28,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F5E9',
  },
  heroIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1B5E20',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSub: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },

  // ── Section ──
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F4F0',
  },
  divider: { height: 1, backgroundColor: '#F5F5F5', marginLeft: 64 },

  // ── Contact card ──
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  contactIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInfo: { flex: 1 },
  contactLabel: { fontSize: 11, color: '#999', marginBottom: 2 },
  contactValue: { fontSize: 14, fontWeight: '600', color: '#333' },
  contactValueLink: { color: '#2E7D32', textDecorationLine: 'underline' },

  // ── FAQ ──
  faqItem: { paddingHorizontal: 16, paddingVertical: 14 },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  faqQuestionText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#222', lineHeight: 20 },
  faqAnswer: { marginTop: 10, fontSize: 13, color: '#555', lineHeight: 20 },

  // ── Account rows ──
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  accountIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountRowText: { flex: 1 },
  accountRowTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 2 },
  accountRowSub: { fontSize: 12, color: '#999' },

  // ── Delete form ──
  deleteForm: {
    backgroundColor: '#FFF8F8',
    marginHorizontal: 12,
    marginBottom: 14,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    gap: 12,
  },
  deleteWarningRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 10,
  },
  deleteWarningText: { flex: 1, fontSize: 12, color: '#BF360C', lineHeight: 18 },
  deleteReasonLabel: { fontSize: 12, fontWeight: '600', color: '#555' },
  deleteReasonInput: {
    borderWidth: 1,
    borderColor: '#FFCDD2',
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    color: '#333',
    backgroundColor: '#fff',
    minHeight: 80,
  },
  deleteEmailNote: { fontSize: 12, color: '#888', lineHeight: 18 },
  deleteEmailBold: { fontWeight: '700', color: '#555' },
  deleteSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#C62828',
    borderRadius: 10,
    paddingVertical: 12,
  },
  deleteSubmitText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // ── Footer ──
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#bbb',
    marginTop: 24,
  },
});

export default HelpSupportScreen;
