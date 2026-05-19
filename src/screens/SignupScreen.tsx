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
import { requestOtp, verifyOtp } from '../services/authApi';
import { useAuth } from '../context/AuthContext';
import LogoHeader from '../components/LogoHeader';

const { width } = Dimensions.get('window');

const SignupScreen = () => {
  const navigation = useNavigation();
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Countdown for resend OTP
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
    if (phone.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }
    setLoading(true);
    try {
      await requestOtp(phone.trim());
      setOtpSent(true);
      startCountdown();
      Alert.alert('Success', 'OTP sent to your phone number!');
    } catch (error) {
      Alert.alert(
        'Error',
        error.message || 'Failed to send OTP. Please try again.'
      );
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
      if (response.token && response.user) {
        login(response.token, response.user);
      }
      Alert.alert('Success', 'Phone verified successfully!', [
        {
          text: 'OK',
          onPress: () => {
            // Device binding notification
            Alert.alert(
              'Account Security',
              'Your account is now bound to this device for security. You can only access your account from this phone.',
              [
                {
                  text: 'Understood',
                  onPress: () => (navigation).replace('MainTabs'),
                },
              ]
            );
          },
        },
      ]);
    } catch (error) {
      Alert.alert(
        'Error',
        error.message || 'OTP verification failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* Top Curved Background */}
      <View style={[styles.topWave, { alignItems: 'center', justifyContent: 'center' }]}>
        <View
          style={[
            styles.curveBackground,
            {
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            },
          ]}
        >
          <LogoHeader logoSize={{ width: 110, height: 110 }} marginTop={25} position="top-center" />
        </View>
      </View>
      {/* Back button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => (navigation).navigate('GetStarted')}
      >
        <MaterialIcons name="arrow-back" size={22} color="#333" />
      </TouchableOpacity>
      {/* Title */}
      <Text style={styles.title}>Sign Up</Text>
      <Text style={styles.subtitle}>
        {!otpSent
          ? 'Enter your phone number to get started'
          : 'Enter the 6-digit code sent to your phone'}
      </Text>
      {/* Input Fields */}
      {!otpSent ? (
        <>
          <TextInput
            testID="phone-input"
            style={styles.input}
            placeholder="Phone Number (e.g., +1234567890)"
            placeholderTextColor="#999"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            selectionColor="#4CAF50"
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
              selectionColor: '#4CAF50',
              style: {
                color: '#333', // explicit text color for each OTP input
                backgroundColor: '#f6f6f6',
              },
              placeholderTextColor: '#999',
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
      <View style={{ flexDirection: 'row', marginTop: 12 }}>
        <Text style={{ color: '#555' }}>Already have an account? </Text>
        <TouchableOpacity onPress={() => (navigation).navigate('Login')}>
          <Text style={{ color: '#4CAF50', fontWeight: '600' }}>Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    backgroundColor: '#fff', // forces light background
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
    marginBottom: 30,
    color: '#333',
  },
  input: {
    width: '100%',
    backgroundColor: '#f6f6f6', // light bg
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 18,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#eee',
    color: '#333', // force input text to dark
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
  orText: {
    marginTop: 10,
    marginBottom: 10,
    color: '#555',
    fontSize: 14,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 5,
  },
  socialButton: {
    width: 45,
    height: 45,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
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
    backgroundColor: '#f6f6f6', // force light bg
  },
  otpInputText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333', // force dark text
  },
  otpFocusStick: {
    width: 2,
    height: 25,
    backgroundColor: '#4CAF50',
  },
  otpFocusedContainer: {
    borderColor: '#4CAF50',
    borderWidth: 2,
    backgroundColor: '#fff', // force white on focus
  },
  resendButton: {
    marginTop: 10,
    marginBottom: 10,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default SignupScreen;
