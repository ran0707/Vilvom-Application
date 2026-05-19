/**
 * Component Tests — SignupScreen
 * Buttons are icon-only; located via testID: "send-otp-btn", "verify-otp-btn".
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn(), replace: jest.fn() }),
}));

const mockLogin = jest.fn();
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

jest.mock('react-native-otp-entry', () => ({
  OtpInput: ({ onTextChange }: any) => {
    const { TextInput } = require('react-native');
    return <TextInput testID="otp-input" onChangeText={onTextChange} />;
  },
}));

jest.mock('../../components/LogoHeader', () => 'LogoHeader');
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

const mockRequestOtp = jest.fn();
const mockVerifyOtp = jest.fn();
jest.mock('../../services/authApi', () => ({
  requestOtp: (...args: any[]) => mockRequestOtp(...args),
  verifyOtp: (...args: any[]) => mockVerifyOtp(...args),
}));

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

import SignupScreen from '../../screens/SignupScreen';

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

describe('SignupScreen — rendering', () => {
  it('renders phone input', () => {
    const { getByTestId } = render(<SignupScreen />);
    expect(getByTestId('phone-input')).toBeTruthy();
  });

  it('renders Send OTP button', () => {
    const { getByTestId } = render(<SignupScreen />);
    expect(getByTestId('send-otp-btn')).toBeTruthy();
  });
});

describe('SignupScreen — phone validation', () => {
  it('empty phone → shows error', () => {
    const { getByTestId } = render(<SignupScreen />);
    fireEvent.press(getByTestId('send-otp-btn'));
    expect(Alert.alert).toHaveBeenCalledWith('Error', expect.stringMatching(/phone number/i));
  });

  it('phone under 10 digits → shows validation error', async () => {
    const { getByTestId } = render(<SignupScreen />);
    fireEvent.changeText(getByTestId('phone-input'), '98765');
    fireEvent.press(getByTestId('send-otp-btn'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', expect.stringMatching(/valid/i));
    });
  });
});

describe('SignupScreen — OTP flow', () => {
  it('calls requestOtp with phone on valid input', async () => {
    mockRequestOtp.mockResolvedValue({ message: 'OTP sent' });

    const { getByTestId } = render(<SignupScreen />);
    fireEvent.changeText(getByTestId('phone-input'), '9876543210');
    fireEvent.press(getByTestId('send-otp-btn'));

    await waitFor(() => {
      expect(mockRequestOtp).toHaveBeenCalledWith('9876543210');
    });
  });

  it('shows OTP input after OTP sent', async () => {
    mockRequestOtp.mockResolvedValue({ message: 'OTP sent' });

    const { getByTestId, findByTestId } = render(<SignupScreen />);
    fireEvent.changeText(getByTestId('phone-input'), '9876543210');
    fireEvent.press(getByTestId('send-otp-btn'));

    const otpInput = await findByTestId('otp-input');
    expect(otpInput).toBeTruthy();
  });

  it('empty OTP → shows error on verify', async () => {
    mockRequestOtp.mockResolvedValue({ message: 'OTP sent' });

    const { getByTestId, findByTestId } = render(<SignupScreen />);
    fireEvent.changeText(getByTestId('phone-input'), '9876543210');
    fireEvent.press(getByTestId('send-otp-btn'));

    await findByTestId('otp-input');
    fireEvent.press(getByTestId('verify-otp-btn'));

    expect(Alert.alert).toHaveBeenCalledWith('Error', expect.stringMatching(/otp/i));
  });

  it('5-digit OTP → shows 6 digits required error', async () => {
    mockRequestOtp.mockResolvedValue({ message: 'OTP sent' });

    const { getByTestId, findByTestId } = render(<SignupScreen />);
    fireEvent.changeText(getByTestId('phone-input'), '9876543210');
    fireEvent.press(getByTestId('send-otp-btn'));

    const otpInput = await findByTestId('otp-input');
    fireEvent.changeText(otpInput, '12345');
    fireEvent.press(getByTestId('verify-otp-btn'));

    expect(Alert.alert).toHaveBeenCalledWith('Error', expect.stringMatching(/6/));
  });

  it('correct 6-digit OTP → calls verifyOtp and login', async () => {
    mockRequestOtp.mockResolvedValue({ message: 'OTP sent' });
    mockVerifyOtp.mockResolvedValue({
      token: 'tok',
      user: { _id: 'u1', phoneNumber: '+919876543210' },
    });

    const { getByTestId, findByTestId } = render(<SignupScreen />);
    fireEvent.changeText(getByTestId('phone-input'), '9876543210');
    fireEvent.press(getByTestId('send-otp-btn'));

    const otpInput = await findByTestId('otp-input');
    fireEvent.changeText(otpInput, '123456');
    fireEvent.press(getByTestId('verify-otp-btn'));

    await waitFor(() => {
      expect(mockVerifyOtp).toHaveBeenCalledWith('9876543210', '123456');
      expect(mockLogin).toHaveBeenCalled();
    });
  });
});
