import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as RNLocalize from 'react-native-localize';

import en from './locales/en.json';
import ta from './locales/ta.json';
import ml from './locales/ml.json';
import hi from './locales/hi.json';
import te from './locales/te.json';
import as from './locales/as.json';
import bn from './locales/bn.json';

const resources: { [key: string]: { translation: any } } = {
  en: { translation: en },
  ta: { translation: ta },
  ml: { translation: ml },
  hi: { translation: hi },
  te: { translation: te },
  as: { translation: as },
  bn: { translation: bn },
};

const STORAGE_KEY = '@app:language';

const detectInitialLanguage = async () => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
  } catch (e) {
    // ignore
  }
  const locales = RNLocalize.getLocales();
  if (locales && locales.length > 0) {
    const code = locales[0].languageCode;
    if (resources[code]) return code;
    // map some region codes
    if (code === 'bn') return 'bn';
    if (code === 'ta') return 'ta';
    if (code === 'ml') return 'ml';
    if (code === 'hi') return 'hi';
    if (code === 'te') return 'te';
    if (code === 'as') return 'as';
  }
  return 'en';
};

export const initI18n = async () => {
  const lng = await detectInitialLanguage();
  i18n.use(initReactI18next).init({
    resources,
    lng,
    fallbackLng: 'en',
    compatibilityJSON: 'v3',
    interpolation: { escapeValue: false },
  });
};

export const setAppLanguage = async (lng: string) => {
  await AsyncStorage.setItem(STORAGE_KEY, lng);
  await i18n.changeLanguage(lng);
};

export default i18n;
