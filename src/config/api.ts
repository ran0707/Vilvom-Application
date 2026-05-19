// Centralized API configuration for the Vilvom application
import { Platform } from 'react-native';

// Set this to your E2E VM public IP or domain once deployed
// Both backend (/api) and YOLO (/yolo) are served through Nginx on port 80
const E2E_SERVER = 'http://YOUR_E2E_IP'; // e.g. 'http://103.xx.xx.xx'
const PROD_API = E2E_SERVER;
const PROD_AI_API = E2E_SERVER;

const getAndroidHost = () => {
  // 10.0.2.2 is the Android emulator's alias for the host machine (localhost on your PC).
  // For a physical device over USB, run: adb reverse tcp:5000 tcp:5000
  // then change this back to 'http://localhost'.
  return 'http://10.0.2.2';
};

const getBaseHost = () => {
  return __DEV__
    ? Platform.select({
        android: getAndroidHost(),
        ios: 'http://localhost',
        default: 'http://localhost',
      })!
    : PROD_API;
};

// Backend API — dev: direct port 5000 | prod: nginx /api prefix on port 80
export const DEFAULT_HOST = __DEV__ ? `${getBaseHost()}:5000` : PROD_API;
export const API_BASE_URL = `${DEFAULT_HOST}/api`;

// YOLO AI Service — dev: direct port 8000 | prod: nginx /yolo prefix on port 80
export const AI_HOST = __DEV__ ? `${getBaseHost()}:8000` : `${PROD_AI_API}/yolo`;
export const AI_BASE_URL = AI_HOST;

// Export commonly used endpoints
export const API_ENDPOINTS = {
  AUTH: {
    REQUEST_OTP: '/auth/request-otp',
    VERIFY_OTP: '/auth/verify-otp',
    LOGIN_OTP: '/auth/login-otp',
    PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password',
    PASSWORD_STATUS: '/auth/password-status',
  },
  USERS: {
    CREATE: '/users',
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    STATS: '/users/stats',
    VERIFY_EMAIL: '/users/verify-email',
    VERIFY_PHONE: '/users/verify-phone',
    SEARCH: '/users/search',
  },
  PEST: {
    DETECT: '/pest/detect',
    DETECTIONS: '/pest/detections',
    RECOMMENDATIONS: '/pest/recommendations',
    NEARBY: '/pest/nearby',
    STATISTICS: '/pest/statistics',
  },
  DRONE: {
    SERVICES: '/drone/services',
    OPERATORS: '/drone/operators',
    REQUEST: '/drone/request',
    REQUESTS: '/drone/requests',
    STATISTICS: '/drone/statistics',
  },
  HEALTH: '/health',
} as const;

// AI Service endpoints (port 8000)
export const AI_ENDPOINTS = {
  PEST_DETECTION: '/detect',
  MODEL_INFO: '/model-info',
  HEALTH: '/health',
} as const;

export default {
  DEFAULT_HOST,
  API_BASE_URL,
  AI_HOST,
  AI_BASE_URL,
  API_ENDPOINTS,
  AI_ENDPOINTS,
};
