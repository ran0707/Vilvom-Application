import { getItem, setItem } from '../utils/storage';
import { Platform, PermissionsAndroid } from 'react-native';

let PushNotification: any = null;
try {
  PushNotification = require('react-native-push-notification');
} catch (e) {}

let configured = false;
function ensureConfigured() {
  if (configured || !PushNotification) return;
  try {
    PushNotification.configure({
      onRegister: () => {},
      onNotification: () => {},
      popInitialNotification: true,
      requestPermissions: false,
    });
    configured = true;
  } catch (e) {}
}

async function ensureNotificationPermission(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    // POST_NOTIFICATIONS required on Android 13+ (API 33+)
    const perm = (PermissionsAndroid.PERMISSIONS as any).POST_NOTIFICATIONS;
    if (!perm) return; // below Android 13 — no runtime permission needed
    const status = await PermissionsAndroid.check(perm);
    if (!status) {
      await PermissionsAndroid.request(perm, {
        title: 'Notification Permission',
        message: 'Allow Vilvom to send you OTP notifications.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      });
    }
  } catch (e) {}
}

const CHANNEL_ID = 'camellia-default-channel';

const KEYS = {
  WELCOME_SENT:           'notif_welcome_sent',
  MORNING_SCHEDULED_YMD:  'notif_morning_scheduled_ymd',
  WEATHER_ALERT_KEY:      'notif_weather_alert_key',   // "YYYY-MM-DD:type"
  PASSWORD_ALERT_YMD:     'notif_password_alert_ymd',
  PERMISSION_REQUESTED:   'notif_permission_requested',
};

// ─── helpers ──────────────────────────────────────────────────────────────────

const todayYMD = () => new Date().toISOString().slice(0, 10);

function nextNineAM(): Date {
  const d = new Date();
  const nine = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9, 0, 0, 0);
  if (nine <= d) nine.setDate(nine.getDate() + 1);
  return nine;
}

function fireLocal(title: string, message: string) {
  if (!PushNotification) return;
  try {
    PushNotification.localNotification({
      channelId: CHANNEL_ID,
      title,
      message,
      playSound: true,
      soundName: 'default',
      importance: 'default',
      vibrate: false,
    });
  } catch (e) {}
}

// ─── 1. Welcome — fires exactly once ─────────────────────────────────────────

export async function sendWelcomeIfNeeded(name?: string): Promise<void> {
  try {
    const sent = await getItem(KEYS.WELCOME_SENT);
    if (sent) return;

    const displayName = name?.trim() || 'Farmer';
    fireLocal(
      'Welcome to Vilvom! 🌿',
      `Hello ${displayName}! Detect plant diseases early and protect your tea plantation with AI.`,
    );
    await setItem(KEYS.WELCOME_SENT, '1');
  } catch (e) {}
}

// ─── 2. Daily 9 AM — scheduled once per calendar day ─────────────────────────

const PEST_TIPS = [
  'Check for Tea Mosquito Bug damage on tender shoots today.',
  'Inspect leaves for Red Spider Mite — humidity favours outbreaks.',
  'Looper caterpillar season — scan your fields with Vilvom AI.',
  'Watch for Thrips on new flush leaves this morning.',
  'Early detection saves crops — scan a leaf with the AI camera today.',
  'Look for blister blight symptoms after overnight rain.',
];

async function buildSpraySummary(): Promise<string | null> {
  try {
    const settingsRaw = await getItem('spray_reminder_settings');
    if (settingsRaw) {
      const settings = JSON.parse(settingsRaw);
      if (!settings.enabled) return null;
    }
    const logsRaw = await getItem('spray_logs');
    if (!logsRaw) return null;
    const logs: any[] = JSON.parse(logsRaw);
    const today = todayYMD();
    const due = logs.filter(
      l => !l.completed && typeof l.datetime === 'string' && l.datetime.slice(0, 10) === today,
    );
    if (due.length === 0) return null;
    const titles = due.map(l => l.title).join(', ');
    return `${due.length} spray task${due.length > 1 ? 's' : ''} today: ${titles}`;
  } catch (e) {
    return null;
  }
}

export async function scheduleDailyMorningNotification(): Promise<void> {
  if (!PushNotification) return;
  try {
    const today = todayYMD();
    const last = await getItem(KEYS.MORNING_SCHEDULED_YMD);
    if (last === today) return;

    const pestTip = PEST_TIPS[Math.floor(Math.random() * PEST_TIPS.length)];
    const spraySummary = await buildSpraySummary();
    const message = spraySummary
      ? `${pestTip}\n\n🗓️ ${spraySummary}`
      : pestTip;

    PushNotification.localNotificationSchedule({
      channelId: CHANNEL_ID,
      title: '🌿 Morning Field Alert',
      message,
      date: nextNineAM(),
      playSound: true,
      soundName: 'default',
      importance: 'default',
      vibrate: false,
      allowWhileIdle: true,
    });

    await setItem(KEYS.MORNING_SCHEDULED_YMD, today);
  } catch (e) {}
}

