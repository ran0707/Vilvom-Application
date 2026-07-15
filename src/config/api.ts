// Centralized API configuration for the Vilvom application

// ─── DEV server (your PC) ────────────────────────────────────────────────────
const DEV_HOST = 'https://app.vilvom.com';

// ─── Production server (E2E Networks) ────────────────────────────────────────
const E2E_SERVER = 'https://app.vilvom.com';

// ─── Backend API  (port 5000) ─────────────────────────────────────────────────
export const DEFAULT_HOST  = E2E_SERVER;
export const API_BASE_URL  = `${DEFAULT_HOST}/api`;

// ─── YOLO AI service (port 8000) ──────────────────────────────────────────────
export const AI_HOST       = __DEV__ ? `${DEV_HOST}:8000` : `${E2E_SERVER}/yolo`;
export const AI_BASE_URL   = AI_HOST;

// ─── Endpoint constants ───────────────────────────────────────────────────────
export const API_ENDPOINTS = {
  AUTH: {
    REQUEST_OTP:     '/auth/request-otp',
    VERIFY_OTP:      '/auth/verify-otp',
    LOGIN_OTP:       '/auth/login-otp',
    PROFILE:         '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password',
    PASSWORD_STATUS: '/auth/password-status',
  },
  USERS: {
    CREATE:         '/users',
    PROFILE:        '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    STATS:          '/users/stats',
    VERIFY_EMAIL:   '/users/verify-email',
    VERIFY_PHONE:   '/users/verify-phone',
    SEARCH:         '/users/search',
  },
  PEST: {
    DETECT:          '/pest/detect',
    DETECTIONS:      '/pest/detections',
    RECOMMENDATIONS: '/pest/recommendations',
    NEARBY:          '/pest/nearby',
    STATISTICS:      '/pest/statistics',
  },
  DRONE: {
    SERVICES:   '/drone/services',
    OPERATORS:  '/drone/operators',
    REQUEST:    '/drone/request',
    REQUESTS:   '/drone/requests',
    STATISTICS: '/drone/statistics',
  },
  FEEDBACK: {
    CREATE: '/feedback',
    PUBLIC: '/feedback/public',
    CHECK:  '/feedback/check',
  },
  HEALTH: '/health',
} as const;

export const AI_ENDPOINTS = {
  PEST_DETECTION: '/detect',
  MODEL_INFO:     '/model-info',
  HEALTH:         '/health',
} as const;

export default {
  DEFAULT_HOST,
  API_BASE_URL,
  AI_HOST,
  AI_BASE_URL,
  API_ENDPOINTS,
  AI_ENDPOINTS,
};


