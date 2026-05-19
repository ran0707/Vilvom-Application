import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { OtpInput } from 'react-native-otp-entry';
import { useNavigation } from '@react-navigation/native';
import { requestLoginOtp, verifyOtp } from '../services/authApi';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

const LoginScreen = () => {
  const navigation = useNavigation();
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Start countdown for resend OTP
  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleRequestOtp = async () => {
    if (!phone.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    setLoading(true);
    try {
      await requestLoginOtp(phone.trim());
      setOtpSent(true);
      startCountdown();
      Alert.alert('Success', 'OTP sent to your phone number!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      Alert.alert('Error', 'Please enter the OTP');
      return;
    }

    if (otp.length !== 6) {
      Alert.alert('Error', 'OTP must be 6 digits');
      return;
    }

    setLoading(true);
    try {
      const response = await verifyOtp(phone.trim(), otp.trim());

      // Update auth context with user data
      if (response.token && response.user) {
        login(response.token, response.user);
      }

      Alert.alert('Success', 'Logged in successfully', [
        {
          text: 'OK',
          onPress: () => (navigation as any).replace('MainTabs'),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Login failed', err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.topWave}>
        <View style={styles.curveBackground} />
      </View>

      {/* Back button to GetStarted */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => (navigation as any).navigate('GetStarted')}
      >
        <MaterialIcons name="arrow-back" size={22} color="#333" />
      </TouchableOpacity>

      <Text style={styles.title}>Login</Text>
      <Text style={styles.subtitle}>
        {!otpSent
          ? 'Enter your registered phone number'
          : 'Enter the 6-digit code sent to your phone'}
      </Text>

      {/* Input Fields */}
      {!otpSent ? (
        <>
          <TextInput
            testID="phone-input"
            style={styles.input}
            placeholder="Phone Number"
            placeholderTextColor="#999"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          {/* Send OTP Button */}
          <TouchableOpacity
            testID="send-otp-btn"
            style={styles.circleButton}
            onPress={handleRequestOtp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <MaterialIcons name="send" size={28} color="#fff" />
            )}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <OtpInput
            numberOfDigits={6}
            focusColor="#4CAF50"
            focusStickBlinkingDuration={500}
            onTextChange={setOtp}
            textInputProps={{
              accessibilityLabel: 'One-Time Password',
            }}
            theme={{
              containerStyle: styles.otpContainer,
              pinCodeContainerStyle: styles.otpInputContainer,
              pinCodeTextStyle: styles.otpInputText,
              focusStickStyle: styles.otpFocusStick,
              focusedPinCodeContainerStyle: styles.otpFocusedContainer,
            }}
          />

          {/* Verify OTP Button */}
          <TouchableOpacity
            testID="verify-otp-btn"
            style={styles.circleButton}
            onPress={handleVerifyOtp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <MaterialIcons name="check" size={28} color="#fff" />
            )}
          </TouchableOpacity>

          {/* Resend OTP */}
          <TouchableOpacity
            style={styles.resendButton}
            onPress={handleRequestOtp}
            disabled={countdown > 0 || loading}
          >
            <Text
              style={[
                styles.resendText,
                { color: countdown > 0 ? '#999' : '#4CAF50' },
              ]}
            >
              {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
            </Text>
          </TouchableOpacity>
        </>
      )}

      {/* Forgot Password Link - only show when OTP not sent */}
      {!otpSent && (
        <TouchableOpacity
          style={styles.forgotPasswordButton}
          onPress={() => (navigation as any).navigate('ForgotPassword')}
        >
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>
      )}

      <View style={{ flexDirection: 'row', marginTop: 12 }}>
        <Text style={{ color: '#555' }}>Don't have an account? </Text>
        <TouchableOpacity
          onPress={() => (navigation as any).navigate('Signup')}
        >
          <Text style={{ color: '#4CAF50', fontWeight: '600' }}>Sign up</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  topWave: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  curveBackground: {
    height: 160,
    width: width,
    backgroundColor: '#4CAF50',
    borderBottomLeftRadius: width * 0.3,
    borderBottomRightRadius: width * 0.3,
  },
  title: {
    fontSize: 26,
    fontWeight: '600',
    marginTop: 150,
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  input: {
    width: '100%',
    backgroundColor: '#f6f6f6',
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 18,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  circleButton: {
    backgroundColor: '#4CAF50',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 4,
  },
  resendButton: {
    marginTop: 10,
    marginBottom: 10,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '500',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  otpContainer: {
    marginBottom: 20,
    marginTop: 10,
  },
  otpInputContainer: {
    width: 45,
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f6f6f6',
  },
  otpInputText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  otpFocusStick: {
    width: 2,
    height: 25,
    backgroundColor: '#4CAF50',
  },
  otpFocusedContainer: {
    borderColor: '#4CAF50',
    borderWidth: 2,
    backgroundColor: '#fff',
  },
  forgotPasswordButton: {
    marginTop: 15,
    marginBottom: 10,
  },
  forgotPasswordText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default LoginScreen;
