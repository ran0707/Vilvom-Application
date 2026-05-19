import DeviceInfo from 'react-native-device-info';
import { Platform } from 'react-native';

export interface DeviceInformation {
  platform: string;
  model: string;
  version: string;
  uniqueId: string;
}

class DeviceInfoService {
  private static deviceInfo: DeviceInformation | null = null;

  static async getDeviceInfo(): Promise<DeviceInformation> {
    if (this.deviceInfo) {
      return this.deviceInfo;
    }

    try {
      const [uniqueId, model, systemVersion] = await Promise.all([
        DeviceInfo.getUniqueId(),
        DeviceInfo.getModel(),
        DeviceInfo.getSystemVersion(),
      ]);

      this.deviceInfo = {
        platform: Platform.OS,
        model: model,
        version: systemVersion,
        uniqueId: uniqueId,
      };

      return this.deviceInfo;
    } catch (error) {
      console.error('Error getting device info:', error);
      // Fallback device info
      this.deviceInfo = {
        platform: Platform.OS,
        model: 'Unknown',
        version: 'Unknown',
        uniqueId: 'fallback-' + Date.now().toString(),
      };
      return this.deviceInfo;
    }
  }

  static async getDeviceFingerprint(): Promise<string> {
    const deviceInfo = await this.getDeviceInfo();
    return `${deviceInfo.platform}-${deviceInfo.model}-${deviceInfo.uniqueId}`;
  }

  static clearCache(): void {
    this.deviceInfo = null;
  }
}

export default DeviceInfoService;
