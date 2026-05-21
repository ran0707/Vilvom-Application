import { Alert } from 'react-native';
import { getPasswordStatus } from './authApi';
import { canShowPasswordAlert } from './appNotificationService';

export interface PasswordStatusMonitor {
  checkPasswordStatus: () => Promise<void>;
  schedulePasswordCheck: () => void;
}

class PasswordStatusMonitorService implements PasswordStatusMonitor {
  private isChecking = false;
  private checkInterval: number | null = null;

  /**
   * Check if user needs to change password based on monthly requirement
   */
  async checkPasswordStatus(): Promise<void> {
    if (this.isChecking) return;

    this.isChecking = true;

    try {
      // Import here to avoid circular dependencies
      const { isAuthenticated } = await import('./authApi');
      
      // Only check password status if user is authenticated
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        console.log('Skipping password status check - user not authenticated');
        return;
      }

      const status = await getPasswordStatus();

      if (status.passwordChangeRequired) {
        await this.showPasswordChangeRequired(status.daysSinceLastChange);
      } else if (status.daysSinceLastChange >= 25) {
        // Warn user 5 days before requirement
        await this.showPasswordChangeWarning(30 - status.daysSinceLastChange);
      }
    } catch (error) {
      console.error('Password status check failed:', error);
      // Don't show error to user for background checks
      // If it's an authentication error, user is likely not logged in
      if (error && (error as any).message?.includes('token') || (error as any).message?.includes('Unauthorized')) {
        console.log('Password status check skipped - authentication required');
        return;
      }
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Schedule periodic password status checks
   */
  schedulePasswordCheck(): void {
    // Clear any existing interval
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Check every hour when app is active
    this.checkInterval = setInterval(() => {
      this.checkPasswordStatus();
    }, 60 * 60 * 1000) as any; // 1 hour

    // Also check immediately
    this.checkPasswordStatus();
  }

  /**
   * Stop scheduled password checks
   */
  stopPasswordCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval as any);
      this.checkInterval = null;
    }
  }

  /**
   * Show alert when password change is required
   */
  private async showPasswordChangeRequired(daysSinceLastChange: number): Promise<void> {
    if (!(await canShowPasswordAlert())) return;
    Alert.alert(
      'Password Change Required',
      `Your password is ${daysSinceLastChange} days old. For security reasons, you must change your password now.`,
      [
        {
          text: 'Change Password',
          onPress: () => this.navigateToChangePassword(),
        },
      ],
      { cancelable: false },
    );
  }

  /**
   * Show warning when password change is approaching
   */
  private async showPasswordChangeWarning(daysUntilRequired: number): Promise<void> {
    if (!(await canShowPasswordAlert())) return;
    Alert.alert(
      'Password Change Reminder',
      `Your password expires in ${daysUntilRequired} days. Consider changing it soon for continued security.`,
      [
        {
          text: 'Change Now',
          onPress: () => this.navigateToChangePassword(),
        },
        {
          text: 'Remind Later',
          style: 'cancel',
        },
      ],
    );
  }

  /**
   * Navigate to change password screen
   * Note: This requires navigation context to be properly set up
   */
  private navigateToChangePassword(): void {
    // This would need to be implemented with proper navigation context
    // For now, we'll just log the action
    console.log('Should navigate to ChangePassword screen');

    // In a real implementation, you would use:
    // NavigationService.navigate('ChangePassword');
    // or use navigation context/ref
  }

  /**
   * Check password status on app focus/resume
   */
  handleAppStateChange = (nextAppState: string): void => {
    if (nextAppState === 'active') {
      this.checkPasswordStatus();
    }
  };
}

// Export singleton instance
export const passwordStatusMonitor = new PasswordStatusMonitorService();

// Export service class for testing or multiple instances
export default PasswordStatusMonitorService;
