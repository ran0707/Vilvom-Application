/**
 * Component Tests — CameraScreen
 *
 * Flow: button press → permission grant → launchCamera/Gallery callback
 *       → handleImageSelected → detectPest → navigate to PestQuestionnaire
 *
 * Buttons use text labels: "Scan with Camera" / "Upload from Gallery"
 * Detection is automatic on image selection (no separate detect button).
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, PermissionsAndroid } from 'react-native';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
  useRoute: () => ({ params: {} }),
  useIsFocused: () => true,
}));

jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
}));
jest.mock('../../components/LogoHeader', () => 'LogoHeader');

// Mock image picker — set up per-test via mockLaunchCamera / mockLaunchImageLibrary
const mockLaunchCamera = jest.fn();
const mockLaunchImageLibrary = jest.fn();
jest.mock('react-native-image-picker', () => ({
  launchCamera: (...args: any[]) => mockLaunchCamera(...args),
  launchImageLibrary: (...args: any[]) => mockLaunchImageLibrary(...args),
}));

const mockDetectPest = jest.fn();
jest.mock('../../services/pestDetectionApi', () => ({
  detectPest: (...args: any[]) => mockDetectPest(...args),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue('tok'),
  setItem: jest.fn(),
}));

jest.mock('../../config/api', () => ({
  AI_HOST: 'http://10.0.2.2:8000',
  API_BASE_URL: 'http://10.0.2.2:5000/api',
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});

  // Grant Android permissions by default
  jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue(
    PermissionsAndroid.RESULTS.GRANTED,
  );
});

import CameraScreen from '../../screens/CameraScreen';

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('CameraScreen — rendering', () => {
  it('renders camera and gallery option buttons', () => {
    const { getByText } = render(<CameraScreen />);
    expect(getByText('Scan with Camera')).toBeTruthy();
    expect(getByText('Upload from Gallery')).toBeTruthy();
  });
});

// ─── Camera button ────────────────────────────────────────────────────────────

describe('CameraScreen — camera button', () => {
  it('calls launchCamera after pressing Scan with Camera', async () => {
    mockLaunchCamera.mockImplementation((opts: any, cb: any) => {
      cb({ assets: [{ uri: 'file://test.jpg', type: 'image/jpeg' }] });
    });
    mockDetectPest.mockResolvedValue({ prediction: 'Healthy', confidence: 0.9 });

    const { getByText } = render(<CameraScreen />);
    fireEvent.press(getByText('Scan with Camera'));

    await waitFor(() => {
      expect(mockLaunchCamera).toHaveBeenCalled();
    });
  });

  it('auto-calls detectPest after camera image selected', async () => {
    mockLaunchCamera.mockImplementation((opts: any, cb: any) => {
      cb({ assets: [{ uri: 'file://test.jpg', type: 'image/jpeg' }] });
    });
    mockDetectPest.mockResolvedValue({
      prediction: 'Looper_Mild',
      confidence: 0.92,
      symptoms: [],
      biological_control: [],
      chemical_control: [],
      mechanical_control: [],
    });

    const { getByText } = render(<CameraScreen />);
    fireEvent.press(getByText('Scan with Camera'));

    await waitFor(() => {
      expect(mockDetectPest).toHaveBeenCalledWith('file://test.jpg');
    });
  });

  it('navigates to PestQuestionnaire after successful detection', async () => {
    const mockResult = {
      prediction: 'Thrips_Severe',
      confidence: 0.88,
      symptoms: [],
      biological_control: [],
      chemical_control: [],
      mechanical_control: [],
    };
    mockLaunchCamera.mockImplementation((opts: any, cb: any) => {
      cb({ assets: [{ uri: 'file://test.jpg' }] });
    });
    mockDetectPest.mockResolvedValue(mockResult);

    const { getByText } = render(<CameraScreen />);
    fireEvent.press(getByText('Scan with Camera'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        'PestQuestionnaire',
        expect.objectContaining({ result: mockResult }),
      );
    }, { timeout: 5000 });
  });

  it('shows error alert on detectPest failure', async () => {
    mockLaunchCamera.mockImplementation((opts: any, cb: any) => {
      cb({ assets: [{ uri: 'file://test.jpg' }] });
    });
    mockDetectPest.mockRejectedValue(new Error('AI service unavailable'));

    const { getByText } = render(<CameraScreen />);
    fireEvent.press(getByText('Scan with Camera'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalled();
    }, { timeout: 5000 });
  });

  it('does not call detectPest when user cancels camera', async () => {
    mockLaunchCamera.mockImplementation((opts: any, cb: any) => {
      cb({ didCancel: true });
    });

    const { getByText } = render(<CameraScreen />);
    fireEvent.press(getByText('Scan with Camera'));

    await waitFor(() => {
      expect(mockLaunchCamera).toHaveBeenCalled();
    });
    expect(mockDetectPest).not.toHaveBeenCalled();
  });
});

// ─── Gallery button ───────────────────────────────────────────────────────────

describe('CameraScreen — gallery button', () => {
  it('calls launchImageLibrary after pressing Upload from Gallery', async () => {
    mockLaunchImageLibrary.mockImplementation((opts: any, cb: any) => {
      cb({ assets: [{ uri: 'file://gallery.jpg', type: 'image/jpeg' }] });
    });
    mockDetectPest.mockResolvedValue({ prediction: 'Healthy', confidence: 0.9 });

    const { getByText } = render(<CameraScreen />);
    fireEvent.press(getByText('Upload from Gallery'));

    await waitFor(() => {
      expect(mockLaunchImageLibrary).toHaveBeenCalled();
    });
  });

  it('auto-calls detectPest after gallery image selected', async () => {
    mockLaunchImageLibrary.mockImplementation((opts: any, cb: any) => {
      cb({ assets: [{ uri: 'file://gallery.jpg', type: 'image/jpeg' }] });
    });
    mockDetectPest.mockResolvedValue({ prediction: 'RSC_Mild', confidence: 0.85 });

    const { getByText } = render(<CameraScreen />);
    fireEvent.press(getByText('Upload from Gallery'));

    await waitFor(() => {
      expect(mockDetectPest).toHaveBeenCalledWith('file://gallery.jpg');
    });
  });
});
