import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
  PermissionsAndroid,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { launchCamera } from 'react-native-image-picker';
import Video from 'react-native-video';
import Voice from '@react-native-voice/voice';
// Patch for NativeEventEmitter warning in @react-native-voice/voice
if (!(Voice as any).addListener) {
  (Voice as any).addListener = () => {};
}
if (!(Voice as any).removeListeners) {
  (Voice as any).removeListeners = () => {};
}
import Ionicons from 'react-native-vector-icons/Ionicons';
// import AudioRecorderPlayer from 'react-native-audio-recorder-player';

const FeedbackScreen = () => {
  const navigation = useNavigation();
  const [textFeedback, setTextFeedback] = useState('');
  const [audioText, setAudioText] = useState('');
  const [loadingVoice, setLoadingVoice] = useState(false);
  const [recordingAudio, setRecordingAudio] = useState(false);
  const [audioPath, setAudioPath] = useState<string | null>(null);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);

  // const audioRecorder = useRef(new AudioRecorderPlayer()).current;

  useEffect(() => {
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;
    return () => {
      Voice.destroy().then(() => Voice.removeAllListeners());
      // audioRecorder.stopPlayer();
      // audioRecorder.removePlayBackListener();
    };
  }, []);

  const onSpeechResults = (e: any) => {
    const results = e.value || [];
    setAudioText(results.join(' '));
    setLoadingVoice(false);
  };

  const onSpeechError = (e: any) => {
    console.warn('Voice error', e);
    setLoadingVoice(false);
    Alert.alert('Audio recording error');
  };

  const ensureAudioPermission = async () => {
    if (Platform.OS !== 'android') return true;
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  };

  const startAudioRecording = async () => {
    try {
      const ok = await ensureAudioPermission();
      if (!ok) {
        Alert.alert(
          'Permission required',
          'Microphone permission is required to record audio',
        );
        return;
      }

      setRecordingAudio(true);
      setLoadingVoice(true);
      await Voice.start('en-US');

      const path = Platform.select({
        ios: 'feedback_audio.m4a',
        android: undefined,
      });
      // only speech-to-text is used now (no raw audio file saved)
    } catch (e) {
      console.warn('start audio error', e);
      setRecordingAudio(false);
      setLoadingVoice(false);
    }
  };

  const stopAudioRecording = async () => {
    try {
      await Voice.stop();
      // stop speech-to-text; no file recording
      setRecordingAudio(false);
      setLoadingVoice(false);
    } catch (e) {
      console.warn('stop audio error', e);
      setRecordingAudio(false);
      setLoadingVoice(false);
    }
  };

  // no audio file playback when using speech-to-text only

  const recordVideo = async () => {
    try {
      const res = await launchCamera({
        mediaType: 'video',
        videoQuality: 'high',
        durationLimit: 60,
      });
      if (res.didCancel) return;
      if (res.assets && res.assets.length > 0) {
        setVideoUri(res.assets[0].uri || null);
      }
    } catch (e) {
      console.warn('camera video error', e);
      Alert.alert('Unable to record video');
    }
  };

  const captureImage = async () => {
    try {
      const res = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
      });
      if (res.didCancel) return;
      if (res.assets && res.assets.length > 0) {
        setImageUri(res.assets[0].uri || null);
      }
    } catch (e) {
      console.warn('camera image error', e);
      Alert.alert('Unable to capture image');
    }
  };

  const submitFeedback = async () => {
    const summary = `Text: ${textFeedback || '[none]'}\nAudio: ${
      audioPath || '[none]'
    }\nVideo: ${videoUri || '[none]'}\nImage: ${imageUri || '[none]'}`;
    Alert.alert('Feedback submitted', summary);
    setTextFeedback('');
    setAudioText('');
    setAudioPath(null);
    setVideoUri(null);
    setImageUri(null);
    (navigation as any).goBack();
  };

  return (
    <View style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (navigation as any).goBack()}
          style={styles.backBtn}
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Feedback</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Text feedback</Text>
          <TextInput
            value={textFeedback}
            onChangeText={setTextFeedback}
            placeholder="What's happening on the farm? Be concise and specific..."
            multiline
            style={styles.textInput}
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.cardRow}>
          <View style={styles.cardSmall}>
            <Text style={styles.cardLabel}>Audio</Text>
            <TouchableOpacity
              style={[styles.iconButton, recordingAudio && styles.iconButtonActive]}
              onPress={recordingAudio ? stopAudioRecording : startAudioRecording}
            >
              <Ionicons
                name={recordingAudio ? 'stop-circle' : 'mic'}
                size={22}
                color="#fff"
              />
            </TouchableOpacity>
            <Text style={styles.smallStatus}>{loadingVoice ? 'Listening...' : (audioText || 'No audio')}</Text>
          </View>

          <View style={styles.cardSmall}>
            <Text style={styles.cardLabel}>Video</Text>
            <TouchableOpacity style={styles.iconButton} onPress={recordVideo}>
              <Ionicons name="videocam" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.smallStatus}>{videoUri ? 'Recorded' : 'No video'}</Text>
          </View>

          <View style={styles.cardSmall}>
            <Text style={styles.cardLabel}>Image</Text>
            <TouchableOpacity style={styles.iconButton} onPress={captureImage}>
              <Ionicons name="camera" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.smallStatus}>{imageUri ? 'Captured' : 'No image'}</Text>
          </View>
        </View>

        {videoUri ? (
          <View style={styles.mediaPreview}>
            <Video source={{ uri: videoUri }} style={{ flex: 1 }} controls paused={false} />
          </View>
        ) : null}

        {imageUri ? (
          <View style={styles.mediaPreview}>
            <Image source={{ uri: imageUri }} style={styles.mediaImage} />
          </View>
        ) : null}

        <TouchableOpacity style={styles.submitBtn} onPress={submitFeedback} accessibilityRole="button">
          <Text style={styles.submitText}>Submit Feedback</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9fdf9',
  },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12, color: '#333' },
  section: { marginBottom: 16 },
  label: { fontSize: 14, color: '#555', marginBottom: 8 },
  textInput: {
    backgroundColor: '#fff',
    minHeight: 80,
    padding: 8,
    borderRadius: 8,
    textAlignVertical: 'top',
  },
  iconButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
  },
  iconButtonActive: {
    backgroundColor: '#388E3C',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 12,
    elevation: 2,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 1,
  },
  cardLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#333' },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  cardSmall: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    elevation: 1,
  },
  smallStatus: { marginTop: 8, color: '#666', fontSize: 12 },
  mediaPreview: { marginTop: 12, height: 200, borderRadius: 8, overflow: 'hidden' },
  mediaImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  submitBtn: {
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  submitText: { color: '#fff', fontWeight: '700' },
});

export default FeedbackScreen;
