/**
 * Unit Tests — authApi service
 * Tests every exported function with mocked fetch
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock fetch globally
global.fetch = jest.fn();

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  multiRemove: jest.fn(),
}));

// Mock deviceInfoService (static class with default export — needs __esModule: true)
jest.mock('../../services/deviceInfoService', () => ({
  __esModule: true,
  default: {
    getDeviceInfo: jest.fn().mockResolvedValue({
      platform: 'android',
      model: 'TestPhone',
      version: '13',
      uniqueId: 'test-device-id',
    }),
  },
}));

// Mock config/api — always points at localhost for tests
jest.mock('../../config/api', () => ({
  API_BASE_URL: 'http://localhost:5000/api',
  API_ENDPOINTS: {
    AUTH: {
      REQUEST_OTP: '/auth/request-otp',
      VERIFY_OTP: '/auth/verify-otp',
      LOGIN_OTP: '/auth/login-otp',
      PROFILE: '/auth/profile',
      CHANGE_PASSWORD: '/auth/change-password',
      PASSWORD_STATUS: '/auth/password-status',
    },
  },
}));

import {
  requestOtp,
  verifyOtp,
  requestLoginOtp,
  getUserProfile,
  logout,
  isAuthenticated,
  changePassword,
  getPasswordStatus,
  requestForgotPasswordOtp,
  resetPassword,
} from '../../services/authApi';

const mockFetch = global.fetch as jest.Mock;

function mockResponse(data: any, status = 200, ok = true) {
  mockFetch.mockResolvedValueOnce({
    ok,
    status,
    json: jest.fn().mockResolvedValue(data),
    text: jest.fn().mockResolvedValue(JSON.stringify(data)),
  });
}

function mockNetworkError() {
  mockFetch.mockRejectedValueOnce(new TypeError('Network request failed'));
}

beforeEach(() => {
  jest.clearAllMocks();
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  (AsyncStorage.multiRemove as jest.Mock).mockResolvedValue(undefined);
});

// ─── requestOtp ───────────────────────────────────────────────────────────────

describe('requestOtp()', () => {
  it('calls POST /auth/request-otp with phone', async () => {
    mockResponse({ message: 'OTP sent', phone: '+919876543210' });

    const result = await requestOtp('9876543210');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/request-otp'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ phone: '9876543210' }),
      }),
    );
    expect(result.message).toBe('OTP sent');
  });

  it('throws on non-ok response (400)', async () => {
    mockResponse({ message: 'Invalid phone number' }, 400, false);

    await expect(requestOtp('123')).rejects.toThrow('Invalid phone number');
  });

  it('throws descriptive error on network failure', async () => {
    mockNetworkError();

    await expect(requestOtp('9876543210')).rejects.toThrow(
      /Network request failed/i,
    );
  });

  it('throws on server error (500)', async () => {
    mockResponse({ message: 'Internal server error' }, 500, false);

    await expect(requestOtp('9876543210')).rejects.toThrow();
  });
});

// ─── verifyOtp ────────────────────────────────────────────────────────────────

describe('verifyOtp()', () => {
  const mockUser = { _id: 'user1', phoneNumber: '+919876543210' };
  const mockToken = 'jwt.token.here';

  it('calls POST /auth/verify-otp and stores token', async () => {
    mockResponse({ message: 'Authenticated', token: mockToken, user: mockUser });

    const result = await verifyOtp('9876543210', '123456');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/verify-otp'),
      expect.objectContaining({ method: 'POST' }),
    );
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('authToken', mockToken);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'userData',
      JSON.stringify(mockUser),
    );
    expect(result.token).toBe(mockToken);
  });

  it('includes deviceInfo in body', async () => {
    mockResponse({ message: 'ok', token: 'tok', user: mockUser });

    await verifyOtp('9876543210', '123456');

    const callBody = JSON.parse((mockFetch.mock.calls[0][1] as any).body);
    expect(callBody.deviceInfo).toBeDefined();
  });

  it('throws on wrong OTP (401)', async () => {
    mockResponse({ message: 'Invalid or expired OTP' }, 401, false);

    await expect(verifyOtp('9876543210', '000000')).rejects.toThrow(
      'Invalid or expired OTP',
    );
  });

  it('does not store token when response has no token', async () => {
    mockResponse({ message: 'No token' }, 200, true);

    await verifyOtp('9876543210', '123456');

    expect(AsyncStorage.setItem).not.toHaveBeenCalledWith(
      'authToken',
      expect.anything(),
    );
  });
});

// ─── requestLoginOtp ──────────────────────────────────────────────────────────

describe('requestLoginOtp()', () => {
  it('calls POST /auth/login-otp', async () => {
    mockResponse({ message: 'Login OTP sent', phone: '+919876543210' });

    const result = await requestLoginOtp('9876543210');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/login-otp'),
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result.message).toBeDefined();
  });

  it('throws on user not found (404)', async () => {
    mockResponse({ message: 'User not found' }, 404, false);

    await expect(requestLoginOtp('9999999999')).rejects.toThrow('User not found');
  });
});

// ─── getUserProfile ───────────────────────────────────────────────────────────

describe('getUserProfile()', () => {
  beforeEach(() => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('valid.jwt.token');
  });

  it('calls GET /auth/profile with Authorization header', async () => {
    mockResponse({ user: { _id: '1', phoneNumber: '+91...' } });

    await getUserProfile();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/profile'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer valid.jwt.token',
        }),
      }),
    );
  });

  it('throws on 401 Unauthorized', async () => {
    mockResponse({ message: 'Unauthorized' }, 401, false);

    await expect(getUserProfile()).rejects.toThrow();
  });
});

// ─── logout ───────────────────────────────────────────────────────────────────

describe('logout()', () => {
  it('clears authToken and userData from AsyncStorage', async () => {
    await logout();

    expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
      'authToken',
      'userData',
    ]);
  });
});

// ─── isAuthenticated ──────────────────────────────────────────────────────────

describe('isAuthenticated()', () => {
  it('returns false when no token stored', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    const result = await isAuthenticated();

    expect(result).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns true when token valid and profile returns 200', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('valid.token');
    mockResponse({ user: {} }, 200, true);

    const result = await isAuthenticated();

    expect(result).toBe(true);
  });

  it('returns false and clears storage when 401', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('expired.token');
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401 });

    const result = await isAuthenticated();

    expect(result).toBe(false);
    expect(AsyncStorage.multiRemove).toHaveBeenCalled();
  });

  it('returns true (keeps session) on network error', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('some.token');
    mockNetworkError();

    const result = await isAuthenticated();

    // Network error → assume authenticated (prevent false logouts)
    expect(result).toBe(true);
  });
});

// ─── changePassword ───────────────────────────────────────────────────────────

describe('changePassword()', () => {
  beforeEach(() => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('valid.token');
  });

  it('calls POST /auth/change-password with auth header', async () => {
    mockResponse({ message: 'Password changed' });

    await changePassword('oldPass', 'newPass123');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/change-password'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('throws on wrong current password (400)', async () => {
    mockResponse({ message: 'Incorrect current password' }, 400, false);

    await expect(changePassword('wrong', 'newPass123')).rejects.toThrow();
  });
});

// ─── getPasswordStatus ────────────────────────────────────────────────────────

describe('getPasswordStatus()', () => {
  beforeEach(() => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('valid.token');
  });

  it('returns password status object', async () => {
    mockResponse({
      passwordChangeRequired: false,
      daysSinceLastChange: 10,
      hasPassword: false,
      deviceBound: true,
    });

    const result = await getPasswordStatus();

    expect(result.passwordChangeRequired).toBe(false);
    expect(result.daysSinceLastChange).toBe(10);
  });

  it('passwordChangeRequired true when > 90 days', async () => {
    mockResponse({
      passwordChangeRequired: true,
      daysSinceLastChange: 95,
      hasPassword: true,
      deviceBound: true,
    });

    const result = await getPasswordStatus();

    expect(result.passwordChangeRequired).toBe(true);
  });
});

// ─── requestForgotPasswordOtp ─────────────────────────────────────────────────

describe('requestForgotPasswordOtp()', () => {
  it('calls POST /auth/forgot-password', async () => {
    mockResponse({ message: 'OTP sent', phone: '+919876543210' });

    await requestForgotPasswordOtp('9876543210');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/forgot-password'),
      expect.objectContaining({ method: 'POST' }),
    );
  });
});

// ─── resetPassword ────────────────────────────────────────────────────────────

describe('resetPassword()', () => {
  it('calls POST /auth/reset-password with all required fields', async () => {
    mockResponse({ message: 'Password reset successful' });

    await resetPassword('9876543210', '123456', 'NewPass123');

    const callBody = JSON.parse((mockFetch.mock.calls[0][1] as any).body);
    expect(callBody.phone).toBe('9876543210');
    expect(callBody.otp).toBe('123456');
    expect(callBody.newPassword).toBe('NewPass123');
    expect(callBody.deviceInfo).toBeDefined();
  });
});
