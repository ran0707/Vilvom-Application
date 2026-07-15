import { ToastAndroid, Alert, Platform } from 'react-native';

export const showErrorToast = (message: string, title = 'Error') => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.LONG);
  } else {
    Alert.alert(title, message);
  }
};

export const showSuccessToast = (message: string, _title = 'Success') => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert(_title, message);
  }
};

export const showInfoToast = (message: string, _title = 'Info') => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert(_title, message);
  }
};
