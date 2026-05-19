import React, { useEffect, useState, useRef } from 'react';
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
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { detectPest } from '../services/pestDetectionApi';
import GeminiService from '../services/geminiService';
import { GEMINI_API_KEY } from '../config/gemini';
import PestApi from '../services/pestApi';
import { createPPCSystemPrompt } from '../utils/ppcGuidelines';

// Function to parse and render markdown text with bold formatting
// Returns a single Text parent so content flows inline; bold segments are nested Text elements.
const renderMarkdownText = (text: string) => {
  // Handle both **bold** and *bold* formats
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);

  return (
    <Text style={styles.assistantMessageText}>
      {parts.map((part, index) => {
        if (
          (part.startsWith('**') && part.endsWith('**')) ||
          (part.startsWith('*') && part.endsWith('*') && part.length > 2)
        ) {
          // Remove * or ** and render as nested bold Text so it stays inline
          const boldText = part.replace(/^\*+|\*+$/g, '');
          return (
            <Text
              key={index}
              style={[styles.assistantMessageText, styles.boldText]}
            >
              {boldText}
            </Text>
          );
        }

        // Normal text segment - as child Text to preserve inline flow
        return <Text key={index}>{part}</Text>;
      })}
    </Text>
  );
};

const { width, height } = Dimensions.get('window');

const PestResultScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [imageUriResolved, setImageUriResolved] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    Array<{
      role: 'user' | 'assistant' | 'system';
      text: string;
      image?: string;
    }>
  >([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const chatScrollRef = useRef<ScrollView | null>(null);
  const [questionnaire, setQuestionnaire] = useState<any>(null);
  const [chatInitialized, setChatInitialized] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'text' | 'audio' | 'video'>(
    'text',
  );
  const [feedbackText, setFeedbackText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  // Generate suggestions based on the result
  const generateSuggestions = (result: any) => {
    if (!result || !result.prediction) return [];

    const pestName = result.prediction.toLowerCase();
    const baseSuggestions = [
      'What are the symptoms of this pest?',
      'Tell me about treatment options',
      'What pesticides should I use?',
      'How to prevent this pest?',
    ];

    // Add specific suggestions based on pest type
    if (pestName.includes('looper')) {
      return [
        ...baseSuggestions,
        'What is the life cycle of looper caterpillar?',
        'Best time to apply insecticides for looper?',
        'Natural enemies of looper caterpillar',
      ];
    } else if (pestName.includes('red slug')) {
      return [
        ...baseSuggestions,
        'How to identify red slug caterpillar?',
        'Safe pesticides for red slug control',
        'Organic methods for red slug management',
      ];
    } else if (pestName.includes('spider mite')) {
      return [
        ...baseSuggestions,
        'Water management for spider mite control',
        'Acaricides for spider mite treatment',
        'Shade management to prevent spider mites',
      ];
    } else if (pestName.includes('leafhopper')) {
      return [
        ...baseSuggestions,
        'Systemic insecticides for leafhopper',
        'Yellow sticky traps for leafhopper monitoring',
        'Pruning techniques for leafhopper control',
      ];
    } else if (pestName.includes('mosquito bug')) {
      return [
        ...baseSuggestions,
        'Feeding habits of tea mosquito bug',
        'Chemical control for mosquito bug',
        'Cultural practices to reduce mosquito bug',
      ];
    } else if (pestName.includes('thrips')) {
      return [
        ...baseSuggestions,
        'Thrips damage symptoms on tea leaves',
        'Insecticides effective against thrips',
        'Sticky traps for thrips monitoring',
      ];
    }

    return baseSuggestions;
  };

  // Local storage keys
  const CHAT_STORAGE_KEY = 'current_chat_session';
  const RESULT_ID_KEY = 'current_result_id';

  // Save chat messages to local storage
  const saveChatToLocal = async (messages: any[], resultId?: string) => {
    try {
      const chatData = {
        messages,
        resultId,
        timestamp: new Date().toISOString(),
      };
      await AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chatData));
      if (resultId) {
        await AsyncStorage.setItem(RESULT_ID_KEY, resultId);
      }
    } catch (e) {
      console.warn('Failed to save chat to local storage:', e);
    }
  };

  // Load chat messages from local storage
  const loadChatFromLocal = async () => {
    try {
      const chatData = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
      const resultId = await AsyncStorage.getItem(RESULT_ID_KEY);

      if (chatData) {
        const parsed = JSON.parse(chatData);
        // Only restore if it's for the current result or if no result ID is set
        if (
          !resultId ||
          !result ||
          result._id === resultId ||
          result._id === parsed.resultId
        ) {
          return parsed.messages;
        }
      }
    } catch (e) {
      console.warn('Failed to load chat from local storage:', e);
    }
    return null;
  };

  // Clear local chat storage
  const clearLocalChat = async () => {
    try {
      await AsyncStorage.removeItem(CHAT_STORAGE_KEY);
      await AsyncStorage.removeItem(RESULT_ID_KEY);
    } catch (e) {
      console.warn('Failed to clear local chat:', e);
    }
  };

  const getParams = () => (route as any).params || {};

  // Clear local chat when navigating away or component unmounts
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      // Clear local chat when leaving the screen
      clearLocalChat();
    });

    return unsubscribe;
  }, [navigation]);

  const normalizeImageUri = (rawImage: any) => {
    if (!rawImage) return null;
    if (typeof rawImage === 'string') {
      if (rawImage.startsWith('data:')) return rawImage;
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
      setSuggestions(generateSuggestions(res));
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
          setSuggestions(generateSuggestions(params.result));
          // For historical data, don't show questionnaire info
          if (!params.isHistorical) {
            setQuestionnaire(params.questionnaire || null);
          }
          // Reset chat initialization for new results
          setChatInitialized(false);
          // If the incoming result already has saved chat, restore it
          const incomingChat = params.result.chat;
          if (Array.isArray(incomingChat) && incomingChat.length > 0) {
            setChatMessages([
              {
                role: 'system',
                text: createPPCSystemPrompt(params.result),
              },
              ...incomingChat.map((c: any) => ({
                role: c.role || 'assistant',
                text: c.text || '',
              })),
            ]);
            setChatInitialized(true);
          } else {
            // Initialize with system prompt for new detections
            setChatMessages([
              {
                role: 'system',
                text: createPPCSystemPrompt(params.result),
              },
            ]);
            setChatInitialized(true);
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
      let resolved = null;
      if (raw && typeof raw === 'string') {
        resolved = normalizeImageUri(raw);
        if (!resolved) {
          const cleaned = raw.replace(/\s+/g, '');
          if (cleaned.length > 0)
            resolved = `data:image/jpeg;base64,${cleaned}`;
        }
      }
      if (!resolved) resolved = params.imageUri || null;
      setImageUriResolved(resolved);
      setImageLoadError(false);

      // Initialize chat with system prompt that includes pest analysis data and PPC guidelines
      // Only initialize if chat hasn't been initialized yet (to prevent clearing existing chat)
      if (!chatInitialized) {
        // First try to load from local storage
        const localChat = await loadChatFromLocal();
        if (localChat && localChat.length > 1) {
          // More than just system message
          setChatMessages(localChat);
          setChatInitialized(true);
        } else {
          // Initialize fresh chat
          const initialMessages: Array<{
            role: 'user' | 'assistant' | 'system';
            text: string;
            image?: string;
          }> = [
            {
              role: 'system',
              text: createPPCSystemPrompt(result),
            },
          ];
          setChatMessages(initialMessages);
          await saveChatToLocal(initialMessages, result._id);
          setChatInitialized(true);
        }
      }

      // Persist detection to backend
      (async () => {
        try {
          if (result.meta && result.meta.savedToServer) return;

          const lat = result.meta?.lat || result.lat || 0;
          const lng = result.meta?.lng || result.lng || 0;

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
              ].filter(Boolean)
            : undefined;

          const payload: any = {
            pestName: result.prediction || 'Unknown',
            confidence: result.confidence || 0,
            boundingBox: result.bounding_box || result.boundingBox || undefined,
            symptoms: result.symptoms || [],
            biological_control: result.biological_control || [],
            chemical_control: result.chemical_control || [],
            mechanical_control: result.mechanical_control || [],
            location:
              lat && lng
                ? { type: 'Point', coordinates: [lng, lat] }
                : undefined,
            processed_image: null,
            guestId: undefined,
            meta: result.meta || {},
            questionnaire:
              questionnaireItems && questionnaireItems.length > 0
                ? questionnaireItems
                : undefined,
            // chat: map text → message, add required id field, exclude system messages
            chat: chatMessages
              .filter(m => m.role !== 'system')
              .map((m, i) => ({
                id: `msg_${i}`,
                role: m.role,
                message: m.text,
                timestamp: new Date().toISOString(),
              })),
          };

          const saved = await PestApi.saveRecommendation(payload);
          console.log('Initial recommendation saved:', saved);
          setResult((r: any) => ({
            ...(r || {}),
            _id: saved.recommendation._id, // Make sure we have the ID for future updates
            meta: { ...((r && r.meta) || {}), savedToServer: true },
          }));
        } catch (e) {
          console.error('Failed to save recommendation to server:', e);
          // Still mark as saved to prevent repeated attempts, but log the error
          setResult((r: any) => ({
            ...(r || {}),
            meta: { ...((r && r.meta) || {}), savedToServer: true },
          }));
        }
      })();

      // Fetch nearby aggregated data for this location (if available)
      (async () => {
        try {
          const lat = result.meta?.lat || result.lat || null;
          const lng = result.meta?.lng || result.lng || null;
          if (lat && lng) {
            const nearby = await PestApi.getNearbyRecommendations(
              Number(lat),
              Number(lng),
              5000,
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

  const sendMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;

    const userText = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userText }]);
    setChatLoading(true);

    // Scroll to bottom after adding user message
    setTimeout(() => {
      chatScrollRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const msgs = chatMessages.map(m => ({
        role: m.role,
        content: m.text,
      }));
      msgs.push({ role: 'user', content: userText });

      const resp = await GeminiService.sendChatMessage(
        GEMINI_API_KEY,
        msgs as any,
      );

      let assistantText = String(resp || '');
      try {
        const parsed = JSON.parse(assistantText);
        if (parsed.output_text) assistantText = parsed.output_text;
        else if (parsed.candidates && parsed.candidates[0]) {
          const c = parsed.candidates[0];
          if (c.content && Array.isArray(c.content))
            assistantText = c.content.map((p: any) => p.text || '').join('\n');
          else if (c.content && c.content.text) assistantText = c.content.text;
        }
      } catch (e) {
        // not JSON - use raw text
      }

      // Clean up the response - make it very concise
      assistantText = assistantText
        .replace(/\n{3,}/g, '\n') // Replace multiple newlines with single
        .replace(/^\s*[-*]\s*/gm, '• ') // Convert markdown lists to bullet points
        .replace(/\*\*(.*?)\*\*/g, '**$1**') // Ensure bold formatting is preserved
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim();

      // Remove character limit to allow full responses
      // assistantText = assistantText.length > 500 ? assistantText.substring(0, 450) + '...' : assistantText;

      setChatMessages(prev => [
        ...prev,
        { role: 'assistant', text: assistantText },
      ]);

      // Save updated chat to local storage immediately
      const updatedMessages = [
        ...chatMessages,
        { role: 'user', text: userText },
        { role: 'assistant', text: assistantText },
      ];
      await saveChatToLocal(updatedMessages, result?._id);

      // Update the result state to include the new chat message for persistence
      setResult((r: any) => {
        if (!r) return r;
        const updatedChat = [
          ...(r.chat || []),
          { role: 'user', text: userText, timestamp: new Date() },
          { role: 'assistant', text: assistantText, timestamp: new Date() },
        ];
        // Save to local storage
        saveChatToLocal(updatedMessages, r._id || result?._id);
        return {
          ...r,
          chat: updatedChat,
        };
      });

      // Persist the updated chat to backend if we have a saved recommendation ID
      if (result && result._id) {
        try {
          const existingChat: any[] = result.chat || [];
          const updatedChat = [
            ...existingChat.map((m: any, i: number) => ({
              id: m.id || `msg_${i}`,
              role: m.role,
              message: m.message || m.text || '',
              timestamp:
                typeof m.timestamp === 'string'
                  ? m.timestamp
                  : new Date().toISOString(),
            })),
            {
              id: `msg_${existingChat.length}`,
              role: 'user',
              message: userText,
              timestamp: new Date().toISOString(),
            },
            {
              id: `msg_${existingChat.length + 1}`,
              role: 'assistant',
              message: assistantText,
              timestamp: new Date().toISOString(),
            },
          ];
          const updateResult = await PestApi.updateRecommendation(result._id, {
            chat: updatedChat,
          });
          console.log('Chat update successful:', updateResult);
        } catch (e) {
          console.error('Failed to update chat in backend:', e);
        }
      }

      // Scroll to bottom after adding assistant message
      setTimeout(() => {
        chatScrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (e) {
      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text:
            t('pest_result.chat_error') ||
            'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

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
        {/* Chat Messages */}
        <ScrollView
          ref={chatScrollRef as any}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Result Card - this will scroll away as chat grows */}
          {result && (
            <View style={styles.resultCard}>
              {/* Header with image and title - Made bigger */}
              <View style={styles.resultHeaderLarge}>
                <TouchableOpacity onPress={() => setImageModalVisible(true)}>
                  {imageUriResolved ? (
                    <Image
                      source={{ uri: imageUriResolved }}
                      style={styles.resultImageLarge}
                    />
                  ) : (
                    <View style={styles.resultImagePlaceholderLarge}>
                      <Icon name="eco" size={32} color="#666" />
                    </View>
                  )}
                </TouchableOpacity>
                <View style={styles.resultTitleContainerLarge}>
                  <Text style={styles.resultTitleLarge}>
                    {result.prediction || 'Unknown'}
                  </Text>
                  {result.plant && (
                    <Text style={styles.resultSubtitleLarge}>
                      {result.plant}
                    </Text>
                  )}
                  {questionnaire && (
                    <View style={styles.questionnaireInfo}>
                      <Text style={styles.questionnaireText}>
                        {questionnaire.acreSize} Hectacer •{' '}
                        {questionnaire.lastPesticideUse}
                      </Text>
                      <Text style={styles.uploadTypeText}>
                        {questionnaire.isFirstTimeUpload
                          ? 'First Time Upload'
                          : 'Rechecking'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Description */}
              <Text style={styles.resultDescription}>
                {result.prediction} on {result.plant || 'Plant'}
              </Text>
              <Text style={styles.resultDetails}>
                {result.symptoms && Array.isArray(result.symptoms)
                  ? result.symptoms.slice(0, 2).join('. ') + '.'
                  : result.symptoms ||
                    'Detailed analysis of the detected pest affecting various plant parts.'}
              </Text>

              {/* Treatment and Prevention - show only API-provided controls/recommendations */}
              <Text style={styles.sectionTitle}>Treatment and Prevention</Text>

              {/* Chemical control (from model) */}
              {result.chemical_control && (
                <View style={styles.treatmentItem}>
                  <Text style={styles.treatmentTitle}>• Chemical control:</Text>
                  <Text style={styles.treatmentText}>
                    {Array.isArray(result.chemical_control)
                      ? result.chemical_control.join(', ')
                      : String(result.chemical_control)}
                  </Text>
                </View>
              )}

              {/* Biological control (from model) */}
              {result.biological_control && (
                <View style={styles.treatmentItem}>
                  <Text style={styles.treatmentTitle}>
                    • Biological control:
                  </Text>
                  <Text style={styles.treatmentText}>
                    {Array.isArray(result.biological_control)
                      ? result.biological_control.join(', ')
                      : String(result.biological_control)}
                  </Text>
                </View>
              )}

              {/* Mechanical control (from model) */}
              {result.mechanical_control && (
                <View style={styles.treatmentItem}>
                  <Text style={styles.treatmentTitle}>
                    • Mechanical control:
                  </Text>
                  <Text style={styles.treatmentText}>
                    {Array.isArray(result.mechanical_control)
                      ? result.mechanical_control.join(', ')
                      : String(result.mechanical_control)}
                  </Text>
                </View>
              )}

              {/* Any free-text recommendations returned by the model */}
              {result.recommendations && (
                <View style={styles.treatmentItem}>
                  <Text style={styles.treatmentTitle}>• Recommendations:</Text>
                  <Text style={styles.treatmentText}>
                    {typeof result.recommendations === 'string'
                      ? result.recommendations
                      : Array.isArray(result.recommendations)
                      ? result.recommendations.join('\n')
                      : JSON.stringify(result.recommendations)}
                  </Text>
                </View>
              )}

              {/* Fallback when no control fields returned by model */}
              {!result.chemical_control &&
                !result.biological_control &&
                !result.mechanical_control &&
                !result.recommendations && (
                  <View style={styles.treatmentItem}>
                    <Text style={styles.treatmentText}>
                      No control recommendations were provided by the model.
                    </Text>
                  </View>
                )}

              {/* Nearby Region Card */}
              <View style={styles.nearbyRegionCard}>
                <Text style={styles.nearbyRegionTitle}>
                  🗺️ Regional Pest Alert
                </Text>
                <Text style={styles.nearbyRegionText}>
                  This pest has been reported in your nearby 5km region. Stay
                  vigilant and monitor your plantation regularly. Consider
                  implementing preventive measures to protect your crops.
                </Text>
              </View>
            </View>
          )}

          {/* Chat Messages */}
          {chatMessages
            .filter(m => m.role !== 'system')
            .map((message, index) => (
              <View key={`msg-${index}`} style={styles.messageWrapper}>
                {message.role === 'user' ? (
                  <View style={styles.userMessageContainer}>
                    <View style={styles.userMessage}>
                      <Text style={styles.userMessageText}>{message.text}</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.assistantMessageContainer}>
                    <View style={styles.assistantMessage}>
                      {renderMarkdownText(message.text)}
                    </View>
                  </View>
                )}
              </View>
            ))}

          {chatLoading && (
            <View style={styles.assistantMessageContainer}>
              <View style={styles.assistantMessage}>
                <ActivityIndicator size="small" color="#4CAF50" />
                <Text style={styles.loadingText}>Thinking...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsHeader}>💡 Quick Questions</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestionsScroll}
            >
              {suggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionChip}
                  onPress={() => {
                    setChatInput(suggestion);
                  }}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Input Area */}
        <View style={styles.inputArea}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={chatInput}
              onChangeText={setChatInput}
              placeholder="Ask: pesticides, why, treatment, symptoms..."
              placeholderTextColor="#999"
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                { opacity: chatInput.trim() ? 1 : 0.5 },
              ]}
              onPress={sendMessage}
              disabled={!chatInput.trim() || chatLoading}
            >
              <Icon name="send" size={20} color="#4CAF50" />
            </TouchableOpacity>
          </View>
        </View>
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

  // Nearby region card
  nearbyRegionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nearbyRegionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  nearbyRegionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
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
