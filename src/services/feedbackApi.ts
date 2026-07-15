import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { showErrorToast } from '../utils/toast';

const FEEDBACK_SUBMITTED_KEY = 'feedback_submitted';
// In-memory flag: skip within same app session after user taps "Maybe later"
let shownThisSession = false;

export interface FeedbackPayload {
  name: string;
  rating: number;
  feedback: string;
  location?: string;
}

export interface PublicFeedback {
  id: string;
  name: string;
  rating: number;
  feedback: string;
  location?: string;
  createdAt: string;
}

const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('authToken');
  } catch {
    return null;
  }
};

export const submitFeedback = async (payload: FeedbackPayload): Promise<void> => {
  try {
    const token = await getAuthToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.FEEDBACK.CREATE}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Failed to submit feedback: ${res.status} ${text}`);
    }

    // Mark as submitted so popup never shows again across sessions
    await AsyncStorage.setItem(FEEDBACK_SUBMITTED_KEY, '1');
    shownThisSession = true;
  } catch (error: any) {
    showErrorToast(error.message || 'Failed to submit feedback');
    throw error;
  }
};

// Call when user taps "Maybe later" — suppresses for this session only
export const dismissFeedbackPopup = (): void => {
  shownThisSession = true;
};

export const shouldShowFeedbackPopup = async (): Promise<boolean> => {
  try {
    // Already shown once this session (submitted or skipped)
    if (shownThisSession) return false;
    // User has already submitted feedback — never show again
    const submitted = await AsyncStorage.getItem(FEEDBACK_SUBMITTED_KEY);
    return submitted !== '1';
  } catch {
    return false;
  }
};

export const getPublicFeedbacks = async (limit = 20): Promise<PublicFeedback[]> => {
  try {
    const res = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.FEEDBACK.PUBLIC}?limit=${limit}`,
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.feedbacks ?? [];
  } catch {
    return [];
  }
};
