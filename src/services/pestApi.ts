import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { showErrorToast } from '../utils/toast';

const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('authToken');
  } catch (e) {
    return null;
  }
};

export const createPestDetection = async (payload: any) => {
  try {
    const token = await getAuthToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/pest/detect`, { method: 'POST', headers, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Detection failed');
    return data;
  } catch (error: any) {
    showErrorToast(error.message || 'Detection failed');
    throw error;
  }
};

// Keep the old function for backwards compatibility
export const saveRecommendation = createPestDetection;

export const listPestDetections = async (userId?: string) => {
  try {
    const token = await getAuthToken();
    const qs = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/pest/detections${qs}`, { method: 'GET', headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'List failed');
    return data;
  } catch (error: any) {
    showErrorToast(error.message || 'Failed to load detections');
    throw error;
  }
};

export const listRecommendations = async (guestId?: string) => {
  try {
    const token = await getAuthToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/pest/recommendations`, { method: 'GET', headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'List failed');
    return data;
  } catch (error: any) {
    showErrorToast(error.message || 'Failed to load recommendations');
    throw error;
  }
};

export const getPestDetection = async (id: string) => {
  try {
    const token = await getAuthToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/pest/detections/${encodeURIComponent(id)}`, { method: 'GET', headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Fetch failed');
    return data;
  } catch (error: any) {
    showErrorToast(error.message || 'Failed to fetch detection');
    throw error;
  }
};

// Keep old function for backwards compatibility
export const getRecommendation = getPestDetection;

export const getNearbyRecommendations = async (lat: number, lng: number, radiusKm = 5) => {
  try {
    const token = await getAuthToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const qs = `?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&radius=${encodeURIComponent(radiusKm)}`;
    const res = await fetch(`${API_BASE_URL}/pest/nearby${qs}`, { method: 'GET', headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Nearby fetch failed');
    return data;
  } catch (error: any) {
    showErrorToast(error.message || 'Failed to fetch nearby data');
    throw error;
  }
};

export const patchDetection = async (id: string, payload: any, silent = false) => {
  try {
    const token = await getAuthToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/pest/detections/${encodeURIComponent(id)}`, { method: 'PATCH', headers, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Patch failed');
    return data;
  } catch (error: any) {
    if (!silent) showErrorToast(error.message || 'Update failed');
    throw error;
  }
};

export const updatePestDetection = async (id: string, payload: any) => {
  try {
    const token = await getAuthToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/pest/detections/${encodeURIComponent(id)}`, { method: 'PUT', headers, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Update failed');
    return data;
  } catch (error: any) {
    showErrorToast(error.message || 'Update failed');
    throw error;
  }
};

// Keep old function for backwards compatibility
export const updateRecommendation = updatePestDetection;

export default {
  createPestDetection,
  listPestDetections,
  getPestDetection,
  updatePestDetection,
  patchDetection,
  listRecommendations,
  getNearbyRecommendations,
  // Legacy aliases
  saveRecommendation,
  getRecommendation,
  updateRecommendation,
};
