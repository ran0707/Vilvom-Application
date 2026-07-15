/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import {
  StatusBar,
  useColorScheme,
  BackHandler,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { initI18n } from './src/i18n';
import React, { useEffect, useState, useCallback } from 'react';
import AppFeedbackModal from './src/components/AppFeedbackModal';
import { shouldShowFeedbackPopup } from './src/services/feedbackApi';
// @ts-ignore: no declaration file for react-native-push-notification
import PushNotification from 'react-native-push-notification';

// Inner shell that has access to AuthContext for the feedback modal
const AppShell = () => {
  const { user } = useAuth();
  const [feedbackVisible, setFeedbackVisible] = useState(false);

  const tryShowFeedback = useCallback(async (): Promise<boolean> => {
    const show = await shouldShowFeedbackPopup();
    if (show) {
      setFeedbackVisible(true);
      return true; // intercept back press — let user decide in modal
    }
    return false; // allow normal back/exit
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      // Only intercept at the root level — navigation handles inner screens first.
      // If the feedback modal is already visible, let it handle its own close.
      if (feedbackVisible) return true;
      // tryShowFeedback is async; we trigger it but return false so the event
      // bubbles normally (navigation pop etc). If we do show the modal the
      // next back press will hit the modal's onRequestClose instead.
      tryShowFeedback();
      return false;
    });
    return () => sub.remove();
  }, [feedbackVisible, tryShowFeedback]);

  return (
    <>
      <AppNavigator />
      <AppFeedbackModal
        visible={feedbackVisible}
        userName={user?.name ?? user?.profileInfo?.fullName ?? ''}
        userLocation={user?.profileInfo?.address ?? ''}
        onDone={() => setFeedbackVisible(false)}
      />
    </>
  );
};

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // 1. Initialize i18n first
        await initI18n();

        // 2. Request Android 13+ Notification Permissions safely here
        if (Platform.OS === 'android' && Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          );
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            console.log('Notification permission granted');
          } else {
            console.log('Notification permission denied');
          }
        }

        // 3. Initialize the Local Notification Channel
        if (Platform.OS === 'android') {
          PushNotification.createChannel(
            {
              channelId: "default-channel-id", // Use this string when triggering your local notifications
              channelName: "Default Channel",
              channelDescription: "Local App Notifications",
              importance: 4, // High priority notification
              vibrate: true,
            },
            (created: boolean) => console.log(`Notification channel created: ${created}`)
          );
        }

        console.log('App initialized successfully');
      } catch (e) {
        console.warn('App initialization error:', e);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;