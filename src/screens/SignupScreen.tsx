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
import LeafButton from '../components/LeafButton';
import { OtpInput } from 'react-native-otp-entry';
import { useNavigation } from '@react-navigation/native';
import { requestOtp, verifyOtp } from '../services/authApi';
import { useAuth } from '../context/AuthContext';

const SignupScreen = () => {
  const navigation = useNavigation();
  const { login } = useAuth();
  const [name, setName] = useState('');
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
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    if (!phone.trim() || phone.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }
    setLoading(true);
    try {
      await requestOtp(phone.trim());
      setOtpSent(true);
      startCountdown();
      Alert.alert('Success', 'OTP sent to your phone number!');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to send OTP. Please try again.');
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
      // name is sent directly to backend — saved on user creation/update
      const response = await verifyOtp(phone.trim(), otp.trim(), name.trim());
      if (response.token && response.user) {
        login(response.token, response.user);
      }
      const dest = (response as any).isAdmin ? 'AdminPanel' : 'MainTabs';
      Alert.alert('Success', 'Phone verified successfully!', [
        {
          text: 'OK',
          onPress: () => {
            if (dest === 'AdminPanel') {
              (navigation as any).replace('AdminPanel');
            } else {
              Alert.alert(
                'Account Security',
                'Your account is now bound to this device for security.',
                [{ text: 'Understood', onPress: () => (navigation as any).replace('MainTabs') }],
              );
            }
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Header row: back button + logo ────────────────── */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (navigation as any).navigate('GetStarted')}
        >
          <MaterialIcons name="arrow-back" size={26} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.logoWrapper}>
          <Image
            source={require('../../assets/vilvom_logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* ── Scrollable body ───────────────────────────────── */}
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>
          {otpSent ? 'Verify OTP' : 'Sign Up'}
        </Text>
        <Text style={styles.subtitle}>
          {otpSent
            ? 'Enter the 6-digit code sent to your phone'
            : 'Enter your details to get started'}
        </Text>

        {!otpSent ? (
          <>
            {/* Name input */}
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              selectionColor="#4CAF50"
            />

            {/* Phone input */}
            <TextInput
              testID="phone-input"
              style={styles.input}
              placeholder="Phone Number (e.g., +91 9876543210)"
              placeholderTextColor="#999"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              selectionColor="#4CAF50"
            />

            <LeafButton
              label="Send OTP"
              onPress={handleRequestOtp}
              loading={loading}
              disabled={!name.trim() || phone.length < 10}
            />
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
                style: { color: '#333', backgroundColor: '#f6f6f6' },
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

            <LeafButton
              label="Verify & Create Account"
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

        <View style={{ flexDirection: 'row', marginTop: 16 }}>
          <Text style={{ color: '#555' }}>Already have an account? </Text>
          <TouchableOpacity onPress={() => (navigation as any).navigate('Login')}>
            <Text style={{ color: '#4CAF50', fontWeight: '600' }}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },

  /* Header Fixed Layout */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    height: 100, // Explicit bounded height for the header container
    backgroundColor: '#fff',
    position: 'relative',
  },
  logoWrapper: {
    width: 180, // Correct alignment structure box
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    padding: 4,
  },
  headerLogo: {
    width: 180,  // Restored target width configuration
    height: 100, // Restored target height configuration
  },

  /* Body Layout */
  container: {
    flexGrow: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingTop: 16, // Reduced to sit neatly right below the header bounds
    paddingBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 28,
    alignSelf: 'flex-start',
  },
  input: {
    width: '100%',
    backgroundColor: '#f6f6f6',
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#eee',
    color: '#333',
  },
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
  resendButton: { marginTop: 10, marginBottom: 10 },
  resendText: { fontSize: 14, fontWeight: '500' },
});

export default SignupScreen;