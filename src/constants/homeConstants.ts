// src/constants/homeConstants.ts
export const STORAGE_KEY = 'spray_logs';

// Type aliases
export type BigDataCloudResponse = any;
export type MapsCoResponse = any;
export type NominatimResponse = any;
export type FormatTimeOptions = Intl.DateTimeFormatOptions;
export type WeatherDetailItemProps = {
  icon: string;
  label: string;
  value: string | number;
  color?: string;
};

export type SprayLogLocal = {
  id: string;
  title: string;
  datetime: string;
  notes?: string;
};
