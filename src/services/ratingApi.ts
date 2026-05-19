import { API_BASE_URL } from '../config/api';
import { getItem } from '../utils/storage';

export interface RatingData {
  serviceType: 'advisory' | 'drone';
  serviceId: string;
  rating: number;
  feedback?: string;
  contactId?: string; // For advisory ratings
  droneServiceType?: string; // For drone service ratings
}

export interface RatingResponse {
  success: boolean;
  message?: string;
  averageRating?: number;
  totalRatings?: number;
}

/**
 * Submit a rating for a service
 */
export const submitServiceRating = async (
  ratingData: RatingData,
): Promise<RatingResponse> => {
  try {
    const token = await getItem('userToken');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/ratings/submit`, {
      method: 'POST',
      headers,
      body: JSON.stringify(ratingData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to submit rating');
    }

    return data;
  } catch (error) {
    console.error('Rating submission error:', error);
    throw error;
  }
};

/**
 * Get average rating for a service
 */
export const getServiceRating = async (
  serviceType: 'advisory' | 'drone',
  serviceId: string,
): Promise<{ averageRating: number; totalRatings: number }> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/ratings/${serviceType}/${serviceId}`,
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get rating');
    }

    return {
      averageRating: data.averageRating || 0,
      totalRatings: data.totalRatings || 0,
    };
  } catch (error) {
    console.error('Get rating error:', error);
    return { averageRating: 0, totalRatings: 0 };
  }
};

/**
 * Get user's rating for a specific service
 */
export const getUserServiceRating = async (
  serviceType: 'advisory' | 'drone',
  serviceId: string,
): Promise<number> => {
  try {
    const token = await getItem('userToken');

    if (!token) {
      return 0; // Not authenticated
    }

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    const response = await fetch(
      `${API_BASE_URL}/ratings/user/${serviceType}/${serviceId}`,
      { headers },
    );

    const data = await response.json();

    if (!response.ok) {
      return 0; // No rating found
    }

    return data.rating || 0;
  } catch (error) {
    console.error('Get user rating error:', error);
    return 0;
  }
};

/**
 * Update an existing rating
 */
export const updateServiceRating = async (
  ratingId: string,
  newRating: number,
  feedback?: string,
): Promise<RatingResponse> => {
  try {
    const token = await getItem('userToken');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/ratings/${ratingId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ rating: newRating, feedback }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update rating');
    }

    return data;
  } catch (error) {
    console.error('Rating update error:', error);
    throw error;
  }
};

/**
 * Delete a rating
 */
export const deleteServiceRating = async (
  ratingId: string,
): Promise<RatingResponse> => {
  try {
    const token = await getItem('userToken');

    const headers: Record<string, string> = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/ratings/${ratingId}`, {
      method: 'DELETE',
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete rating');
    }

    return data;
  } catch (error) {
    console.error('Rating deletion error:', error);
    throw error;
  }
};
