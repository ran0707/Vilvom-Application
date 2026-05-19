import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native';
import * as Storage from '../utils/storage';

let PushNotification: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
  PushNotification = require('react-native-push-notification');
} catch (e) {
  PushNotification = null;
}

const CHANNEL_ID = 'camellia-default-channel';

const ensureConfigured = () => {
  if (!PushNotification) return false;
  try {
    console.log('[notificationService] configuring PushNotification');
    PushNotification.configure({
      onRegister: function (token: any) {
        console.log('[notificationService] onRegister', token);
      },
      onNotification: function (notification: any) {
        console.log('[notificationService] onNotification', notification);
      },
      popInitialNotification: true,
      requestPermissions: false,
    });

    if (Platform.OS === 'android' && PushNotification.createChannel) {
      PushNotification.createChannel(
        {
          channelId: CHANNEL_ID,
          channelName: 'Vilvom Notifications',
          channelDescription: 'General notifications',
          importance: 4,
          vibrate: true,
        },
        (created: boolean) => {
          console.log('[notificationService] channel created?', created);
        },
      );
    }
    return true;
  } catch (e) {
    console.warn('[notificationService] configure failed', e);
    return false;
  }
};

export const requestNotificationPermission = async () => {
  try {
    // Try to use react-native-permissions if available for a robust UX
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const RNP = require('react-native-permissions');

    if (RNP && RNP.checkNotifications && RNP.requestNotifications) {
      try {
        const statusObj = await RNP.checkNotifications();
        const current = statusObj?.status;
        // If already granted or limited, accept
        if (current === 'granted' || current === 'limited') return true;

        // Try to request notifications
        const req = await RNP.requestNotifications(['alert', 'sound', 'badge']);
        const newStatus = req?.status;
        if (newStatus === 'granted' || newStatus === 'limited') return true;

        // If blocked, prompt user to open settings
        if (newStatus === 'blocked' || newStatus === 'denied') {
          try {
            Alert.alert(
              'Notifications blocked',
              'Notifications are blocked for Vilvom. To enable them, please update notification permissions in your device settings.',
              [{ text: 'OK', style: 'default' }],
            );
          } catch (e) {
            // ignore
          }
        }
        return false;
      } catch (e) {
        // fallback to platform-specific flows below
        console.warn(
          '[notificationService] react-native-permissions request failed',
          e,
        );
      }
    }
  } catch (e) {
    // react-native-permissions not available - fallback
  }

  if (Platform.OS === 'android') {
    try {
      // Android 13+ needs POST_NOTIFICATIONS
      if (PermissionsAndroid && PermissionsAndroid.request) {
        // Some RN environments expose the constant differently; fall back safely
        const perm = (PermissionsAndroid as any).PERMISSIONS
          ? (PermissionsAndroid as any).PERMISSIONS.POST_NOTIFICATIONS
          : (PermissionsAndroid as any).POST_NOTIFICATIONS;
        if (perm) {
          const granted = await PermissionsAndroid.request(perm as any);
          console.log(
            '[notificationService] POST_NOTIFICATIONS granted:',
            granted,
          );

          if (granted === PermissionsAndroid.RESULTS.GRANTED) return true;

          if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
            try {
              Alert.alert(
                'Notifications blocked',
                'Notifications are blocked for Vilvom. To enable them, please update notification permissions in your device settings.',
                [{ text: 'OK', style: 'default' }],
              );
            } catch (e) {
              // ignore
            }
          }

          return false;
        }
        return true;
      }
      return true;
    } catch (e) {
      return false;
    }
  }
  // iOS: if we couldn't use react-native-permissions, assume PushNotification will ask
  return true;
};

export const sendWelcomeNotification = async (opts: {
  title?: string;
  message?: string;
  largeIconUrl?: string;
}) => {
  const ok = ensureConfigured();
  if (!ok) {
    // library not installed — fallback to an alert so user/dev sees the action
    try {
      // use i18n if available to localize fallback messages
      let title = opts.title || 'Welcome';
      let message = opts.message || 'Welcome to Vilvom';
      try {
        // lazy require to avoid circular imports at startup
        // eslint-disable-next-line global-require
        const i18n = require('../i18n').default;
        title = opts.title || i18n.t('notifications.welcome_title');
        message = opts.message || i18n.t('notifications.welcome_message');
      } catch (e) {
        // ignore - fall back to English literals
      }
      Alert.alert(title, message);
    } catch (e) {
      // swallow
    }
    return;
  }

  // On Android, ensure permission
  if (Platform.OS === 'android') {
    try {
      await requestNotificationPermission();
    } catch (e) {
      // ignore
    }
  }

  try {
    console.log('[notificationService] sending localNotification', opts.title);
    PushNotification.localNotification({
      /* Android Only Properties */
      channelId: CHANNEL_ID,
      largeIconUrl: opts.largeIconUrl,
      // Use a more widely available small icon fallback (app launcher)
      smallIcon: 'ic_launcher',
      /* iOS and Android */
      title: opts.title || 'Welcome to Vilvom',
      message:
        opts.message ||
        'Welcome — happy to have you! Explore plant AI detection now.',
      playSound: true,
      soundName: 'default',
      importance: 'high',
      vibrate: true,
    });
  } catch (e) {
    // final fallback
    try {
      let title = opts.title || 'Welcome';
      let message = opts.message || 'Welcome to Vilvom';
      try {
        const i18n = require('../i18n').default;
        title = opts.title || i18n.t('notifications.welcome_title');
        message = opts.message || i18n.t('notifications.welcome_message');
      } catch (e) {}
      Alert.alert(title, message);
    } catch (err) {
      // ignore
    }
  }
};

export const isAvailable = () => {
  return !!PushNotification;
};

const WELCOME_KEY = 'notification_welcome_sent';

export const markWelcomeSent = async () => {
  try {
    await Storage.setItem(WELCOME_KEY, '1');
  } catch (e) {
    // ignore
  }
};

export const hasWelcomeBeenSent = async (): Promise<boolean> => {
  try {
    const v = await Storage.getItem(WELCOME_KEY);
    return !!v;
  } catch (e) {
    return false;
  }
};

export default {
  sendWelcomeNotification,
  requestNotificationPermission,
  isAvailable,
  markWelcomeSent,
  hasWelcomeBeenSent,
};
