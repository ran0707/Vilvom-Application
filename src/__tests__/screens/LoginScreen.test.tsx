/**
 * Component Tests — LoginScreen
 * Tests phone input, OTP flow, validation alerts, loading states
 *
 * Note: LoginScreen uses icon-only buttons (no text labels).
 * Buttons are located via testID: "send-otp-btn", "verify-otp-btn".
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn(), replace: jest.fn() }),
}));

// Mock auth context
const mockLogin = jest.fn();
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin, isAuthenticated: false }),
}));

// Mock OTP input component
jest.mock('react-native-otp-entry', () => ({
  OtpInput: ({ onTextChange }: { onTextChange: (t: string) => void }) => {
    const { TextInput } = require('react-native');
    return (
      <TextInput
        testID="otp-input"
        onChangeText={onTextChange}
        keyboardType="numeric"
        maxLength={6}
      />
    );
  },
}));

// Mock vector icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

// Mock auth API
const mockRequestLoginOtp = jest.fn();
const mockVerifyOtp = jest.fn();
jest.mock('../../services/authApi', () => ({
  requestLoginOtp: (...args: any[]) => mockRequestLoginOtp(...args),
  verifyOtp: (...args: any[]) => mockVerifyOtp(...args),
}));

import LoginScreen from '../../screens/LoginScreen';

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

afterEach(() => {
  (Alert.alert as jest.Mock).mockRestore?.();
});

describe('LoginScreen — rendering', () => {
  it('renders phone input and send OTP button', () => {
    const { getByTestId, getByText } = render(<LoginScreen />);

    expect(getByTestId('phone-input')).toBeTruthy();
    expect(getByTestId('send-otp-btn')).toBeTruthy();
    expect(getByText(/login/i)).toBeTruthy();
  });

  it('does not render OTP input before OTP is sent', () => {
    const { queryByTestId } = render(<LoginScreen />);

    expect(queryByTestId('otp-input')).toBeNull();
  });
});

describe('LoginScreen — phone validation', () => {
  it('shows error alert when phone is empty and Send OTP pressed', async () => {
    const { getByTestId } = render(<LoginScreen />);

    fireEvent.press(getByTestId('send-otp-btn'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Error',
      expect.stringMatching(/phone number/i),
    );
  });

  it('does not call requestLoginOtp when phone is empty', () => {
    const { getByTestId } = render(<LoginScreen />);

    fireEvent.press(getByTestId('send-otp-btn'));

    expect(mockRequestLoginOtp).not.toHaveBeenCalled();
  });
});

describe('LoginScreen — OTP request flow', () => {
  it('calls requestLoginOtp with trimmed phone on valid input', async () => {
    mockRequestLoginOtp.mockResolvedValue({ message: 'OTP sent', phone: '+919876543210' });

    const { getByTestId } = render(<LoginScreen />);

    fireEvent.changeText(getByTestId('phone-input'), '9876543210');
    fireEvent.press(getByTestId('send-otp-btn'));

    await waitFor(() => {
      expect(mockRequestLoginOtp).toHaveBeenCalledWith('9876543210');
    });
  });

  it('shows success alert after OTP sent', async () => {
    mockRequestLoginOtp.mockResolvedValue({ message: 'OTP sent' });

    const { getByTestId } = render(<LoginScreen />);

    fireEvent.changeText(getByTestId('phone-input'), '9876543210');
    fireEvent.press(getByTestId('send-otp-btn'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Success',
        expect.stringMatching(/otp sent/i),
      );
    });
  });

  it('shows OTP input after successful OTP request', async () => {
    mockRequestLoginOtp.mockResolvedValue({ message: 'OTP sent' });

    const { getByTestId, findByTestId } = render(<LoginScreen />);

    fireEvent.changeText(getByTestId('phone-input'), '9876543210');
    fireEvent.press(getByTestId('send-otp-btn'));

    const otpInput = await findByTestId('otp-input');
    expect(otpInput).toBeTruthy();
  });

  it('shows error alert when requestLoginOtp fails', async () => {
    mockRequestLoginOtp.mockRejectedValue(new Error('User not found'));

    const { getByTestId } = render(<LoginScreen />);

    fireEvent.changeText(getByTestId('phone-input'), '9999999999');
    fireEvent.press(getByTestId('send-otp-btn'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        expect.stringMatching(/user not found/i),
      );
    });
  });

  it('shows error alert on network failure', async () => {
    mockRequestLoginOtp.mockRejectedValue(
      new TypeError('Network request failed: cannot reach http://10.0.2.2:5000/api'),
    );

    const { getByTestId } = render(<LoginScreen />);

    fireEvent.changeText(getByTestId('phone-input'), '9876543210');
    fireEvent.press(getByTestId('send-otp-btn'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', expect.any(String));
    });
  });
});

describe('LoginScreen — OTP verification flow', () => {
  async function setupWithOtpSent() {
    mockRequestLoginOtp.mockResolvedValue({ message: 'OTP sent' });

    const rendered = render(<LoginScreen />);

    fireEvent.changeText(rendered.getByTestId('phone-input'), '9876543210');
    fireEvent.press(rendered.getByTestId('send-otp-btn'));

    await rendered.findByTestId('otp-input'); // wait for OTP input to appear
    return rendered;
  }

  it('shows error when OTP is empty', async () => {
    const { getByTestId } = await setupWithOtpSent();

    fireEvent.press(getByTestId('verify-otp-btn'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Error',
      expect.stringMatching(/otp/i),
    );
  });

  it('shows error when OTP is not 6 digits', async () => {
    const { getByTestId } = await setupWithOtpSent();

    fireEvent.changeText(getByTestId('otp-input'), '123');
    fireEvent.press(getByTestId('verify-otp-btn'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Error',
      expect.stringMatching(/6 digit/i),
    );
  });

  it('calls verifyOtp with phone and 6-digit OTP', async () => {
    mockVerifyOtp.mockResolvedValue({
      token: 'jwt.token',
      user: { _id: 'u1', phoneNumber: '+919876543210' },
    });

    const { getByTestId } = await setupWithOtpSent();

    fireEvent.changeText(getByTestId('otp-input'), '123456');
    fireEvent.press(getByTestId('verify-otp-btn'));

    await waitFor(() => {
      expect(mockVerifyOtp).toHaveBeenCalledWith('9876543210', '123456');
    });
  });

  it('calls login context after successful verification', async () => {
    const mockUser = { _id: 'u1', phoneNumber: '+919876543210' };
    mockVerifyOtp.mockResolvedValue({ token: 'jwt.tok', user: mockUser });

    const { getByTestId } = await setupWithOtpSent();

    fireEvent.changeText(getByTestId('otp-input'), '123456');
    fireEvent.press(getByTestId('verify-otp-btn'));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('jwt.tok', mockUser);
    });
  });

  it('shows error on wrong OTP (401)', async () => {
    mockVerifyOtp.mockRejectedValue(new Error('Invalid or expired OTP'));

    const { getByTestId } = await setupWithOtpSent();

    fireEvent.changeText(getByTestId('otp-input'), '000000');
    fireEvent.press(getByTestId('verify-otp-btn'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        expect.stringMatching(/login failed|error/i),
        expect.stringMatching(/invalid|expired/i),
      );
    });
  });
});
