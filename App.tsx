/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import {
  StatusBar,
  StyleSheet,
  useColorScheme,
  Platform,
  PermissionsAndroid,
  Alert,
  Linking,
  View,
  Text,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { initI18n } from './src/i18n';
import React, { useEffect, useState } from 'react';

// PermissionManager: do not request permissions on app start/splash.
// Permissions will be requested from `HomeTab` when the user reaches the home screen.
const PermissionManager = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
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
        <PermissionManager>
          <AppNavigator />
        </PermissionManager>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 18,
    color: '#333',
  },
});

export default App;
