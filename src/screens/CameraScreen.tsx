import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
  Dimensions,
  Platform,
  PermissionsAndroid,
  Linking,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Geolocation from '@react-native-community/geolocation';

// Dynamic imports for optional dependencies
let launchCamera: any = null;
let launchImageLibrary: any = null;

try {
  const imagePicker = require('react-native-image-picker');
  launchCamera = imagePicker.launchCamera;
  launchImageLibrary = imagePicker.launchImageLibrary;
} catch {
  console.warn('react-native-image-picker not available');
}

import { detectPest } from '../services/pestDetectionApi';

const { width, height } = Dimensions.get('window');
const FRAME_SIZE = width * 0.62;

const TIPS = [
  { icon: 'white-balance-sunny',  text: 'Good lighting — avoid shadows on the leaf' },
  { icon: 'image-filter-center-focus', text: 'Fill the frame with the affected area' },
  { icon: 'leaf',                 text: 'Include both healthy and damaged parts' },
];

const CameraScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading]   = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const handleImageSelected = async (imageUri: string) => {
    setAnalyzing(true);
    try {
      // Get location first using network accuracy (fast, works indoors/emulator)
      let coords: { lat: number; lng: number } | undefined;
      await new Promise<void>(resolve => {
        Geolocation.getCurrentPosition(
          pos => {
            coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            resolve();
          },
          () => resolve(), // location optional — continue without it
          { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 },
        );
      });

      const result = await detectPest(imageUri, coords);
      // Attach coords to result so PestResultScreen can also use them
      if (coords) {
        (result as any).lat = coords.lat;
        (result as any).lng = coords.lng;
      }
      (navigation as any).navigate('PestQuestionnaire', { result });
    } catch (error: any) {
      let title   = 'Analysis Error';
      let message = error?.message || 'Failed to analyze image. Please try again.';
      if (error?.message?.includes('401') || error?.message?.includes('unauthorized')) {
        title   = 'Authentication Error';
        message = 'Please login again to analyze images.';
      } else if (error?.message?.includes('network') || error?.message?.includes('Cannot reach')) {
        title   = 'Network Error';
        message = 'Cannot reach the server. Check your connection and ensure the backend is running.';
      } else if (error?.message?.includes('timeout')) {
        title   = 'Timeout';
        message = 'Request timed out. Try again with a better connection.';
      } else if (error?.message?.includes('500') || error?.message?.includes('503')) {
        title   = 'Server Error';
        message = 'Server error. Ensure both backend (port 5000) and AI service (port 8000) are running.';
      }
      Alert.alert(title, message);
    } finally {
      setAnalyzing(false);
    }
  };

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'Camera access is needed to take photos for pest detection.',
            buttonPositive: 'Allow',
            buttonNegative: 'Deny',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          openCamera();
        } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          Alert.alert('Camera Permission', 'Enable Camera permission for Vilvom in your device settings.', [{ text: 'OK' }]);
        } else {
          Alert.alert('Permission Required', 'Camera access is needed to take photos.', [
            { text: 'Try Again', onPress: requestCameraPermission },
            { text: 'Cancel', style: 'cancel' },
          ]);
        }
      } catch {
        openCamera();
      }
    } else {
      openCamera();
    }
  };

const requestGalleryPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const sdk = typeof Platform.Version === 'number' ? Platform.Version : parseInt(String(Platform.Version), 10);
        
        if (sdk >= 33) {
          // Android 13+ does not require broad storage permissions to use launchImageLibrary.
          // It safely opens the native system Photo Picker automatically.
          openGallery();
        } else {
          // Legacy check for Android 12 and below (API < 33)
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
            {
              title: 'Gallery Permission',
              message: 'Gallery access is needed to select photos for pest detection.',
              buttonPositive: 'Allow',
              buttonNegative: 'Deny',
            }
          );
          
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            openGallery();
          } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
            Alert.alert('Gallery Permission', 'Enable Storage permission in your device settings.', [
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
              { text: 'Cancel', style: 'cancel' },
            ]);
          } else {
            Alert.alert('Permission Required', 'Gallery access is needed to select photos.', [
              { text: 'Try Again', onPress: requestGalleryPermission },
              { text: 'Cancel', style: 'cancel' },
            ]);
          }
        }
      } catch {
        openGallery();
      }
    } else {
      openGallery();
    }
  };

  const openCamera = () => {
    if (!launchCamera) {
      Alert.alert('Missing module', 'react-native-image-picker is not installed.');
      return;
    }
    setLoading(true);
    launchCamera({ mediaType: 'photo', quality: 0.8, maxWidth: 1600, maxHeight: 1600, includeBase64: true }, (response: any) => {
      setLoading(false);
      if (response.didCancel) return;
      if (response.errorCode === 'camera_unavailable') {
        Alert.alert('No Camera Available', 'This device (or simulator) has no usable camera. Please pick a photo from the gallery instead.');
        return;
      }
      if (response.errorCode === 'permission') {
        Alert.alert('Permission Required', 'Grant camera permission in device settings.', [
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
          { text: 'Cancel', style: 'cancel' },
        ]);
        return;
      }
      if (response.errorMessage) { Alert.alert('Error', response.errorMessage); return; }
      const asset = response.assets?.[0];
      const uri   = asset?.uri || (asset?.base64 ? `data:${asset.type || 'image/jpeg'};base64,${asset.base64}` : null);
      if (uri) handleImageSelected(uri);
      else Alert.alert('Error', 'Could not read captured image');
    });
  };

  const openGallery = () => {
    if (!launchImageLibrary) {
      Alert.alert('Not Available', 'Image picker is not available.');
      return;
    }
    setLoading(true);
    launchImageLibrary({ mediaType: 'photo', quality: 0.8, maxWidth: 1600, maxHeight: 1600, includeBase64: true, selectionLimit: 1 }, (response: any) => {
      setLoading(false);
      if (response.didCancel) return;
      if (response.errorCode === 'permission') {
        Alert.alert('Permission Required', 'Grant gallery permission in device settings.', [
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
          { text: 'Cancel', style: 'cancel' },
        ]);
        return;
      }
      if (response.errorMessage) { Alert.alert('Error', response.errorMessage); return; }
      const asset = response.assets?.[0];
      const uri   = asset?.uri || (asset?.base64 ? `data:${asset.type || 'image/jpeg'};base64,${asset.base64}` : null);
      if (uri) handleImageSelected(uri);
      else Alert.alert('Error', 'No image was selected. Please try again.');
    });
  };

  const insets = useSafeAreaInsets();
  const busy = loading || analyzing;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ── */}
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

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Title block ── */}
        <Text style={styles.title}>AI Pest Detection</Text>
        <Text style={styles.subtitle}>
          Scan a tea leaf to instantly identify pests and get treatment recommendations
        </Text>

        {/* ── Scan frame ── */}
        <View style={styles.frameWrap}>
          {busy ? (
            <View style={styles.frameInner}>
              <ActivityIndicator size="large" color="#2E7D32" />
              <Text style={styles.analyzingText}>
                {analyzing ? 'Analyzing image…' : 'Opening…'}
              </Text>
            </View>
          ) : (
            <View style={styles.frameInner}>
              <MaterialCommunityIcons name="leaf" size={64} color="#A5D6A7" />
              <Text style={styles.frameTip}>Point at affected tea leaf</Text>
            </View>
          )}
          {/* Corner markers */}
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>

        {/* ── Tips ── */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Tips for best results</Text>
          {TIPS.map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <View style={styles.tipIcon}>
                <MaterialCommunityIcons name={tip.icon as any} size={16} color="#2E7D32" />
              </View>
              <Text style={styles.tipText}>{tip.text}</Text>
            </View>
          ))}
        </View>

      </ScrollView>

      {/* ── Action buttons (sticky bottom) ── */}
      <View style={[styles.actionsWrap, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.primaryBtn, busy && styles.btnDisabled]}
          onPress={requestCameraPermission}
          disabled={busy}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="camera" size={22} color="#FFF" />
          <Text style={styles.primaryBtnText}>Scan with Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryBtn, busy && styles.btnDisabled]}
          onPress={requestGalleryPermission}
          disabled={busy}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="image-multiple-outline" size={22} color="#2E7D32" />
          <Text style={styles.secondaryBtnText}>Choose from Gallery</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const CORNER = 22;
const BORDER = 3;

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#F5F7F5' },

  /* Header */
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

  /* Scroll */
  scroll: { padding: 20, paddingBottom: 8, alignItems: 'center' },

  title:    { fontSize: 22, fontWeight: '800', color: '#1B5E20', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 13, color: '#666', textAlign: 'center', lineHeight: 19, marginBottom: 28, paddingHorizontal: 10 },

  /* Scan frame */
  frameWrap: {
    width:  FRAME_SIZE,
    height: FRAME_SIZE,
    backgroundColor: '#E8F5E9',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    position: 'relative',
  },
  frameInner: { alignItems: 'center', gap: 12 },
  analyzingText: { fontSize: 14, color: '#2E7D32', fontWeight: '600' },
  frameTip:      { fontSize: 13, color: '#81C784', textAlign: 'center' },

  /* Corner markers */
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: '#2E7D32',
  },
  cornerTL: { top: 12, left: 12,   borderTopWidth: BORDER, borderLeftWidth: BORDER,  borderTopLeftRadius: 6 },
  cornerTR: { top: 12, right: 12,  borderTopWidth: BORDER, borderRightWidth: BORDER, borderTopRightRadius: 6 },
  cornerBL: { bottom: 12, left: 12,  borderBottomWidth: BORDER, borderLeftWidth: BORDER,  borderBottomLeftRadius: 6 },
  cornerBR: { bottom: 12, right: 12, borderBottomWidth: BORDER, borderRightWidth: BORDER, borderBottomRightRadius: 6 },

  /* Tips */
  tipsCard: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    marginBottom: 12,
  },
  tipsTitle: { fontSize: 13, fontWeight: '700', color: '#333', marginBottom: 12 },
  tipRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  tipIcon:   { width: 30, height: 30, borderRadius: 15, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center' },
  tipText:   { flex: 1, fontSize: 13, color: '#555', lineHeight: 18 },

  /* Action buttons */
  actionsWrap: {
    padding: 16,
    gap: 10,
    backgroundColor: '#F5F7F5',
    borderTopWidth: 1,
    borderTopColor: '#E8F5E9',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#2E7D32',
    paddingVertical: 15,
    borderRadius: 14,
    elevation: 3,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFF',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#2E7D32',
  },
  secondaryBtnText: { color: '#2E7D32', fontSize: 16, fontWeight: '600' },

  btnDisabled: { opacity: 0.5 },
});

export default CameraScreen;
