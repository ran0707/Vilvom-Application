import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LogoHeader from '../components/LogoHeader';

// Dynamic imports for optional dependencies
let launchCamera: any = null;
let launchImageLibrary: any = null;
let request: any = null;
let PERMISSIONS: any = null;
let RESULTS: any = null;

try {
  const imagePicker = require('react-native-image-picker');
  launchCamera = imagePicker.launchCamera;
  launchImageLibrary = imagePicker.launchImageLibrary;
} catch (error) {
  console.warn('react-native-image-picker not available');
}

try {
  const permissions = require('react-native-permissions');
  request = permissions.request;
  PERMISSIONS = permissions.PERMISSIONS;
  RESULTS = permissions.RESULTS;
  console.log('react-native-permissions loaded successfully');
} catch (error) {
  console.warn('react-native-permissions not available:', error);
}

import { detectPest } from '../services/pestDetectionApi';

const { width, height } = Dimensions.get('window');

interface PestDetectionResult {
  prediction: string;
  confidence: number;
  bounding_box: number[];
  symptoms: string[];
  biological_control: string[];
  chemical_control: string[];
  mechanical_control: string[];
  processed_image: string;
}

const CameraScreen = () => {
  const navigation = useNavigation();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const isFocused = useIsFocused();

  // Helper: when an image is returned from camera or gallery, immediately analyze
  const handleImageSelected = async (imageUri: string) => {
    setAnalyzing(true);
    try {
      console.log('[CameraScreen] handleImageSelected imageUri:', imageUri);
      // Optionally show a quick loader on this screen
      // Directly call detection API and navigate to result screen
      console.log('[CameraScreen] calling detectPest...');
      const result = await detectPest(imageUri);
      // try to get device location (best-effort). Use navigator.geolocation if available.
      try {
        const rnNavigator: any = (globalThis as any).navigator || {};
        const getPosition = () =>
          new Promise<any>((resolve, reject) => {
            const timeout = setTimeout(
              () => reject(new Error('timeout')),
              5000,
            );
            if (
              rnNavigator.geolocation &&
              rnNavigator.geolocation.getCurrentPosition
            ) {
              rnNavigator.geolocation.getCurrentPosition(
                (pos: any) => {
                  clearTimeout(timeout);
                  resolve(pos);
                },
                (err: any) => {
                  clearTimeout(timeout);
                  reject(err);
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 },
              );
            } else {
              clearTimeout(timeout);
              reject(new Error('geolocation not available'));
            }
          });

        const pos = await getPosition();
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        // attach to result for later saving and showing nearby info
        (result as any).meta = { ...(result as any).meta, lat, lng };
        (result as any).lat = lat;
        (result as any).lng = lng;
      } catch (locErr) {
        // ignore location failures - proceed without coordinates
        console.warn('Location fetch failed', locErr);
      }
      console.log(
        '[CameraScreen] detectPest result:',
        result && {
          prediction: result.prediction,
          keys: Object.keys(result || {}),
        },
      );
      (navigation as any).navigate('PestQuestionnaire', { result });
    } catch (error: any) {
      console.error('[CameraScreen] Image analysis error:', {
        message: error?.message,
        name: error?.name,
        stack: error?.stack,
        fullError: error,
      });

      let errorMessage = 'Failed to analyze image. Please try again.';
      let errorTitle = 'Analysis Error';

      if (error?.message) {
        // Check for specific error types
        if (
          error.message.includes('401') ||
          error.message.includes('unauthorized') ||
          error.message.includes('invalid token')
        ) {
          errorTitle = 'Authentication Error';
          errorMessage =
            'Authentication error. Please login again to analyze images.';
        } else if (
          error.message.includes('network') ||
          error.message.includes('unreachable') ||
          error.message.includes('Cannot reach backend')
        ) {
          errorTitle = 'Network Error';
          errorMessage =
            'Cannot reach the server. Please check your internet connection and ensure the backend is running.';
        } else if (error.message.includes('timeout')) {
          errorTitle = 'Timeout Error';
          errorMessage =
            'Request timed out. Please try again with a better internet connection.';
        } else if (error.message.includes('400')) {
          errorTitle = 'Invalid Request';
          errorMessage =
            'Invalid image data. Please try taking a new photo or selecting a different image.';
        } else if (error.message.includes('500') || error.message.includes('503')) {
          errorTitle = 'Server Error';
          errorMessage =
            'Server error occurred. Please ensure both backend (port 5000) and AI service (port 8000) are running.';
        } else {
          // Show the actual error message for debugging
          errorMessage = error.message || 'Failed to analyze image. Please try again.';
        }
      }

      Alert.alert(errorTitle, errorMessage);
    } finally {
      setAnalyzing(false);
      // Clear any stored selected image to avoid preview (we don't show preview)
      setSelectedImage(null);
    }
  };

  const requestCameraPermission = async () => {
    console.log('Requesting camera permission...');

    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message:
              'Camera access is needed to take photos for pest detection.',
            buttonPositive: 'Allow',
            buttonNegative: 'Deny',
          },
        );

        console.log('Permission result:', granted);

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Camera permission granted');
          openCamera();
        } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          console.log('Camera permission permanently denied');
          // Inform the user that permission has been permanently denied
          Alert.alert(
            'Camera Permission',
            'Camera access has been permanently denied. To use the camera, enable Camera permission for Vilvom in your device settings.',
            [{ text: 'OK', style: 'default' }],
          );
        } else {
          console.log('Camera permission denied');
          Alert.alert(
            'Camera Permission Required',
            'Camera access is needed to take photos. Please allow camera permission to continue.',
            [
              {
                text: 'Try Again',
                onPress: () => requestCameraPermission(),
              },
              {
                text: 'Cancel',
                style: 'cancel',
              },
            ],
          );
        }
      } catch (err) {
        console.warn('Permission request error:', err);
        // Fallback: try to open camera anyway
        Alert.alert(
          'Permission Error',
          'Unable to request permission. Opening camera...',
          [
            {
              text: 'Continue',
              onPress: () => openCamera(),
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ],
        );
      }
    } else {
      // iOS: react-native-image-picker handles permissions automatically
      console.log('iOS: opening camera directly');
      openCamera();
    }
  };

  const requestGalleryPermission = async () => {
    console.log('Requesting gallery permission...');

    if (Platform.OS === 'android') {
      try {
        // For Android, use PermissionsAndroid for better compatibility
        const sdk =
          typeof Platform.Version === 'number'
            ? Platform.Version
            : parseInt(String(Platform.Version), 10);

        let permission: any;
        if (sdk >= 33) {
          // Android 13+ requires READ_MEDIA_IMAGES - use string directly
          permission = 'android.permission.READ_MEDIA_IMAGES' as any;
        } else {
          // Older Android versions use READ_EXTERNAL_STORAGE
          permission = PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
        }

        const granted = await PermissionsAndroid.request(permission, {
          title: 'Gallery Permission',
          message:
            'Gallery access is needed to select photos for pest detection.',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        });

        console.log('Gallery permission result:', granted);

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Gallery permission granted');
          openGallery();
        } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          console.log('Gallery permission permanently denied');
          Alert.alert(
            'Gallery Permission',
            'Gallery access has been permanently denied. To select photos, enable Storage permission for Vilvom in your device settings.',
            [
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
              { text: 'Cancel', style: 'cancel' },
            ],
          );
        } else {
          console.log('Gallery permission denied');
          Alert.alert(
            'Gallery Permission Required',
            'Gallery access is needed to select photos. Please allow storage permission to continue.',
            [
              {
                text: 'Try Again',
                onPress: () => requestGalleryPermission(),
              },
              {
                text: 'Cancel',
                style: 'cancel',
              },
            ],
          );
        }
      } catch (err) {
        console.warn('Gallery permission request error:', err);
        // Fallback: try to open gallery anyway (react-native-image-picker may handle permissions)
        Alert.alert(
          'Permission Error',
          'Unable to request permission. Trying to open gallery...',
          [
            {
              text: 'Continue',
              onPress: () => openGallery(),
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ],
        );
      }
    } else {
      // iOS: react-native-image-picker handles permissions automatically
      console.log('iOS: opening gallery directly');
      openGallery();
    }
  };

  const openCamera = () => {
    const options = {
      mediaType: 'photo' as const,
      quality: 0.8,
      includeBase64: true,
    };
    if (!launchCamera) {
      Alert.alert(
        'Missing module',
        'react-native-image-picker is not installed or not linked. Install it with:\n\nnpm install react-native-image-picker\n\nand rebuild the app.',
      );
      return;
    }

    setLoading(true);
    launchCamera(options, (response: any) => {
      setLoading(false);
      if (response.didCancel) {
        console.log('User cancelled camera');
      } else if (response.errorMessage) {
        Alert.alert('Error', response.errorMessage);
      } else if (response.assets && response.assets[0]) {
        // prefer uri, otherwise base64
        const asset = response.assets[0];
        const uri =
          asset.uri ||
          (asset.base64
            ? `data:${asset.type || 'image/jpeg'};base64,${asset.base64}`
            : null);
        if (uri) {
          setSelectedImage(uri);
          handleImageSelected(uri);
        } else {
          Alert.alert('Error', 'Could not read captured image');
        }
      } else {
        Alert.alert('Error', 'No image returned from camera');
      }
    });
  };

  const openGallery = () => {
    const options = {
      mediaType: 'photo' as const,
      quality: 0.8,
      includeBase64: true,
      selectionLimit: 1,
    };

    if (!launchImageLibrary) {
      Alert.alert(
        'Gallery Not Available',
        'Image picker is not available. Please ensure react-native-image-picker is properly installed.',
        [{ text: 'OK', style: 'default' }],
      );
      return;
    }

    console.log('Opening gallery with options:', options);
    setLoading(true);

    launchImageLibrary(options, (response: any) => {
      setLoading(false);
      console.log('Gallery response:', response);

      if (response.didCancel) {
        console.log('User cancelled image picker');
        return;
      }

      if (response.errorCode) {
        console.error('Gallery error code:', response.errorCode);
        if (response.errorCode === 'permission') {
          Alert.alert(
            'Permission Required',
            'Please grant gallery permission in your device settings to select photos.',
            [
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
              { text: 'Cancel', style: 'cancel' },
            ],
          );
        } else {
          Alert.alert(
            'Gallery Error',
            response.errorMessage || 'Failed to open gallery',
          );
        }
        return;
      }

      if (response.errorMessage) {
        console.error('Gallery error message:', response.errorMessage);
        Alert.alert('Gallery Error', response.errorMessage);
        return;
      }

      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        console.log('Selected asset:', {
          uri: asset.uri,
          type: asset.type,
          size: asset.fileSize,
        });

        const uri =
          asset.uri ||
          (asset.base64
            ? `data:${asset.type || 'image/jpeg'};base64,${asset.base64}`
            : null);

        if (uri) {
          setSelectedImage(uri);
          handleImageSelected(uri);
        } else {
          Alert.alert(
            'Error',
            'Could not read selected image. Please try again.',
          );
        }
      } else {
        Alert.alert('Error', 'No image was selected. Please try again.');
      }
    });
  };

  // Always use native camera picker from react-native-image-picker

  // No in-app CameraOverlay: always open native camera picker from tab

  const analyzeImage = async () => {
    if (!selectedImage) {
      Alert.alert('No Image', 'Please select an image first');
      return;
    }

    setAnalyzing(true);
    try {
      console.log(
        '[CameraScreen] analyzeImage - calling detectPest for',
        selectedImage,
      );
      const result = await detectPest(selectedImage as string);
      console.log(
        '[CameraScreen] analyzeImage result:',
        result && { prediction: result.prediction },
      );

      // Navigate to questionnaire screen with type assertion
      (navigation as any).navigate('PestQuestionnaire', { result });
    } catch (error) {
      Alert.alert('Error', 'Failed to analyze image. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Logo Header */}
      <LogoHeader
        logoSize={{ width: 80, height: 80 }}
        marginTop={10}
        position="top-left"
      />

      {/* Main Content */}
      <View style={styles.content}>
        <Text style={styles.instruction}>
          Choose how you'd like to detect pests in your tea plants
        </Text>

        {/* Main Options */}
        <View style={styles.optionsContainer}>
          {/* Camera Option */}
          <TouchableOpacity
            style={[styles.optionButton, styles.cameraButton]}
            onPress={requestCameraPermission}
            disabled={loading || analyzing}
          >
            <Icon name="camera-alt" size={32} color="#fff" />
            <Text style={styles.optionTitle}>Scan with Camera</Text>
            <Text style={styles.optionSubtitle}>Take a photo to analyze</Text>
          </TouchableOpacity>

          {/* Gallery Option */}
          <TouchableOpacity
            style={[styles.optionButton, styles.galleryButton]}
            onPress={requestGalleryPermission}
            disabled={loading || analyzing}
          >
            <Icon name="photo-library" size={32} color="#fff" />
            <Text style={styles.optionTitle}>Upload from Gallery</Text>
            <Text style={styles.optionSubtitle}>Choose an existing photo</Text>
          </TouchableOpacity>
        </View>

        {/* Loading State */}
        {(loading || analyzing) && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>
              {analyzing ? 'Analyzing image...' : 'Opening...'}
            </Text>
          </View>
        )}
      </View>

      {/* No floating gallery button: camera opens directly from bottom tab */}

      {/* in-app CameraOverlay disabled: always open native camera on tab press */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  instruction: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 26,
    fontWeight: '500',
  },
  optionsContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 20,
  },
  optionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cameraButton: {
    backgroundColor: '#4CAF50',
  },
  galleryButton: {
    backgroundColor: '#2196F3',
  },
  optionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 12,
  },
  optionSubtitle: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
    marginTop: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
});

export default CameraScreen;
