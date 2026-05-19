import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';

const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('authToken');
  } catch (e) {
    return null;
  }
};

export const createPestDetection = async (payload: any) => {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}/pest/detect`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Detection failed');
  return data;
};

// Keep the old function for backwards compatibility
export const saveRecommendation = createPestDetection;

export const listPestDetections = async (userId?: string) => {
  const token = await getAuthToken();
  const qs = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}/pest/detections${qs}`, {
    method: 'GET',
    headers,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'List failed');
  return data;
};

export const listRecommendations = async (guestId?: string) => {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}/pest/recommendations`, {
    method: 'GET',
    headers,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'List failed');
  return data;
};

export const getPestDetection = async (id: string) => {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(
    `${API_BASE_URL}/pest/detections/${encodeURIComponent(id)}`,
    {
      method: 'GET',
      headers,
    },
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Fetch failed');
  return data;
};

// Keep old function for backwards compatibility
export const getRecommendation = getPestDetection;

export const getNearbyRecommendations = async (
  lat: number,
  lng: number,
  radiusMeters = 5000,
) => {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const qs = `?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(
    lng,
  )}&radius=${encodeURIComponent(radiusMeters)}`;
  const res = await fetch(`${API_BASE_URL}/pest/nearby${qs}`, {
    method: 'GET',
    headers,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Nearby fetch failed');
  return data;
};

export const updatePestDetection = async (id: string, payload: any) => {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(
    `${API_BASE_URL}/pest/detections/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    },
  );

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Update failed');
  return data;
};

// Keep old function for backwards compatibility  
export const updateRecommendation = updatePestDetection;

export default {
  // New functions aligned with backend API
  createPestDetection,
  listPestDetections,
  getPestDetection,
  updatePestDetection,
  listRecommendations,
  getNearbyRecommendations,
  // Legacy functions for backwards compatibility
  saveRecommendation,
  getRecommendation,
  updateRecommendation,
};
