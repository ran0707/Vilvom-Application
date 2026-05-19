/**
 * Unit Tests — pestApi & pestDetectionApi services
 */

global.fetch = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue('mock.jwt.token'),
  setItem: jest.fn(),
  multiRemove: jest.fn(),
}));

jest.mock('../../config/api', () => ({
  API_BASE_URL: 'http://localhost:5000/api',
  AI_HOST: 'http://localhost:8000',
}));

import {
  createPestDetection,
  listPestDetections,
  getPestDetection,
  listRecommendations,
  getNearbyRecommendations,
} from '../../services/pestApi';

const mockFetch = global.fetch as jest.Mock;

function mockResponse(data: any, status = 200, ok = true) {
  mockFetch.mockResolvedValueOnce({
    ok,
    status,
    json: jest.fn().mockResolvedValue(data),
    text: jest.fn().mockResolvedValue(JSON.stringify(data)),
  });
}

beforeEach(() => jest.clearAllMocks());

describe('pestApi — createPestDetection()', () => {
  it('posts detection payload and returns result', async () => {
    const mockDetection = { _id: 'det1', pestName: 'Looper_Mild', confidence: 0.91 };
    mockResponse({ success: true, detection: mockDetection });

    const result = await createPestDetection({ pestName: 'Looper_Mild', guestId: 'guest1' });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/pest/detect'),
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result).toBeDefined();
  });

  it('handles 401 unauthorized', async () => {
    mockResponse({ message: 'Unauthorized' }, 401, false);

    await expect(createPestDetection({ pestName: 'test' })).rejects.toThrow();
  });
});

describe('pestApi — listPestDetections()', () => {
  it('calls GET /pest/detections with auth header', async () => {
    mockResponse({ detections: [], pagination: { page: 1, limit: 10, total: 0 } });

    await listPestDetections();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/pest/detections'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer mock.jwt.token' }),
      }),
    );
  });

  it('returns detections array', async () => {
    const detections = [{ _id: '1', pestName: 'Thrips_Severe' }];
    mockResponse({ detections, pagination: {} });

    const result = await listPestDetections();

    expect(result).toBeDefined();
  });
});

describe('pestApi — getPestDetection()', () => {
  it('calls GET /pest/detections/:id', async () => {
    mockResponse({ detection: { _id: 'abc', pestName: 'RSC_Mild' } });

    await getPestDetection('abc');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/pest/detections/abc'),
      expect.anything(),
    );
  });

  it('throws on 404', async () => {
    mockResponse({ message: 'Not found' }, 404, false);

    await expect(getPestDetection('nonexistent')).rejects.toThrow();
  });
});

describe('pestApi — listRecommendations()', () => {
  it('calls GET /pest/recommendations without auth', async () => {
    mockResponse({ recommendations: [{ title: 'General IPM' }] });

    const result = await listRecommendations();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/pest/recommendations'),
      expect.anything(),
    );
    expect(result).toBeDefined();
  });
});

describe('pestApi — getNearbyRecommendations()', () => {
  it('calls GET /pest/nearby with lat, lng, radius', async () => {
    mockResponse({ nearbyDetections: [] });

    await getNearbyRecommendations(11.016, 76.955, 10);

    const url: string = (mockFetch.mock.calls[0][0] as string);
    expect(url).toContain('lat=11.016');
    expect(url).toContain('lng=76.955');
    expect(url).toContain('radius=10');
  });
});
