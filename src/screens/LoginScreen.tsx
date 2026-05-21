import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { OtpInput } from 'react-native-otp-entry';
import { useNavigation } from '@react-navigation/native';
import { requestLoginOtp, verifyOtp } from '../services/authApi';
import { useAuth } from '../context/AuthContext';
import LeafButton from '../components/LeafButton';

// ─── Screen ───────────────────────────────────────────────────────────────────
const LoginScreen = () => {
  const navigation = useNavigation();
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); return 0; }
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
      Alert.alert('OTP Sent', 'Enter the 6-digit code sent to your phone');
    } catch (err: any) {
      const msg: string = err?.message ?? '';
      if (
        msg.toLowerCase().includes('not found') ||
        msg.toLowerCase().includes('no user') ||
        msg.toLowerCase().includes('register') ||
        msg.toLowerCase().includes('does not exist')
      ) {
        Alert.alert(
          'No Account Found',
          'No account exists for this number.\nPlease sign up first.',
          [
            { text: 'Sign Up', onPress: () => (navigation as any).navigate('Signup') },
            { text: 'Cancel', style: 'cancel' },
          ],
        );
      } else {
        Alert.alert('Error', msg || 'Failed to send OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim() || otp.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const response = await verifyOtp(phone.trim(), otp.trim());
      if (response.token && response.user) {
        login(response.token, response.user);
      }
      const dest = (response as any).isAdmin ? 'AdminPanel' : 'MainTabs';
      Alert.alert('Success', 'Logged in successfully', [
        { text: 'OK', onPress: () => (navigation as any).replace(dest) },
      ]);
    } catch (err: any) {
      Alert.alert('Login failed', err?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Back */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => (navigation as any).navigate('GetStarted')}
        >
          <MaterialIcons name="arrow-back" size={22} color="#333" />
        </TouchableOpacity>

        {/* Logo */}
        <Image
          source={require('../../assets/vilvom_logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>
          {!otpSent
            ? 'Enter your registered phone number'
            : 'Enter the 6-digit code sent to your phone'}
        </Text>

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

            <LeafButton
              label="Send OTP"
              onPress={handleRequestOtp}
              loading={loading}
              disabled={!phone.trim()}
            />
          </>
        ) : (
          <>
            <OtpInput
              numberOfDigits={6}
              focusColor="#4CAF50"
              focusStickBlinkingDuration={500}
              onTextChange={setOtp}
              textInputProps={{ accessibilityLabel: 'One-Time Password' }}
              theme={{
                containerStyle: styles.otpContainer,
                pinCodeContainerStyle: styles.otpInputContainer,
                pinCodeTextStyle: styles.otpInputText,
                focusStickStyle: styles.otpFocusStick,
                focusedPinCodeContainerStyle: styles.otpFocusedContainer,
              }}
            />

            <LeafButton
              label="Verify OTP"
              onPress={handleVerifyOtp}
              loading={loading}
              disabled={otp.length !== 6}
            />

            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleRequestOtp}
              disabled={countdown > 0 || loading}
            >
              <Text style={[styles.resendText, { color: countdown > 0 ? '#999' : '#4CAF50' }]}>
                {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.signupRow}>
          <Text style={styles.signupRowText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => (navigation as any).navigate('Signup')}>
            <Text style={styles.signupLink}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 16,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 160,
    height: 80,
    marginTop: 60,
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 15,
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

  // ── OTP ──
  otpContainer: { marginBottom: 20, marginTop: 10 },
  otpInputContainer: {
    width: 45,
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f6f6f6',
  },
  otpInputText: { fontSize: 18, fontWeight: '600', color: '#333' },
  otpFocusStick: { width: 2, height: 25, backgroundColor: '#4CAF50' },
  otpFocusedContainer: { borderColor: '#4CAF50', borderWidth: 2, backgroundColor: '#fff' },

  resendButton: { marginTop: 4, marginBottom: 12 },
  resendText: { fontSize: 14, fontWeight: '500' },

  signupRow: { flexDirection: 'row', marginTop: 12 },
  signupRowText: { color: '#555' },
  signupLink: { color: '#4CAF50', fontWeight: '600' },
});

export default LoginScreen;
