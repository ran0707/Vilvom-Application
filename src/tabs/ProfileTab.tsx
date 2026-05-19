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
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import {
  getUserProfile,
  updateUserProfile,
  logout,
  isAuthenticated,
  User,
} from '../services/authApi';
import FieldHeatmap, { FieldPoint } from '../components/FieldHeatmap';
import * as Storage from '../utils/storage';
import { useNavigation } from '@react-navigation/native';
import Geolocation from '@react-native-community/geolocation';
import {
  requestLocationPermission,
  getCityNameFromCoords,
} from '../utils/homeUtils';
import NotificationPopup from '../components/NotificationPopup';
import { notifications as staticNotifications } from '../constants/statics';
import { Animated, Easing } from 'react-native';

const ProfileTab = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState<User | null>(null);
  // guest flow removed; keep a simple user state
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState<FieldPoint[]>([]);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const showNotifications = () => {
    setNotificationVisible(true);
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideNotifications = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 150,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => setNotificationVisible(false));
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const { t } = useTranslation();

  const fetchUserProfile = async () => {
    try {
      const auth = await isAuthenticated();
      if (!auth) {
        setUser({ id: 'guest', name: 'User', email: '' });
        return;
      }
      const response = await getUserProfile();
      setUser(response.user);

      // Set profile image from user data
      if (response.user.profileImage) {
        setAvatarUri(response.user.profileImage);
      } else if (response.user.profileInfo?.profileImage) {
        setAvatarUri(response.user.profileInfo.profileImage);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // no guest fallback
      Alert.alert(
        t('profile.load_error_title') as string,
        t('profile.load_error_message') as string,
      );
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

  // Load stored heatmap points (if any) or provide a small demo dataset so the UI isn't empty
  useEffect(() => {
    (async () => {
      try {
        const raw = await Storage.getItem('field_points');
        if (raw) {
          const parsed: FieldPoint[] = JSON.parse(raw);
          setPoints(parsed);
        } else {
          // fallback demo points (normalized lat/lng coordinates)
          const demo: FieldPoint[] = [
            { lat: 0.9, lng: 0.1, intensity: 0.9 },
            { lat: 0.7, lng: 0.25, intensity: 0.6 },
            { lat: 0.5, lng: 0.5, intensity: 0.3 },
            { lat: 0.3, lng: 0.8, intensity: 0.7 },
          ];
          setPoints(demo);
        }
      } catch (e) {
        console.warn('Failed to load field points:', e);
      }
    })();
  }, []);

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
              (navigation as any).reset({
                index: 0,
                routes: [{ name: 'GetStarted' }],
              });
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.profileCircle}>
          <Image
            source={{
              uri:
                avatarUri ||
                'https://cdn-icons-png.flaticon.com/512/149/149071.png',
            }}
            style={styles.profileImage}
          />
        </View>
        {/* Editable username */}
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
          <TouchableOpacity
            style={styles.nameRow}
            onPress={() => {
              const currentName = user?.profileInfo?.fullName || user?.name || '';
              setEditedName(currentName);
              setIsEditingName(true);
            }}
          >
            <Text style={styles.name}>
              {user
                ? user.profileInfo?.fullName || user.name || t('profile.title')
                : t('profile.title')}
            </Text>
            <MaterialIcons name="edit" size={16} color="rgba(255,255,255,0.8)" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        )}

        <Text style={styles.subText}>
          {user ? user.email || user.phone || '' : ''}
        </Text>
      </View>

      {/* Status Card */}
      <View style={styles.statusCard}>
        <Text style={styles.sectionTitle}>{t('profile.pests_detected')}</Text>
        <Text style={styles.statusText}>{t('profile.most_common_pest')}</Text>
        <TouchableOpacity style={styles.noGoalBtn}>
          <Text style={styles.noGoalText}>{t('profile.no_action')}</Text>
        </TouchableOpacity>
      </View>

      {/* Features */}
      <View style={styles.featuresCard}>
        <TouchableOpacity
          style={styles.featureRow}
          onPress={() => (navigation as any).navigate('DroneContact')}
        >
          <Icon name="drone" size={24} color="#4CAF50" />
          <Text style={styles.featureText}>{t('profile.drone_service')}</Text>
        </TouchableOpacity>
      
        <TouchableOpacity
          style={styles.featureRow}
          onPress={() => (navigation as any).navigate('RecentOrders')}
        >
          <Ionicons name="cart" size={24} color="#4CAF50" />
          <Text style={styles.featureText}>{t('profile.recent_orders')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.featureRow}
          onPress={() => (navigation as any).navigate('OrderTracking')}
        >
          <Ionicons name="bicycle" size={24} color="#4CAF50" />
          <Text style={styles.featureText}>{t('profile.order_tracking')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.featureRow}
          onPress={() => showNotifications()}
        >
          <Ionicons name="notifications" size={24} color="#4CAF50" />
          <Text style={styles.featureText}>{t('profile.notifications')}</Text>
        </TouchableOpacity>
        {/* <TouchableOpacity
          style={styles.featureRow}
          onPress={() => (navigation as any).navigate('ChangePassword')}
        >
          <Ionicons name="lock-closed" size={24} color="#4CAF50" />
          <Text style={styles.featureText}>Change Password</Text>
        </TouchableOpacity> */}
        <TouchableOpacity
          style={styles.featureRow}
          onPress={() => (navigation as any).navigate('BecomeSeller')}
        >
          <MaterialIcons name="store" size={24} color="#4CAF50" />
          <Text style={styles.featureText}>Become a seller</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.featureRow}
          onPress={() => (navigation as any).navigate('LanguageSelection')}
        >
          <Ionicons name="language" size={24} color="#4CAF50" />
          <Text style={styles.featureText}>
            {t('profile.language_selection')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.featureRow}
          onPress={() => (navigation as any).navigate('Feedback')}
        >
          <Ionicons name="chatbox" size={24} color="#4CAF50" />
          <Text style={styles.featureText}>Feedback</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.featureRow}
          onPress={() => {
            const msg =
              'Email: support@Vilvom.example\nPhone: +91-1234567890\nHours: Mon-Fri 09:00-18:00';
            Alert.alert(t('profile.help_support') as string, msg);
          }}
        >
          <MaterialIcons name="support-agent" size={24} color="#4CAF50" />
          <Text style={styles.featureText}>{t('profile.help_support')}</Text>
        </TouchableOpacity>
      </View>

      {/* Notification Popup (shared with Home) */}
      <NotificationPopup
        visible={notificationVisible}
        opacityAnim={opacityAnim}
        scaleAnim={scaleAnim}
        notifications={staticNotifications}
        onClose={() => hideNotifications()}
      />

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <MaterialIcons name="logout" size={20} color="#fff" />
        <Text style={styles.logoutText}>{t('profile.logout')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fdf9',
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 30,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  profileCircle: {
    height: 80,
    width: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  profileImage: {
    height: 70,
    width: 70,
    borderRadius: 35,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
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
    borderBottomColor: '#fff',
    paddingVertical: 2,
    paddingHorizontal: 4,
    minWidth: 160,
  },
  nameActionBtn: {
    backgroundColor: '#388E3C',
    borderRadius: 16,
    padding: 4,
  },
  subText: {
    fontSize: 14,
    color: '#e8f5e9',
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  editProfileText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 6,
    fontWeight: '500',
  },
  statusCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  noGoalBtn: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  noGoalText: {
    color: '#fff',
    fontWeight: '600',
  },
  featuresCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  featureText: {
    fontSize: 15,
    marginLeft: 12,
    color: '#333',
  },
  routeCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
    alignItems: 'center',
  },
  mapImage: {
    height: 150,
    width: '100%',
    borderRadius: 15,
    marginTop: 10,
  },
  logoutButton: {
    backgroundColor: '#F44336',
    margin: 15,
    padding: 15,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  signupBtn: {
    marginTop: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  signupText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
});

export default ProfileTab;
