import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
  Linking,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import {
  getUserProfile,
  updateUserProfile,
  logout,
  isAuthenticated,
  User,
} from '../services/authApi';
import { useNavigation } from '@react-navigation/native';
import NotificationPopup from '../components/NotificationPopup';
import { notifications as staticNotifications } from '../constants/statics';

const LANG_NAMES: Record<string, string> = {
  en: 'English',
  ta: 'தமிழ்',
  ml: 'മലയാളം',
  hi: 'हिन्दी',
  te: 'తెలుగు',
  as: 'অসমীয়া',
  bn: 'বাংলা',
};

const ProfileTab = () => {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [perms, setPerms] = useState({ camera: false, location: false, notifications: false });
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const currentLangCode = i18n.language?.split('-')[0] || 'en';
  const currentLangLabel = LANG_NAMES[currentLangCode] || currentLangCode;

  useEffect(() => {
    fetchUserProfile();
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    if (Platform.OS !== 'android') {
      setPerms({ camera: true, location: true, notifications: true });
      return;
    }
    try {
      const camera = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
      const location = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
      let notifications = true;
      const sdk = typeof Platform.Version === 'number' ? Platform.Version : parseInt(String(Platform.Version), 10);
      if (sdk >= 33) {
        notifications = await PermissionsAndroid.check('android.permission.POST_NOTIFICATIONS' as any);
      }
      setPerms({ camera, location, notifications });
    } catch {
      // ignore — treat as granted
    }
  };

  const showNotifications = () => {
    setNotificationVisible(true);
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 1, duration: 250, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  };

  const hideNotifications = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 0, duration: 150, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => setNotificationVisible(false));
  };

  const fetchUserProfile = async () => {
    try {
      const auth = await isAuthenticated();
      if (!auth) {
        setUser({ id: 'guest', name: 'User', email: '' });
        return;
      }
      const response = await getUserProfile();
      setUser(response.user);
      if (response.user.profileImage) {
        setAvatarUri(response.user.profileImage);
      } else if (response.user.profileInfo?.profileImage) {
        setAvatarUri(response.user.profileInfo.profileImage);
      }
    } catch {
      Alert.alert(t('profile.load_error_title') as string, t('profile.load_error_message') as string);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async () => {
    if (!editedName.trim()) return;
    setSavingName(true);
    try {
      await updateUserProfile(editedName.trim());
      setUser(prev => prev ? { ...prev, name: editedName.trim() } : prev);
      setIsEditingName(false);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to update name');
    } finally {
      setSavingName(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      t('profile.logout_confirm_title') as string,
      t('profile.logout_confirm_message') as string,
      [
        { text: t('common.cancel') as string, style: 'cancel' },
        {
          text: t('profile.logout') as string,
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              (navigation as any).reset({ index: 0, routes: [{ name: 'GetStarted' }] });
            } catch (e) {
              console.error('Logout error:', e);
            }
          },
        },
      ],
    );
  };

  const userName = user?.profileInfo?.fullName || user?.name || t('profile.title');
  const userEmail = user?.email || user?.phone || '';

  const quickActions = [
    { icon: 'drone', lib: 'mci', label: t('profile.drone_service') as string, route: 'DroneContact' },
    { icon: 'cart', lib: 'ion', label: t('profile.recent_orders') as string, route: 'RecentOrders' },
    { icon: 'bicycle', lib: 'ion', label: t('profile.order_tracking') as string, route: 'OrderTracking' },
    { icon: 'store', lib: 'mi', label: t('profile.become_seller') as string, route: 'BecomeSeller' },
  ];

  const permItems = [
    { key: 'location', icon: 'location-on', label: 'Location', granted: perms.location },
    { key: 'camera', icon: 'camera-alt', label: 'Camera', granted: perms.camera },
    { key: 'notifications', icon: 'notifications', label: 'Notifications', granted: perms.notifications },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              const currentName = user?.profileInfo?.fullName || user?.name || '';
              setEditedName(currentName);
              setIsEditingName(true);
            }}
            style={styles.avatarWrap}
          >
            <Image
              source={{ uri: avatarUri || 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }}
              style={styles.avatar}
            />
            <View style={styles.avatarEditBadge}>
              <MaterialIcons name="edit" size={12} color="#fff" />
            </View>
          </TouchableOpacity>

          {isEditingName ? (
            <View style={styles.nameEditRow}>
              <TextInput
                style={styles.nameInput}
                value={editedName}
                onChangeText={setEditedName}
                autoFocus
                selectTextOnFocus
                placeholderTextColor="#ccc"
              />
              <TouchableOpacity onPress={handleSaveName} disabled={savingName} style={styles.nameActionBtn}>
                {savingName
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <MaterialIcons name="check" size={20} color="#fff" />}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsEditingName(false)} style={[styles.nameActionBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <MaterialIcons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.name}>{userName as string}</Text>
          )}

          {!!userEmail && <Text style={styles.email}>{userEmail}</Text>}

          <View style={styles.headerChips}>
            <View style={styles.headerChip}>
              <MaterialIcons name="eco" size={12} color="#A5D6A7" />
              <Text style={styles.headerChipText}>{t('profile.tea_farmer')}</Text>
            </View>
          </View>
        </View>

        {/* ── Permissions ── */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionLabel}>{t('profile.app_permissions')}</Text>
          <View style={styles.permsRow}>
            {permItems.map(p => (
              <View key={p.key} style={[styles.permChip, p.granted ? styles.permGranted : styles.permDenied]}>
                <MaterialIcons name={p.icon as any} size={16} color={p.granted ? '#2E7D32' : '#E65100'} />
                <Text style={[styles.permLabel, { color: p.granted ? '#2E7D32' : '#E65100' }]}>{p.label}</Text>
                {p.granted
                  ? <MaterialIcons name="check-circle" size={14} color="#4CAF50" />
                  : (
                    <TouchableOpacity onPress={() => Linking.openSettings()}>
                      <Text style={styles.permGrant}>{t('profile.grant')}</Text>
                    </TouchableOpacity>
                  )}
              </View>
            ))}
          </View>
        </View>

        {/* ── Language ── */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionLabel}>{t('profile.language')}</Text>
          <TouchableOpacity
            style={styles.languageCard}
            onPress={() => (navigation as any).navigate('LanguageSelection')}
            activeOpacity={0.85}
          >
            <View style={styles.languageIcon}>
              <Ionicons name="language" size={22} color="#fff" />
            </View>
            <View style={styles.languageInfo}>
              <Text style={styles.languageTitle}>{t('profile.app_language_label')}</Text>
              <Text style={styles.languageCurrent}>{currentLangLabel}</Text>
            </View>
            <View style={styles.languageChevronWrap}>
              <MaterialIcons name="chevron-right" size={22} color="#2E7D32" />
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Quick Actions Grid ── */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionLabel}>{t('profile.services')}</Text>
          <View style={styles.grid}>
            {quickActions.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={styles.gridItem}
                onPress={() => (navigation as any).navigate(item.route)}
                activeOpacity={0.8}
              >
                <View style={styles.gridIconWrap}>
                  {item.lib === 'mci'
                    ? <MaterialCommunityIcons name={item.icon as any} size={22} color="#2E7D32" />
                    : item.lib === 'ion'
                    ? <Ionicons name={item.icon as any} size={22} color="#2E7D32" />
                    : <MaterialIcons name={item.icon as any} size={22} color="#2E7D32" />}
                </View>
                <Text style={styles.gridLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── More Options ── */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionLabel}>{t('profile.more')}</Text>
          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuRow} onPress={showNotifications}>
              <View style={[styles.menuIconWrap, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="notifications" size={18} color="#1565C0" />
              </View>
              <Text style={styles.menuLabel}>{t('profile.notifications') as string}</Text>
              <MaterialIcons name="chevron-right" size={20} color="#ccc" />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuRow} onPress={() => (navigation as any).navigate('Feedback')}>
              <View style={[styles.menuIconWrap, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="chatbox" size={18} color="#E65100" />
              </View>
              <Text style={styles.menuLabel}>{t('profile.feedback')}</Text>
              <MaterialIcons name="chevron-right" size={20} color="#ccc" />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => Alert.alert(
                t('profile.help_support') as string,
                'Email: support@vilvom.com\nPhone: +91-1800-180-1551\nHours: Mon–Fri 09:00–18:00',
              )}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: '#F3E5F5' }]}>
                <MaterialIcons name="support-agent" size={18} color="#7B1FA2" />
              </View>
              <Text style={styles.menuLabel}>{t('profile.help_support') as string}</Text>
              <MaterialIcons name="chevron-right" size={20} color="#ccc" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Logout ── */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <MaterialIcons name="logout" size={20} color="#D32F2F" />
          <Text style={styles.logoutText}>{t('profile.logout') as string}</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>

      <NotificationPopup
        visible={notificationVisible}
        opacityAnim={opacityAnim}
        scaleAnim={scaleAnim}
        notifications={staticNotifications}
        onClose={hideNotifications}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F7F4' },
  scroll: { flex: 1 },

  // ── Header ──
  header: {
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 36,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 14,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    borderColor: '#A5D6A7',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1B5E20',
    borderRadius: 10,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  nameEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  nameInput: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    borderBottomWidth: 1.5,
    borderBottomColor: '#A5D6A7',
    paddingVertical: 2,
    paddingHorizontal: 4,
    minWidth: 160,
  },
  nameActionBtn: {
    backgroundColor: '#388E3C',
    borderRadius: 16,
    padding: 4,
  },
  email: {
    fontSize: 13,
    color: '#A5D6A7',
    marginBottom: 10,
  },
  headerChips: {
    flexDirection: 'row',
    gap: 8,
  },
  headerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  headerChipText: {
    fontSize: 12,
    color: '#C8E6C9',
    fontWeight: '500',
  },

  // ── Section wrapper ──
  sectionWrap: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },

  // ── Permissions ──
  permsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  permChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    flex: 1,
    minWidth: 100,
  },
  permGranted: {
    backgroundColor: '#E8F5E9',
    borderColor: '#A5D6A7',
  },
  permDenied: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FFCC80',
  },
  permLabel: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  permGrant: {
    fontSize: 11,
    color: '#E65100',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  // ── Language ──
  languageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  languageIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageInfo: { flex: 1 },
  languageTitle: { fontSize: 12, color: '#888', marginBottom: 3 },
  languageCurrent: { fontSize: 18, fontWeight: '700', color: '#1B5E20' },
  languageChevronWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Quick Actions Grid ──
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F4F0',
    gap: 10,
  },
  gridIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },

  // ── Menu Card ──
  menuCard: {
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
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: 15, color: '#333', fontWeight: '500' },
  menuDivider: { height: 1, backgroundColor: '#F5F5F5', marginLeft: 64 },

  // ── Logout ──
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 15,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FFCDD2',
    backgroundColor: '#FFF5F5',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D32F2F',
  },
});

export default ProfileTab;
