/**
 * Unit Tests — src/config/api.ts
 * Verifies correct URL construction for Android emulator vs production
 */

describe('API Config', () => {
  // Reset modules before each test so Platform mock takes effect
  beforeEach(() => {
    jest.resetModules();
  });

  it('Android DEV: API_BASE_URL uses 10.0.2.2 (emulator → host)', () => {
    jest.mock('react-native', () => ({
      Platform: { select: (map: any) => map.android },
    }));

    const { API_BASE_URL, AI_HOST } = require('../../config/api');

    expect(API_BASE_URL).toContain('10.0.2.2');
    expect(API_BASE_URL).toContain('5000');
    expect(AI_HOST).toContain('10.0.2.2');
    expect(AI_HOST).toContain('8000');
  });

  it('iOS DEV: API_BASE_URL uses localhost', () => {
    jest.mock('react-native', () => ({
      Platform: { select: (map: any) => map.ios },
    }));

    const { API_BASE_URL } = require('../../config/api');

    expect(API_BASE_URL).toContain('localhost');
    expect(API_BASE_URL).toContain('5000');
  });

  it('API_BASE_URL ends with /api', () => {
    jest.mock('react-native', () => ({
      Platform: { select: (map: any) => map.android },
    }));

    const { API_BASE_URL } = require('../../config/api');

    expect(API_BASE_URL.endsWith('/api')).toBe(true);
  });

  it('API_ENDPOINTS contains all required keys', () => {
    jest.mock('react-native', () => ({
      Platform: { select: (map: any) => map.android },
    }));

    const { API_ENDPOINTS } = require('../../config/api');

    expect(API_ENDPOINTS.AUTH.REQUEST_OTP).toBeDefined();
    expect(API_ENDPOINTS.AUTH.VERIFY_OTP).toBeDefined();
    expect(API_ENDPOINTS.AUTH.LOGIN_OTP).toBeDefined();
    expect(API_ENDPOINTS.AUTH.PROFILE).toBeDefined();
    expect(API_ENDPOINTS.PEST.DETECT).toBeDefined();
    expect(API_ENDPOINTS.DRONE.REQUEST).toBeDefined();
    expect(API_ENDPOINTS.HEALTH).toBeDefined();
  });

  it('No hardcoded 192.168.x.x IPs in production config', () => {
    jest.mock('react-native', () => ({
      Platform: { select: (map: any) => map.android },
    }));

    const config = require('../../config/api');
    const configStr = JSON.stringify(config);

    // Ensure the old Docker/LAN IP is not used
    expect(configStr).not.toMatch(/192\.168\.\d+\.\d+/);
  });
});
