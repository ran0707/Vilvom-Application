import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { submitFeedback, dismissFeedbackPopup } from '../services/feedbackApi';

interface Props {
  visible: boolean;
  userName?: string;
  userLocation?: string;
  onDone: () => void;
}

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

const AppFeedbackModal: React.FC<Props> = ({
  visible,
  userName = '',
  userLocation = '',
  onDone,
}) => {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [name, setName] = useState(userName);
  const [location, setLocation] = useState(userLocation);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (rating === 0) { setError('Please select a star rating.'); return; }
    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (!text.trim()) { setError('Please write a short feedback.'); return; }

    setError('');
    setSubmitting(true);
    try {
      await submitFeedback({
        name: name.trim(),
        rating,
        feedback: text.trim(),
        location: location.trim() || undefined,
      });
      setSubmitted(true);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    dismissFeedbackPopup();
    onDone();
  };

  const handleClose = () => {
    if (submitted) {
      onDone();
    } else {
      handleSkip();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.kvWrapper}
          >
            <View style={styles.card}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.iconWrap}>
                  <MaterialCommunityIcons name="leaf" size={22} color="#2E7D32" />
                </View>
                <Text style={styles.title}>
                  {submitted ? 'Thank you!' : 'How was your experience?'}
                </Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                  <MaterialCommunityIcons name="close" size={20} color="#888" />
                </TouchableOpacity>
              </View>

              {submitted ? (
                <View style={styles.successBlock}>
                  <MaterialCommunityIcons name="check-circle" size={56} color="#2E7D32" />
                  <Text style={styles.successText}>
                    Your feedback has been saved. We appreciate your time!
                  </Text>
                  <TouchableOpacity style={styles.doneBtn} onPress={onDone}>
                    <Text style={styles.doneBtnText}>Close</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={styles.subtitle}>
                    Help us improve Vilvom with a quick review
                  </Text>

                  {/* Star Rating */}
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity
                        key={star}
                        onPress={() => setRating(star)}
                        style={styles.starBtn}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons
                          name={star <= rating ? 'star' : 'star-outline'}
                          size={36}
                          color={star <= rating ? '#FFB300' : '#CCC'}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                  {rating > 0 && (
                    <Text style={styles.ratingLabel}>{LABELS[rating]}</Text>
                  )}

                  {/* Name + Location row */}
                  <View style={styles.rowInputs}>
                    <TextInput
                      style={[styles.input, styles.halfInput]}
                      placeholder="Your name"
                      placeholderTextColor="#AAA"
                      value={name}
                      onChangeText={setName}
                      maxLength={60}
                    />
                    <TextInput
                      style={[styles.input, styles.halfInput]}
                      placeholder="City / Region"
                      placeholderTextColor="#AAA"
                      value={location}
                      onChangeText={setLocation}
                      maxLength={60}
                    />
                  </View>

                  {/* Feedback text */}
                  <TextInput
                    style={[styles.input, styles.textarea]}
                    placeholder="Share your experience…"
                    placeholderTextColor="#AAA"
                    value={text}
                    onChangeText={setText}
                    multiline
                    numberOfLines={4}
                    maxLength={500}
                    textAlignVertical="top"
                  />

                  {error ? <Text style={styles.errorText}>{error}</Text> : null}

                  {/* Actions */}
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.skipBtn}
                      onPress={handleSkip}
                      disabled={submitting}
                    >
                      <Text style={styles.skipText}>Maybe later</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.submitBtn, submitting && styles.btnDisabled]}
                      onPress={handleSubmit}
                      disabled={submitting}
                      activeOpacity={0.85}
                    >
                      {submitting ? (
                        <ActivityIndicator color="#FFF" size="small" />
                      ) : (
                        <Text style={styles.submitText}>Submit</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  kvWrapper: { width: '100%' },
  card: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  title: { flex: 1, fontSize: 17, fontWeight: '700', color: '#1B5E20' },
  closeBtn: { padding: 4 },
  subtitle: { fontSize: 13, color: '#666', marginBottom: 16, lineHeight: 18 },

  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 4,
    gap: 6,
  },
  starBtn: { padding: 4 },
  ratingLabel: {
    textAlign: 'center',
    fontSize: 13,
    color: '#FFB300',
    fontWeight: '600',
    marginBottom: 16,
  },

  rowInputs: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 0,
  },
  halfInput: {
    flex: 1,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
    backgroundColor: '#FAFAFA',
  },
  textarea: { height: 90, paddingTop: 10 },

  errorText: { color: '#C62828', fontSize: 12, marginBottom: 8 },

  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  skipBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CCC',
    alignItems: 'center',
  },
  skipText: { color: '#888', fontWeight: '600', fontSize: 14 },
  submitBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
  },
  submitText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  btnDisabled: { opacity: 0.6 },

  successBlock: { alignItems: 'center', paddingVertical: 20, gap: 16 },
  successText: { fontSize: 14, color: '#444', textAlign: 'center', lineHeight: 21 },
  doneBtn: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 12,
  },
  doneBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});

export default AppFeedbackModal;
