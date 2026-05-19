import { Alert } from 'react-native';
import { getItem, setItem } from '../utils/storage';
import NotificationService from './notificationService';

export interface SprayLog {
  id: string;
  title: string;
  datetime: string; // ISO string
  notes?: string;
  reminderSent?: boolean;
  completed?: boolean;
}

export interface SprayLogNotification {
  id: string;
  sprayLogId: string;
  type: 'reminder' | 'overdue' | 'upcoming';
  scheduledTime: string;
  title: string;
  message: string;
  sent: boolean;
}

const STORAGE_KEY = 'spray_logs';
const NOTIFICATIONS_KEY = 'spray_log_notifications';
const REMINDER_SETTINGS_KEY = 'spray_reminder_settings';

export interface ReminderSettings {
  enabled: boolean;
  hoursBeforeReminder: number; // Hours before the scheduled spray
  overdueReminderHours: number; // Hours after scheduled time to send overdue reminder
  dailyReminderTime: string; // HH:MM format for daily summary
}

const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: true,
  hoursBeforeReminder: 2, // Remind 2 hours before
  overdueReminderHours: 4, // Remind 4 hours after if not completed
  dailyReminderTime: '08:00', // 8 AM daily summary
};

class SprayLogNotificationService {
  constructor() {
    // NotificationService is an object, not a class
  }

  /**
   * Get reminder settings
   */
  async getReminderSettings(): Promise<ReminderSettings> {
    try {
      const settings = await getItem(REMINDER_SETTINGS_KEY);
      return settings ? JSON.parse(settings) : DEFAULT_REMINDER_SETTINGS;
    } catch (error) {
      console.error('Error getting reminder settings:', error);
      return DEFAULT_REMINDER_SETTINGS;
    }
  }

