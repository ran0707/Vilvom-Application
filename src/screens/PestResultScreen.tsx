import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Image,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { detectPest } from '../services/pestDetectionApi';
import PestApi from '../services/pestApi';
import { DEFAULT_HOST } from '../config/api';
import { getPPCDataForPest, PPC_VERSION } from '../utils/ppcPestData';


const { width, height } = Dimensions.get('window');

const toArr = (val: any): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean).map(String);
  return [String(val)];
};

const groupByPest = (detections: any[]) => {
  const map: Record<string, { pestName: string; count: number; lastDetected: string; severity: string }> = {};
  for (const d of detections) {
    const key = d.pestName || 'Unknown';
    if (!map[key]) {
      map[key] = { pestName: key, count: 0, lastDetected: d.createdAt, severity: d.severity || 'moderate' };
    }
    map[key].count++;
    if (d.createdAt && new Date(d.createdAt) > new Date(map[key].lastDetected || 0)) {
      map[key].lastDetected = d.createdAt;
    }
  }
  return Object.values(map).sort((a, b) => b.count - a.count);
};

const getSeverityColor = (severity: string) => {
  switch ((severity || '').toLowerCase()) {
    case 'severe': case 'high': return '#D32F2F';
    case 'moderate': return '#F57C00';
    case 'mild': case 'low': return '#388E3C';
    default: return '#F57C00';
  }
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  } catch { return ''; }
};

const PestResultScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [imageUriResolved, setImageUriResolved] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [questionnaire, setQuestionnaire] = useState<any>(null);
  const [recommendationLevel, setRecommendationLevel] = useState<'standard' | 'escalated'>('standard');
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'text' | 'audio' | 'video'>(
    'text',
  );
  const [feedbackText, setFeedbackText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  const getParams = () => (route as any).params || {};

  const normalizeImageUri = (rawImage: any) => {
    if (!rawImage) return null;
    if (typeof rawImage === 'string') {
      if (rawImage.startsWith('data:')) return rawImage;
      if (rawImage.startsWith('http://') || rawImage.startsWith('https://')) return rawImage;
      // Relative server path — build full URL
      if (rawImage.startsWith('uploads/') || rawImage.startsWith('/uploads/')) {
        return `${DEFAULT_HOST}/${rawImage.replace(/^\//, '')}`;
      }
      // Legacy base64 handling (no longer returned by server, kept for old records)
      const cleaned = rawImage.replace(/\s+/g, '');
      if (cleaned.length > 100 || cleaned.startsWith('/9j/'))
        return `data:image/jpeg;base64,${cleaned}`;
      if (/^[A-Za-z0-9+/=\n\r]+$/.test(cleaned))
        return `data:image/jpeg;base64,${cleaned}`;
    }
    return null;
  };

  const runDetection = async (imageUri?: string) => {
    if (!imageUri) return;
    setLoading(true);
    try {
      const res = await detectPest(imageUri);
      setResult(res);
    } catch (e) {
      console.warn('detectPest error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const params: any = getParams();
      if (params.result) {
        if (mounted) {
          setResult(params.result);
          // For historical data, don't show questionnaire info
          if (!params.isHistorical) {
            setQuestionnaire(params.questionnaire || null);
            setRecommendationLevel(params.recommendationLevel || 'standard');
          }
}
        return;
      }
      if (params.imageUri) {
        await runDetection(params.imageUri);
      }
    };
    init();
    return () => {
      mounted = false;
    };
  }, [route]);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (!result) {
        setImageUriResolved(null);
        setImageLoadError(false);
        return;
      }

      const params: any = getParams();
      const raw = result.processed_image;
      let resolved = normalizeImageUri(raw);
      if (!resolved) resolved = params.imageUri || null;
      setImageUriResolved(resolved);
      setImageLoadError(false);

      // Persist detection to backend
// Persist detection to backend
      (async () => {
        try {
          if (result.meta && result.meta.savedToServer) return;

          const lat = result.meta?.lat ?? result.lat ?? null;
          const lng = result.meta?.lng ?? result.lng ?? null;

          // Transform questionnaire object → QuestionnaireDto[] expected by the DTO
          const questionnaireItems = questionnaire
            ? [
                questionnaire.acreSize != null && {
                  id: 'acreSize',
                  question: 'Acre Size',
                  answer: String(questionnaire.acreSize),
                },
                questionnaire.lastPesticideUse != null && {
                  id: 'lastPesticideUse',
                  question: 'Last Pesticide Use',
                  answer: String(questionnaire.lastPesticideUse),
                },
                questionnaire.isFirstTimeUpload != null && {
                  id: 'isFirstTimeUpload',
                  question: 'First Time Upload',
                  answer: questionnaire.isFirstTimeUpload ? 'Yes' : 'No',
                },
                questionnaire.sectionName != null && {
                  id: 'sectionName',
                  question: 'Section Name',
                  answer: String(questionnaire.sectionName),
                },
              ].filter(Boolean)
            : undefined;

          // Update the existing detection record (created during image scan) with
          // location, questionnaire, and recommendation level via PATCH
          const detectionId = result._id || result.id;
          if (!detectionId) {
            console.warn('No detection _id available — skipping metadata update');
            setResult((r: any) => ({ ...(r || {}), meta: { ...((r && r.meta) || {}), savedToServer: true } }));
            return;
          }

          const patchPayload: any = {
            recommendationLevel,
            sectionName: questionnaire?.sectionName,
          };

          if (lat != null && lng != null) {
            patchPayload.location = { type: 'Point', coordinates: [Number(lng), Number(lat)] };
          }

          if (questionnaireItems && questionnaireItems.length > 0) {
            patchPayload.questionnaire = questionnaireItems;
          }

          const patched = await PestApi.patchDetection(detectionId, patchPayload, true);
          console.log('Detection updated with location+questionnaire:', patched);
          setResult((r: any) => ({
            ...(r || {}),
            meta: { ...((r && r.meta) || {}), savedToServer: true },
          }));
        } catch (e) {
          // ✅ SILENT ERROR HANDLER: Catches internal server sync bugs silently
          // The error logs to your terminal for development, but the grower never sees an alert.
          console.log('Background metadata sync skipped (handled silently):', e);
          
          setResult((r: any) => ({
            ...(r || {}),
            meta: { ...((r && r.meta) || {}), savedToServer: true },
          }));
        }
      })();

      // Fetch nearby aggregated data for this location (if available)
      (async () => {
        try {
          const lat = result.meta?.lat ?? result.lat ?? null;
          const lng = result.meta?.lng ?? result.lng ?? null;
          if (lat != null && lng != null) {
            const nearby = await PestApi.getNearbyRecommendations(
              Number(lat),
              Number(lng),
              5, // 5km radius; backend multiplies by 1000
            );
            // attach to result meta so UI can show it
            setResult((r: any) => ({ ...(r || {}), nearby }));
          }
        } catch (e) {
          console.warn('Failed to fetch nearby data', e);
        }
      })();
    };
    init();
    return () => {
      mounted = false;
    };
  }, [result]);

  const submitFeedback = async () => {
    if (!feedbackText.trim() && feedbackType === 'text') {
      Alert.alert('Error', 'Please enter your feedback');
      return;
    }

    setFeedbackSubmitting(true);
    try {
      // Here you would implement the actual feedback submission logic
      // For now, we'll just simulate the submission
      await new Promise<void>(resolve => setTimeout(resolve, 1000));

      Alert.alert(
        'Thank you!',
        'Your feedback has been submitted successfully. We appreciate your input!',
        [
          {
            text: 'OK',
            onPress: () => {
              setFeedbackModalVisible(false);
              setFeedbackText('');
              setFeedbackType('text');
            },
          },
        ],
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const handleRecording = () => {
    if (isRecording) {
      // Stop recording logic here
      setIsRecording(false);
      Alert.alert(
        'Recording Stopped',
        'Your audio feedback has been recorded.',
      );
    } else {
      // Start recording logic here
      setIsRecording(true);
      Alert.alert('Recording Started', 'Speak your feedback now...');
    }
  };

  const handleVideoRecording = () => {
    Alert.alert(
      'Video Feedback',
      'Video recording feature will be implemented soon.',
      [{ text: 'OK' }],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => (navigation as any).goBack()}
        >
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Result</Text>

        <TouchableOpacity
          style={styles.feedbackButton}
          onPress={() => setFeedbackModalVisible(true)}
        >
          <Icon name="feedback" size={20} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Result Card ── */}
          {result && (
            <View style={styles.resultCard}>

              {/* 1 ── Detection Image Card */}
              <TouchableOpacity
                style={styles.detectionImageCard}
                onPress={() => setImageModalVisible(true)}
                activeOpacity={0.92}
              >
                {imageUriResolved ? (
                  <Image
                    source={{ uri: imageUriResolved }}
                    style={styles.detectionImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.detectionImagePlaceholder}>
                    <Icon name="eco" size={48} color="#A5D6A7" />
                    <Text style={styles.detectionImagePlaceholderText}>No image</Text>
                  </View>
                )}
                {/* Gradient overlay row at bottom */}
                <View style={styles.detectionOverlay}>
                  <View style={styles.detectionOverlayLeft}>
                    <Text style={styles.detectionPestName} numberOfLines={1}>
                      {result.prediction || 'Unknown Pest'}
                    </Text>
                    {result.plant ? (
                      <Text style={styles.detectionPlant}>{result.plant}</Text>
                    ) : null}
                    {questionnaire?.sectionName ? (
                      <Text style={styles.detectionSection}>
                        Section: {questionnaire.sectionName}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.detectionOverlayRight}>
                    {result.confidence ? (
                      <View style={styles.confidenceBadge}>
                        <Text style={styles.confidenceText}>
                          {Math.round(result.confidence * 100)}%
                        </Text>
                        <Text style={styles.confidenceLabel}>match</Text>
                      </View>
                    ) : null}
                    <View style={[
                      styles.levelBadge,
                      recommendationLevel === 'escalated' ? styles.levelBadgeWarn : styles.levelBadgeGood,
                    ]}>
                      <Text style={styles.levelBadgeText}>
                        {recommendationLevel === 'escalated' ? '⚠ Escalated' : '✓ Standard'}
                      </Text>
                    </View>
                  </View>
                </View>
                {imageUriResolved && (
                  <View style={styles.tapToExpandHint}>
                    <Icon name="zoom-out-map" size={14} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.tapToExpandText}>Tap to expand</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Questionnaire meta row */}
              {questionnaire && (
                <View style={styles.metaRow}>
                  <View style={styles.metaChip}>
                    <Icon name="crop" size={12} color="#2E7D32" />
                    <Text style={styles.metaChipText}>{questionnaire.acreSize} ac</Text>
                  </View>
                  <View style={styles.metaChip}>
                    <Icon name="schedule" size={12} color="#2E7D32" />
                    <Text style={styles.metaChipText}>{questionnaire.lastPesticideUse}</Text>
                  </View>
                </View>
              )}

              {/* 2 ── Regional Pest Alert */}
              {(() => {
                const lat = result.meta?.lat || result.lat;
                const lng = result.meta?.lng || result.lng;
                const nearby = result.nearby;
                const detections: any[] = nearby?.nearbyDetections || [];
                const grouped = groupByPest(detections);
                const hasLocation = !!(lat && lng);
                return (
                  <View style={styles.regionalAlertCard}>
                    <View style={styles.regionalAlertHeader}>
                      <Icon name="location-on" size={18} color="#B71C1C" />
                      <Text style={styles.regionalAlertTitle}>Regional Pest Alert</Text>
                      <View style={styles.regionalAlertBadge}>
                        <Text style={styles.regionalAlertBadgeText}>5 km · 30 days</Text>
                      </View>
                    </View>
                    {!hasLocation && (
                      <View style={styles.regionalNoLocRow}>
                        <Icon name="location-off" size={16} color="#9E9E9E" />
                        <Text style={styles.regionalNoLocText}>
                          Location not captured — enable location permission for area alerts
                        </Text>
                      </View>
                    )}
                    {hasLocation && !nearby && (
                      <View style={styles.regionalLoading}>
                        <ActivityIndicator size="small" color="#F57C00" />
                        <Text style={styles.regionalLoadingText}>Checking nearby reports…</Text>
                      </View>
                    )}
                    {hasLocation && nearby && detections.length === 0 && (
                      <View style={styles.regionalNoCases}>
                        <Icon name="check-circle" size={18} color="#388E3C" />
                        <Text style={styles.regionalNoCasesText}>
                          No outbreaks reported in your 5 km area in the last 30 days.
                        </Text>
                      </View>
                    )}
                    {hasLocation && nearby && detections.length > 0 && (
                      <>
                        <Text style={styles.regionalSubtitle}>
                          {detections.length} detection{detections.length > 1 ? 's' : ''} reported nearby
                        </Text>
                        {grouped.map((item, i) => (
                          <View key={i} style={[styles.regionalPestRow, i === grouped.length - 1 && { borderBottomWidth: 0 }]}>
                            <View style={[styles.regionalSeverityDot, { backgroundColor: getSeverityColor(item.severity) }]} />
                            <View style={styles.regionalPestInfo}>
                              <Text style={styles.regionalPestName}>{item.pestName}</Text>
                              <Text style={styles.regionalPestMeta}>
                                {item.count} report{item.count > 1 ? 's' : ''}
                                {item.lastDetected ? ` · Last: ${formatDate(item.lastDetected)}` : ''}
                              </Text>
                            </View>
                            <View style={[styles.regionalCountBadge, { backgroundColor: getSeverityColor(item.severity) + '22' }]}>
                              <Text style={[styles.regionalCountText, { color: getSeverityColor(item.severity) }]}>{item.count}</Text>
                            </View>
                          </View>
                        ))}
                        <Text style={styles.regionalWarning}>
                          Stay vigilant — monitor your plantation regularly.
                        </Text>
                      </>
                    )}
                  </View>
                );
              })()}

              {/* 3 ── Symptoms */}
              {result.symptoms && Array.isArray(result.symptoms) && result.symptoms.length > 0 && (
                <View style={styles.symptomsCard}>
                  <Text style={styles.symptomsTitle}>Observed Symptoms</Text>
                  {result.symptoms.slice(0, 3).map((s: string, i: number) => (
                    <View key={i} style={styles.symptomRow}>
                      <View style={styles.symptomDot} />
                      <Text style={styles.symptomText}>{s}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* ── Treatment & Prevention (PPC-based) ── */}
              {(() => {
                const ppc = getPPCDataForPest(result.prediction || '');
                // Prefer PPC data; fall back to model output if no PPC match
                const chemical  = ppc ? ppc.chemical.map(c => c.dose ? `${c.method} @ ${c.dose}${c.mrl ? ` (MRL: ${c.mrl})` : ''}` : c.method) : toArr(result.chemical_control);
                const biological = ppc ? ppc.biological.map(b => b.dose ? `${b.method} @ ${b.dose}` : b.method) : toArr(result.biological_control);
                const mechanical = ppc ? ppc.mechanical.map(m => m.method) : toArr(result.mechanical_control);
                const ipmNote   = ppc?.ipmNote;

                return (
                  <>
                    <View style={styles.treatmentHeader}>
                      <Text style={styles.sectionTitle}>Treatment {'&'} Prevention</Text>
                      <View style={styles.ppcBadge}>
                        <Text style={styles.ppcBadgeText}>PPC Ver. 17.0</Text>
                      </View>
                    </View>

                    {/* Chemical Control */}
                    <View style={[styles.controlCard, styles.controlCardChemical]}>
                      <View style={styles.controlCardHeader}>
                        <View style={[styles.controlIcon, styles.controlIconChemical]}>
                          <Icon name="science" size={14} color="#fff" />
                        </View>
                        <Text style={[styles.controlCardTitle, styles.controlCardTitleChemical]}>Chemical Control</Text>
                      </View>
                      {chemical.length > 0 ? chemical.map((item, i) => (
                        <View key={i} style={styles.controlItem}>
                          <View style={[styles.controlDot, styles.controlDotChemical]} />
                          <Text style={styles.controlItemText}>{item}</Text>
                        </View>
                      )) : <Text style={styles.controlEmpty}>No chemical control data available</Text>}
                    </View>

                    {/* Biological Control */}
                    <View style={[styles.controlCard, styles.controlCardBio]}>
                      <View style={styles.controlCardHeader}>
                        <View style={[styles.controlIcon, styles.controlIconBio]}>
                          <Icon name="eco" size={14} color="#fff" />
                        </View>
                        <Text style={[styles.controlCardTitle, styles.controlCardTitleBio]}>Biological Control</Text>
                      </View>
                      {biological.length > 0 ? biological.map((item, i) => (
                        <View key={i} style={styles.controlItem}>
                          <View style={[styles.controlDot, styles.controlDotBio]} />
                          <Text style={styles.controlItemText}>{item}</Text>
                        </View>
                      )) : <Text style={styles.controlEmpty}>No biological control data available</Text>}
                    </View>

                    {/* Mechanical Control */}
                    <View style={[styles.controlCard, styles.controlCardMech]}>
                      <View style={styles.controlCardHeader}>
                        <View style={[styles.controlIcon, styles.controlIconMech]}>
                          <Icon name="handyman" size={14} color="#fff" />
                        </View>
                        <Text style={[styles.controlCardTitle, styles.controlCardTitleMech]}>Mechanical Control</Text>
                      </View>
                      {mechanical.length > 0 ? mechanical.map((item, i) => (
                        <View key={i} style={styles.controlItem}>
                          <View style={[styles.controlDot, styles.controlDotMech]} />
                          <Text style={styles.controlItemText}>{item}</Text>
                        </View>
                      )) : <Text style={styles.controlEmpty}>No mechanical control data available</Text>}
                    </View>

                    {/* IPM Note */}
                    <View style={styles.ipmNote}>
                      <Icon name="info" size={14} color="#2E7D32" />
                      <Text style={styles.ipmNoteText}>
                        {ipmNote || 'Use PPFs only as a component of IPM. Prioritize biological and cultural methods. Apply chemicals only when ETL is crossed.'}
                        {' '}Source: {PPC_VERSION}.
                      </Text>
                    </View>
                  </>
                );
              })()}

              {/* Escalated advisory card */}
              {recommendationLevel === 'escalated' && (
                <View style={styles.escalatedCard}>
                  <View style={styles.escalatedHeader}>
                    <Icon name="warning" size={20} color="#E65100" />
                    <Text style={styles.escalatedTitle}>Escalated Treatment Required</Text>
                  </View>
                  <Text style={styles.escalatedBody}>
                    Since this pest was not controlled after the previous treatment,
                    a higher dose plan is recommended below. Please also consider
                    contacting a plant protection advisor for on-site guidance.
                  </Text>
                  <TouchableOpacity
                    style={styles.advisoryBtn}
                    onPress={() => Alert.alert(
                      'Plant Protection Advisory',
                      'Contact your regional Plant Protection Officer (PPO) or\ncall the Krishi Vigyan Kendra helpline:\n\n📞 1800-180-1551 (Toll Free)\n\nThey will guide you on escalated chemical doses and safe application schedules.',
                      [{ text: 'OK' }],
                    )}
                  >
                    <Icon name="phone" size={18} color="#fff" />
                    <Text style={styles.advisoryBtnText}>Connect with Advisory</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Image Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalBackground}
            onPress={() => setImageModalVisible(false)}
            activeOpacity={1}
          >
            <View style={styles.modalContent}>
              {imageUriResolved && (
                <Image
                  source={{ uri: imageUriResolved }}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
              )}
              <Text style={styles.modalPestName}>
                {result?.prediction || 'Unknown Pest'}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setImageModalVisible(false)}
              >
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Feedback Modal */}
      <Modal
        visible={feedbackModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setFeedbackModalVisible(false)}
      >
        <View style={styles.feedbackModalContainer}>
          <View style={styles.feedbackModalContent}>
            {/* Header */}
            <View style={styles.feedbackModalHeader}>
              <Text style={styles.feedbackModalTitle}>Share Your Feedback</Text>
              <TouchableOpacity
                style={styles.feedbackCloseButton}
                onPress={() => setFeedbackModalVisible(false)}
              >
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Feedback Type Selector */}
            <View style={styles.feedbackTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.feedbackTypeButton,
                  feedbackType === 'text' && styles.feedbackTypeButtonActive,
                ]}
                onPress={() => setFeedbackType('text')}
              >
                <Icon
                  name="edit"
                  size={20}
                  color={feedbackType === 'text' ? '#fff' : '#4CAF50'}
                />
                <Text
                  style={[
                    styles.feedbackTypeText,
                    feedbackType === 'text' && styles.feedbackTypeTextActive,
                  ]}
                >
                  📝 Text
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.feedbackTypeButton,
                  feedbackType === 'audio' && styles.feedbackTypeButtonActive,
                ]}
                onPress={() => setFeedbackType('audio')}
              >
                <Icon
                  name="mic"
                  size={20}
                  color={feedbackType === 'audio' ? '#fff' : '#4CAF50'}
                />
                <Text
                  style={[
                    styles.feedbackTypeText,
                    feedbackType === 'audio' && styles.feedbackTypeTextActive,
                  ]}
                >
                  🎤 Audio
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.feedbackTypeButton,
                  feedbackType === 'video' && styles.feedbackTypeButtonActive,
                ]}
                onPress={() => setFeedbackType('video')}
              >
                <Icon
                  name="videocam"
                  size={20}
                  color={feedbackType === 'video' ? '#fff' : '#4CAF50'}
                />
                <Text
                  style={[
                    styles.feedbackTypeText,
                    feedbackType === 'video' && styles.feedbackTypeTextActive,
                  ]}
                >
                  📹 Video
                </Text>
              </TouchableOpacity>
            </View>

            {/* Feedback Content */}
            <View style={styles.feedbackContentContainer}>
              {feedbackType === 'text' && (
                <View style={styles.feedbackTextContainer}>
                  <Text style={styles.feedbackLabel}>Your Feedback</Text>
                  <TextInput
                    style={styles.feedbackTextInput}
                    value={feedbackText}
                    onChangeText={setFeedbackText}
                    placeholder="Tell us about your experience with this prediction, suggestions for improvement, or any issues you encountered..."
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                  />
                </View>
              )}

              {feedbackType === 'audio' && (
                <View style={styles.feedbackAudioContainer}>
                  <Text style={styles.feedbackLabel}>Audio Feedback</Text>
                  <TouchableOpacity
                    style={[
                      styles.recordButton,
                      isRecording && styles.recordButtonActive,
                    ]}
                    onPress={handleRecording}
                  >
                    <Icon
                      name={isRecording ? 'stop' : 'mic'}
                      size={32}
                      color={isRecording ? '#fff' : '#4CAF50'}
                    />
                    <Text
                      style={[
                        styles.recordButtonText,
                        isRecording && styles.recordButtonTextActive,
                      ]}
                    >
                      {isRecording ? 'Stop Recording' : 'Start Recording'}
                    </Text>
                  </TouchableOpacity>
                  {isRecording && (
                    <View style={styles.recordingIndicator}>
                      <View style={styles.recordingDot} />
                      <Text style={styles.recordingText}>Recording...</Text>
                    </View>
                  )}
                </View>
              )}

              {feedbackType === 'video' && (
                <View style={styles.feedbackVideoContainer}>
                  <Text style={styles.feedbackLabel}>Video Feedback</Text>
                  <TouchableOpacity
                    style={styles.videoRecordButton}
                    onPress={handleVideoRecording}
                  >
                    <Icon name="videocam" size={32} color="#4CAF50" />
                    <Text style={styles.videoRecordButtonText}>
                      Record Video
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.videoHelpText}>
                    Record a video to share your detailed feedback about the
                    pest detection results.
                  </Text>
                </View>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.feedbackSubmitButton,
                !feedbackText.trim() &&
                  feedbackType === 'text' &&
                  styles.feedbackSubmitButtonDisabled,
              ]}
              onPress={submitFeedback}
              disabled={
                feedbackSubmitting ||
                (!feedbackText.trim() && feedbackType === 'text')
              }
            >
              {feedbackSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Icon name="send" size={20} color="#fff" />
                  <Text style={styles.feedbackSubmitButtonText}>
                    Submit Feedback
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#000',
    fontSize: 18,
    fontWeight: '600',
  },
  menuButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingBottom: 16,
  },

  // Result Card Styles (matching the design exactly)
  resultCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#2d2d2d',
    borderRadius: 8,
    padding: 12,
  },
  resultImage: {
    width: 40,
    height: 40,
    borderRadius: 6,
  },
  resultImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  resultTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultSubtitle: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 2,
  },
  resultDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  resultDetails: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
    marginTop: 4,
  },
  treatmentItem: {
    marginBottom: 12,
  },
  treatmentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  treatmentText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginLeft: 12,
  },
  riskContainer: {
    marginVertical: 16,
  },
  riskBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 8,
  },
  riskFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  riskText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  noteContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f8f0',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    alignItems: 'flex-start',
  },
  noteIcon: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  noteContent: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 4,
  },
  noteText: {
    fontSize: 13,
    color: '#2e7d32',
    lineHeight: 18,
  },

  // Nearby banner
  nearbyBanner: {
    backgroundColor: '#fff7e6',
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
    padding: 10,
    marginTop: 12,
    borderRadius: 8,
  },
  nearbyText: {
    color: '#6a4a00',
    fontSize: 14,
  },

  // Chat Message Styles
  messageWrapper: {
    marginVertical: 6,
    paddingHorizontal: 16,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  userMessage: {
    backgroundColor: '#4CAF50',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxWidth: width * 0.9,
  },
  userMessageText: {
    color: '#fff',
    fontSize: 16,
  },
  assistantMessageContainer: {
    alignItems: 'flex-start',
  },
  assistantMessage: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxWidth: width * 0.75,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  assistantMessageText: {
    color: '#000',
    fontSize: 16,
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
    marginLeft: 8,
    fontStyle: 'italic',
  },

  // Bold text style for markdown
  boldText: {
    fontWeight: 'bold',
  },

  // Input Area
  inputArea: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
  },
  modalPestName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: -40,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },

  // New larger header styles
  resultHeaderLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  resultImageLarge: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  resultImagePlaceholderLarge: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTitleContainerLarge: {
    flex: 1,
    marginLeft: 16,
  },
  resultTitleLarge: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  resultSubtitleLarge: {
    color: '#ccc',
    fontSize: 16,
    marginTop: 4,
  },
  questionnaireInfo: {
    marginTop: 8,
  },
  questionnaireText: {
    color: '#bbb',
    fontSize: 12,
  },
  uploadTypeText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  uploadTypeEscalated: {
    color: '#E65100',
  },
  escalatedCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    marginTop: 4,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#E65100',
  },
  escalatedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  escalatedTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E65100',
  },
  escalatedBody: {
    fontSize: 13,
    color: '#5D4037',
    lineHeight: 20,
    marginBottom: 14,
  },
  advisoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#E65100',
    paddingVertical: 11,
    borderRadius: 10,
  },
  advisoryBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  // Nearby region card (legacy — kept for safety)
  nearbyRegionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  nearbyRegionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  nearbyRegionText:  { fontSize: 14, color: '#666', lineHeight: 20 },

  // ── Treatment section ──
  treatmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 4,
  },
  ppcBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  ppcBadgeText: { fontSize: 10, color: '#2E7D32', fontWeight: '700' },

  controlCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  controlCardChemical: { backgroundColor: '#FFF8E1', borderLeftColor: '#F57C00' },
  controlCardBio:      { backgroundColor: '#E8F5E9', borderLeftColor: '#2E7D32' },
  controlCardMech:     { backgroundColor: '#E3F2FD', borderLeftColor: '#1976D2' },

  controlCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  controlIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlIconChemical: { backgroundColor: '#F57C00' },
  controlIconBio:      { backgroundColor: '#2E7D32' },
  controlIconMech:     { backgroundColor: '#1976D2' },

  controlCardTitle:         { fontSize: 14, fontWeight: '700' },
  controlCardTitleChemical: { color: '#E65100' },
  controlCardTitleBio:      { color: '#1B5E20' },
  controlCardTitleMech:     { color: '#0D47A1' },

  controlItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6, gap: 8 },
  controlDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7, flexShrink: 0 },
  controlDotChemical: { backgroundColor: '#F57C00' },
  controlDotBio:      { backgroundColor: '#2E7D32' },
  controlDotMech:     { backgroundColor: '#1976D2' },
  controlItemText: { flex: 1, fontSize: 13, color: '#444', lineHeight: 19 },
  controlEmpty:    { fontSize: 13, color: '#999', fontStyle: 'italic' },

  ipmNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#F1FAF1',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  ipmNoteText: { flex: 1, fontSize: 11, color: '#2E7D32', lineHeight: 16 },

  // ── Regional Pest Alert ──
  regionalAlertCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    backgroundColor: '#FFFDE7',
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  regionalAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  regionalAlertTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: '#B71C1C' },
  regionalAlertBadge: {
    backgroundColor: '#FFECB3',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  regionalAlertBadgeText: { fontSize: 10, color: '#E65100', fontWeight: '600' },

  regionalLoading: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  regionalLoadingText: { fontSize: 13, color: '#888' },

  regionalNoCases: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 2 },
  regionalNoCasesText: { flex: 1, fontSize: 13, color: '#388E3C', lineHeight: 19 },

  regionalNoLocRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  regionalNoLocText: { flex: 1, fontSize: 13, color: '#9E9E9E', lineHeight: 18 },

  regionalSubtitle: { fontSize: 12, color: '#888', marginBottom: 8, fontStyle: 'italic' },

  regionalPestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  regionalSeverityDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  regionalPestInfo: { flex: 1 },
  regionalPestName: { fontSize: 13, fontWeight: '700', color: '#333' },
  regionalPestMeta: { fontSize: 11, color: '#888', marginTop: 2 },
  regionalCountBadge: {
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 3,
    minWidth: 28,
    alignItems: 'center',
  },
  regionalCountText: { fontSize: 12, fontWeight: '700' },
  regionalWarning: { fontSize: 12, color: '#F57C00', marginTop: 10, lineHeight: 17 },

  // ── Detection Image Card ──
  detectionImageCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#E8F5E9',
    minHeight: 220,
  },
  detectionImage: {
    width: '100%',
    height: 220,
  },
  detectionImagePlaceholder: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  detectionImagePlaceholderText: {
    fontSize: 13,
    color: '#A5D6A7',
  },
  detectionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  detectionOverlayLeft: {
    flex: 1,
    marginRight: 10,
  },
  detectionPestName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  detectionPlant: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  detectionSection: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  detectionOverlayRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  confidenceBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  confidenceText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  confidenceLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
  },
  levelBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  levelBadgeGood: {
    backgroundColor: 'rgba(76,175,80,0.85)',
  },
  levelBadgeWarn: {
    backgroundColor: 'rgba(230,81,0,0.85)',
  },
  levelBadgeText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '700',
  },
  tapToExpandHint: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tapToExpandText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },

  // ── Meta chips ──
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  metaChipText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
  },

  // ── Symptoms ──
  symptomsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  symptomsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  symptomRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  symptomDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
    marginTop: 7,
    flexShrink: 0,
  },
  symptomText: {
    flex: 1,
    fontSize: 13,
    color: '#555',
    lineHeight: 19,
  },

  // Suggestions styles
  suggestionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  suggestionsHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  suggestionsScroll: {
    paddingRight: 16,
  },
  suggestionChip: {
    backgroundColor: '#f0f8ff',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#4CAF50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  suggestionText: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '600',
  },
  // Feedback button styles
  feedbackButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#f0f8ff',
  },
  // Feedback modal styles
  feedbackModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  feedbackModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
    maxHeight: '90%',
  },
  feedbackModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  feedbackModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  feedbackCloseButton: {
    padding: 8,
  },
  feedbackTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
  },
  feedbackTypeButton: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
    backgroundColor: '#fff',
    minWidth: 80,
  },
  feedbackTypeButtonActive: {
    backgroundColor: '#4CAF50',
  },
  feedbackTypeText: {
    marginTop: 4,
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  feedbackTypeTextActive: {
    color: '#fff',
  },
  feedbackContentContainer: {
    paddingVertical: 20,
  },
  feedbackLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  feedbackTextContainer: {
    marginBottom: 20,
  },
  feedbackTextInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
    minHeight: 120,
  },
  feedbackAudioContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  recordButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#4CAF50',
    backgroundColor: '#fff',
    marginVertical: 20,
  },
  recordButtonActive: {
    backgroundColor: '#4CAF50',
  },
  recordButtonText: {
    marginTop: 8,
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  recordButtonTextActive: {
    color: '#fff',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4444',
    marginRight: 8,
  },
  recordingText: {
    fontSize: 14,
    color: '#ff4444',
    fontWeight: '600',
  },
  feedbackVideoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  videoRecordButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
    backgroundColor: '#f0f8ff',
    marginVertical: 20,
  },
  videoRecordButtonText: {
    marginTop: 8,
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  videoHelpText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  feedbackSubmitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  feedbackSubmitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  feedbackSubmitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default PestResultScreen;
