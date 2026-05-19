// Safe storage wrapper: uses @react-native-async-storage/async-storage when available,
// otherwise falls back to an in-memory map so the app can continue during development.
let AsyncStorageImpl: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
  AsyncStorageImpl =
    require('@react-native-async-storage/async-storage').default;
} catch (e) {
  // module not available or not linked
  AsyncStorageImpl = null;
}

const fallbackStore: Record<string, string> = {};

export const getItem = async (key: string): Promise<string | null> => {
  try {
    if (AsyncStorageImpl && AsyncStorageImpl.getItem)
      return await AsyncStorageImpl.getItem(key);
    return key in fallbackStore ? fallbackStore[key] : null;
  } catch (e) {
    console.warn('getItem fallback used due to error', e);
    return key in fallbackStore ? fallbackStore[key] : null;
  }
};

export const setItem = async (key: string, value: string): Promise<void> => {
  try {
    if (AsyncStorageImpl && AsyncStorageImpl.setItem)
      return await AsyncStorageImpl.setItem(key, value);
    fallbackStore[key] = value;
  } catch (e) {
    console.warn('setItem fallback used due to error', e);
    fallbackStore[key] = value;
  }
};

export const removeItem = async (key: string): Promise<void> => {
  try {
    if (AsyncStorageImpl && AsyncStorageImpl.removeItem)
      return await AsyncStorageImpl.removeItem(key);
    delete fallbackStore[key];
  } catch (e) {
    console.warn('removeItem fallback used due to error', e);
    delete fallbackStore[key];
  }
};

export const debugStore = () => ({
  asyncStorageAvailable: !!AsyncStorageImpl,
  fallbackStore,
});
