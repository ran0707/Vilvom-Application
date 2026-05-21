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
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { initI18n } from './src/i18n';
import React, { useEffect, useState, useCallback } from 'react';
import AppFeedbackModal from './src/components/AppFeedbackModal';
import { shouldShowFeedbackPopup } from './src/services/feedbackApi';

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
        // Initialize i18n first
        await initI18n();

        // Don't request permissions here - wait for app to be fully initialized
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
