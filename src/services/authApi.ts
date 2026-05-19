// API service for authentication and user management
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import DeviceInfoService, { DeviceInformation } from './deviceInfoService';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';

export interface User {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  isPhoneVerified?: boolean;
  isDeviceBound?: boolean;
  profileInfo?: {
    fullName?: string;
    dateOfBirth?: string;
    address?: string;
    occupation?: string;
    bio?: string;
    profileImage?: string;
  };
  profileImage?: string;
  createdAt?: string;
  memberSince?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface OtpResponse {
  message: string;
  phone: string;
}

export interface PasswordStatusResponse {
  passwordChangeRequired: boolean;
  lastPasswordChange: string;
  daysSinceLastChange: number;
  hasPassword: boolean;
  deviceBound: boolean;
  message?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  errors?: Array<{ msg: string; param: string }>;
}

// Helper function to get auth token from storage
const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('authToken');
  } catch (error) {
    return null;
  }
};

// Helper function to set auth token
const setAuthToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem('authToken', token);
  } catch (error) {
    console.error('Error storing auth token:', error);
  }
};

// Helper function to store user data
const setUserData = async (user: User): Promise<void> => {
  try {
    await AsyncStorage.setItem('userData', JSON.stringify(user));
  } catch (error) {
    console.error('Error storing user data:', error);
  }
};

// Helper function to get user data from storage
const getUserData = async (): Promise<User | null> => {
  try {
    const userData = await AsyncStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error retrieving user data:', error);
    return null;
  }
};

// Helper function to clear all stored data
const clearStoredData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove(['authToken', 'userData']);
  } catch (error) {
    console.error('Error clearing stored data:', error);
  }
};

// Helper function to make authenticated requests
const makeAuthRequest = async (
  url: string,
  options: RequestInit = {},
): Promise<any> => {
  const token = await getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    });

    // Be defensive if server returns non-json
    const text = await response.text();
    let data: any = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      data = { message: text };
    }

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  } catch (err: any) {
    // Normalize network errors to a helpful message
    if (
      err instanceof TypeError &&
      err.message &&
      err.message.includes('Network request failed')
    ) {
      throw new Error(
        `Network request failed: cannot reach ${API_BASE_URL}. If you're running on Android emulator use 10.0.2.2 or update the API host to your machine IP.`,
      );
    }
    throw err;
  }
};

// Request OTP for signup
export const requestOtp = async (phone: string): Promise<OtpResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/request-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send OTP');
    }

    return data;
  } catch (error) {
    console.error('Request OTP error:', error);
    throw error;
  }
};

// Verify OTP and complete signup
export const verifyOtp = async (
  phone: string,
  otp: string,
): Promise<AuthResponse> => {
  try {
    // Get device info for device binding
    const deviceInfo = await DeviceInfoService.getDeviceInfo();

    const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone, otp, deviceInfo }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'OTP verification failed');
    }

    // Store the token and user data
    if (data.token) {
      await setAuthToken(data.token);
    }

    if (data.user) {
      await setUserData(data.user);
    }

    return data;
  } catch (error) {
    console.error('Verify OTP error:', error);
    throw error;
  }
};

// Request OTP for login
export const requestLoginOtp = async (phone: string): Promise<OtpResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send login OTP');
    }

    return data;
  } catch (error) {
    console.error('Request login OTP error:', error);
    throw error;
  }
};

// Signup function (legacy - for email-based signup)
export const signup = async (
  name: string,
  email: string,
  password: string,
  confirmPassword: string,
): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        password,
        confirmPassword,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Signup failed');
    }

    // Store the token
    if (data.token) {
      await setAuthToken(data.token);
    }

    return data;
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
};

// Login function
export const login = async (
  email: string,
  password: string,
): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    // Store the token
    if (data.token) {
      await setAuthToken(data.token);
    }

    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Get user profile
export const getUserProfile = async (): Promise<{ user: User }> => {
  return makeAuthRequest('/auth/profile');
};

// Update user profile
export const updateUserProfile = async (
  name?: string,
  email?: string,
  profileInfo?: {
    fullName?: string;
    dateOfBirth?: string;
    address?: string;
    occupation?: string;
    bio?: string;
    profileImage?: string;
  },
): Promise<{ message: string; user: User }> => {
  const updateData: {
    name?: string;
    email?: string;
    profileInfo?: {
      fullName?: string;
      dateOfBirth?: string;
      address?: string;
      occupation?: string;
      bio?: string;
      profileImage?: string;
    };
  } = {};

  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email;
  if (profileInfo !== undefined) updateData.profileInfo = profileInfo;

  return makeAuthRequest('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(updateData),
  });
};

// Get user data for home screen
export const getHomeData = async (): Promise<{ user: User }> => {
  return makeAuthRequest('/auth/profile');
};

// Logout function
export const logout = async (): Promise<void> => {
  try {
    // Clear all stored data
    await clearStoredData();
  } catch (error) {
    console.error('Logout error:', error);
  }
};

// Check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const token = await getAuthToken();
    if (!token) {
      return false;
    }

    // Make a lightweight API call to verify token is still valid
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 401) {
      // Token is invalid, clear stored data
      await clearStoredData();
      return false;
    }

    return response.ok;
  } catch (error) {
    // If there's a network error or timeout, assume user is authenticated if they have a token
    // This prevents logout during network issues
    const token = await getAuthToken();
    return !!token;
  }
};

// Password Management Functions

// Request OTP for forgot password
export const requestForgotPasswordOtp = async (
  phone: string,
): Promise<OtpResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send forgot password OTP');
    }

    return data;
  } catch (error) {
    console.error('Request forgot password OTP error:', error);
    throw error;
  }
};

// Reset password with OTP
export const resetPassword = async (
  phone: string,
  otp: string,
  newPassword: string,
): Promise<{ message: string }> => {
  try {
    const deviceInfo = await DeviceInfoService.getDeviceInfo();

    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone, otp, newPassword, deviceInfo }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Password reset failed');
    }

    return data;
  } catch (error) {
    console.error('Reset password error:', error);
    throw error;
  }
};

// Change password for logged-in users
export const changePassword = async (
  currentPassword: string,
  newPassword: string,
): Promise<{ message: string }> => {
  const deviceInfo = await DeviceInfoService.getDeviceInfo();
  
  return makeAuthRequest('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword, deviceInfo }),
  });
};

// Check password status (monthly requirement, etc.)
export const getPasswordStatus = async (): Promise<PasswordStatusResponse> => {
  return makeAuthRequest('/auth/password-status');
};

// Export session management functions
export const getStoredAuthToken = getAuthToken;
export const getStoredUserData = getUserData;
export const clearUserSession = clearStoredData;