  /**
   * Update reminder settings
   */
  async updateReminderSettings(settings: ReminderSettings): Promise<void> {
    try {
      await setItem(REMINDER_SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error updating reminder settings:', error);
    }
  }

  /**
   * Get all spray logs
   */
  async getSprayLogs(): Promise<SprayLog[]> {
    try {
      const raw = await getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      console.error('Error getting spray logs:', error);
      return [];
    }
  }

  /**
   * Save spray logs
   */
  async saveSprayLogs(logs: SprayLog[]): Promise<void> {
    try {
      await setItem(STORAGE_KEY, JSON.stringify(logs));
    } catch (error) {
      console.error('Error saving spray logs:', error);
    }
  }

  /**
   * Get pending notifications
   */
  async getPendingNotifications(): Promise<SprayLogNotification[]> {
    try {
      const raw = await getItem(NOTIFICATIONS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  /**
   * Save notifications
   */
  async saveNotifications(
    notifications: SprayLogNotification[],
  ): Promise<void> {
    try {
      await setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }

  /**
   * Schedule reminders for a spray log
   */
  async scheduleReminders(sprayLog: SprayLog): Promise<void> {
    const settings = await this.getReminderSettings();
    if (!settings.enabled) return;

    const sprayTime = new Date(sprayLog.datetime);
    const now = new Date();

    const notifications: SprayLogNotification[] = [];

    // Schedule reminder before spray time
    const reminderTime = new Date(
      sprayTime.getTime() - settings.hoursBeforeReminder * 60 * 60 * 1000,
    );
    if (reminderTime > now) {
      notifications.push({
        id: `reminder_${sprayLog.id}_${Date.now()}`,
        sprayLogId: sprayLog.id,
        type: 'reminder',
        scheduledTime: reminderTime.toISOString(),
        title: 'Spray Reminder',
        message: `You have a spray log "${sprayLog.title}" scheduled in ${settings.hoursBeforeReminder} hours`,
        sent: false,
      });
    }

    // Schedule overdue reminder
    const overdueTime = new Date(
      sprayTime.getTime() + settings.overdueReminderHours * 60 * 60 * 1000,
    );
    notifications.push({
      id: `overdue_${sprayLog.id}_${Date.now()}`,
      sprayLogId: sprayLog.id,
      type: 'overdue',
      scheduledTime: overdueTime.toISOString(),
      title: 'Overdue Spray Reminder',
      message: `Reminder: Your spray log "${sprayLog.title}" is ${settings.overdueReminderHours} hours overdue`,
      sent: false,
    });

    // Save notifications
    const existingNotifications = await this.getPendingNotifications();
    const allNotifications = [...existingNotifications, ...notifications];
    await this.saveNotifications(allNotifications);

    console.log(
      `📅 Scheduled ${notifications.length} reminders for spray log: ${sprayLog.title}`,
    );
  }

  /**
   * Check and send due notifications
   */
  async checkAndSendNotifications(): Promise<void> {
    const notifications = await this.getPendingNotifications();
    const now = new Date();
    const dueNotifications = notifications.filter(
      notification =>
        !notification.sent && new Date(notification.scheduledTime) <= now,
    );

    for (const notification of dueNotifications) {
      await this.sendNotification(notification);
    }

    // Update sent status
    const updatedNotifications = notifications.map(notification => {
      const isDue = dueNotifications.find(due => due.id === notification.id);
      return isDue ? { ...notification, sent: true } : notification;
    });

    await this.saveNotifications(updatedNotifications);
  }

  /**
   * Send notification
   */
  private async sendNotification(
    notification: SprayLogNotification,
  ): Promise<void> {
    try {
      // Send push notification using the imported NotificationService
      await NotificationService.sendWelcomeNotification({
        title: notification.title,
        message: notification.message,
      });

      // Also show alert if app is active
      Alert.alert(notification.title, notification.message, [
        { text: 'Dismiss', style: 'cancel' },
        { text: 'View Spray Logs', onPress: () => this.navigateToSprayLogs() },
      ]);

      console.log(
        `📲 Sent notification: ${notification.title} - ${notification.message}`,
      );
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  /**
   * Navigate to spray logs (this would need navigation context)
   */
  private navigateToSprayLogs(): void {
    console.log('📱 Navigate to spray logs screen');
    // Implementation would depend on navigation setup
  }

  /**
   * Get today's spray logs
   */
  async getTodaysSprayLogs(): Promise<SprayLog[]> {
    const logs = await this.getSprayLogs();
    const today = new Date().toISOString().slice(0, 10);

    return logs.filter(log => log.datetime.slice(0, 10) === today);
  }

  /**
   * Get yesterday's spray logs
   */
  async getYesterdaysSprayLogs(): Promise<SprayLog[]> {
    const logs = await this.getSprayLogs();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    return logs.filter(log => log.datetime.slice(0, 10) === yesterdayStr);
  }

  /**
   * Get upcoming spray logs (next 7 days)
   */
  async getUpcomingSprayLogs(): Promise<SprayLog[]> {
    const logs = await this.getSprayLogs();
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    return logs.filter(log => {
      const logDate = new Date(log.datetime);
      return logDate > now && logDate <= nextWeek;
    });
  }

  /**
   * Send daily summary notification
   */
  async sendDailySummary(): Promise<void> {
    const settings = await this.getReminderSettings();
    if (!settings.enabled) return;

    const todaysLogs = await this.getTodaysSprayLogs();
    const yesterdaysLogs = await this.getYesterdaysSprayLogs();
    const upcomingLogs = await this.getUpcomingSprayLogs();

    let summaryMessage = '';

    // Yesterday's reminder
    if (yesterdaysLogs.length > 0) {
      const logTitles = yesterdaysLogs
        .map((log: SprayLog) => log.title)
        .join(', ');
      summaryMessage += `Yesterday's logs: ${logTitles}. `;
    }

    // Today's tasks
    if (todaysLogs.length > 0) {
      const logTitles = todaysLogs.map((log: SprayLog) => log.title).join(', ');
      summaryMessage += `Today's scheduled: ${logTitles}. `;
    }

    // Upcoming tasks
    if (upcomingLogs.length > 0) {
      summaryMessage += `${upcomingLogs.length} upcoming tasks this week.`;
    }

    if (summaryMessage) {
      await NotificationService.sendWelcomeNotification({
        title: 'Daily Spray Log Summary',
        message: summaryMessage.trim(),
      });
    }
  }

  /**
   * Mark spray log as completed
   */
  async markSprayLogCompleted(sprayLogId: string): Promise<void> {
    const logs = await this.getSprayLogs();
    const updatedLogs = logs.map(log =>
      log.id === sprayLogId ? { ...log, completed: true } : log,
    );
    await this.saveSprayLogs(updatedLogs);

    // Cancel overdue notifications for completed log
    const notifications = await this.getPendingNotifications();
    const filteredNotifications = notifications.filter(
      notification =>
        !(
          notification.sprayLogId === sprayLogId &&
          notification.type === 'overdue'
        ),
    );
    await this.saveNotifications(filteredNotifications);
  }

  /**
   * Start periodic notification checking
   */
  startNotificationScheduler(): void {
    // Check for due notifications every 5 minutes
    setInterval(() => {
      this.checkAndSendNotifications();
    }, 5 * 60 * 1000);

    // Check for daily summary at specified time
    setInterval(() => {
      this.checkDailySummaryTime();
    }, 60 * 1000); // Check every minute

    console.log('📅 Spray log notification scheduler started');
  }

  /**
   * Check if it's time for daily summary
   */
  private async checkDailySummaryTime(): Promise<void> {
    const settings = await this.getReminderSettings();
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;

    if (currentTime === settings.dailyReminderTime) {
      await this.sendDailySummary();
    }
  }
}

// Export singleton instance
export const sprayLogNotificationService = new SprayLogNotificationService();

export default SprayLogNotificationService;