// ─── 3. Weather alerts — once per day per alert type ─────────────────────────

type WeatherAlertType = 'rain' | 'storm' | 'highWind' | 'highHumidity';

export interface WeatherSnapshot {
  rain: number;
  precipitation: number;
  weather_code: number;
  wind_speed_10m: number;
  relative_humidity_2m: number;
}

export async function checkAndSendWeatherAlert(w: WeatherSnapshot): Promise<void> {
  try {
    let alertType: WeatherAlertType | null = null;
    let title = '';
    let message = '';

    if (w.rain > 2 || w.precipitation > 2) {
      alertType = 'rain';
      title = '🌧️ Rain Alert — Hold Off Spraying';
      message = 'Rain detected. Avoid pesticide spraying — wait for dry conditions.';
    } else if (w.weather_code >= 80) {
      alertType = 'storm';
      title = '⛈️ Storm Warning';
      message = 'Thunderstorm conditions expected. Keep workers off the field.';
    } else if (w.wind_speed_10m > 20) {
      alertType = 'highWind';
      title = '💨 High Wind Alert';
      message = `Wind ${Math.round(w.wind_speed_10m)} m/s — avoid spraying to prevent chemical drift.`;
    } else if (w.relative_humidity_2m > 90) {
      alertType = 'highHumidity';
      title = '💧 High Humidity — Fungal Risk';
      message = 'Humidity above 90%. Monitor tea leaves closely for fungal disease.';
    }

    if (!alertType) return;

    const dedupKey = `${todayYMD()}:${alertType}`;
    const last = await getItem(KEYS.WEATHER_ALERT_KEY);
    if (last === dedupKey) return;

    fireLocal(title, message);
    await setItem(KEYS.WEATHER_ALERT_KEY, dedupKey);
  } catch (e) {}
}

// ─── 4. Password change alert dedup — once per day ───────────────────────────

export async function canShowPasswordAlert(): Promise<boolean> {
  try {
    const today = todayYMD();
    const last = await getItem(KEYS.PASSWORD_ALERT_YMD);
    if (last === today) return false;
    await setItem(KEYS.PASSWORD_ALERT_YMD, today);
    return true;
  } catch (e) {
    return true;
  }
}

// ─── OTP notification — high-priority heads-up ───────────────────────────────

const OTP_CHANNEL_ID = 'vilvom-otp-channel';

function ensureOtpChannel() {
  if (!PushNotification?.createChannel) return;
  try {
    PushNotification.createChannel(
      {
        channelId: OTP_CHANNEL_ID,
        channelName: 'Vilvom OTP',
        channelDescription: 'One-time password delivery',
        importance: 5, // IMPORTANCE_HIGH — shows as heads-up banner
        vibrate: true,
        playSound: true,
        soundName: 'default',
      },
      () => {},
    );
  } catch (e) {}
}

export async function sendOtpNotification(otp: string, phone: string): Promise<void> {
  if (!PushNotification) return;
  try {
    ensureConfigured();
    await ensureNotificationPermission();
    ensureOtpChannel();
    const spaced = otp.split('').join(' ');
    PushNotification.localNotification({
      channelId: OTP_CHANNEL_ID,
      title: 'Your Vilvom OTP',
      message: `${spaced}   (valid for 5 minutes)`,
      bigText: `Your one-time password for ${phone} is:\n\n${spaced}\n\nValid for 5 minutes. Do not share this code.`,
      playSound: true,
      soundName: 'default',
      importance: 'high',
      priority: 'high',
      vibrate: true,
      vibration: 300,
      ongoing: false,
      autoCancel: true,
    });
  } catch (e) {}
}

// ─── 5. Permission request — once per install ────────────────────────────────

export async function requestPermissionOnce(): Promise<void> {
  try {
    const done = await getItem(KEYS.PERMISSION_REQUESTED);
    if (done) return;

    let NotificationService: any = null;
    try {
      NotificationService = require('./notificationService').default;
    } catch (e) {}
    if (NotificationService?.requestNotificationPermission) {
      await NotificationService.requestNotificationPermission();
    }
    await setItem(KEYS.PERMISSION_REQUESTED, '1');
  } catch (e) {}
}
