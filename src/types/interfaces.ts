// All shared TypeScript interfaces and types for the app

export interface WeatherCurrent {
  temperature_2m: number;
  relative_humidity_2m: number;
  dew_point_2m: number;
  apparent_temperature: number;
  precipitation: number;
  rain: number;
  showers: number;
  snowfall: number;
  weather_code: number;
  pressure_msl: number;
  surface_pressure: number;
  cloud_cover: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  wind_gusts_10m: number;
  time: string;
  // Additional OpenWeatherMap fields
  uv_index?: number;
  visibility?: number;
  is_day?: number;
  icon?: string;
  description?: string;
}

export interface WeatherDaily {
  time: string;
  weather_code: number;
  temperature_2m_max: number;
  temperature_2m_min: number;
  apparent_temperature_max: number;
  apparent_temperature_min: number;
  sunrise: string;
  sunset: string;
  uv_index_max: number;
  precipitation_sum: number;
  rain_sum: number;
  showers_sum: number;
  snowfall_sum: number;
  precipitation_hours: number;
  precipitation_probability_max: number;
  wind_speed_10m_max: number;
  wind_gusts_10m_max: number;
  wind_direction_10m_dominant: number;
  shortcode: string;
  icon: string;
  description: string;
}

export interface WeatherFullData {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  current_units: {
    time: string;
    interval: string;
    temperature_2m: string;
    relative_humidity_2m: string;
    apparent_temperature: string;
    is_day: string;
    precipitation: string;
    rain: string;
    showers: string;
    snowfall: string;
    weather_code: string;
    cloud_cover: string;
    pressure_msl: string;
    surface_pressure: string;
    wind_speed_10m: string;
    wind_direction_10m: string;
    wind_gusts_10m: string;
  };
  current: WeatherCurrent;
  daily_units: {
    time: string;
    weather_code: string;
    temperature_2m_max: string;
    temperature_2m_min: string;
    apparent_temperature_max: string;
    apparent_temperature_min: string;
    sunrise: string;
    sunset: string;
    uv_index_max: string;
    precipitation_sum: string;
    rain_sum: string;
    showers_sum: string;
    snowfall_sum: string;
    precipitation_hours: string;
    precipitation_probability_max: string;
    wind_speed_10m_max: string;
    wind_gusts_10m_max: string;
    wind_direction_10m_dominant: string;
    shortcode: string;
  };
  daily: WeatherDaily[];
}

export interface OpenMeteoCurrent {
  temperature_2m: number;
  relative_humidity_2m: number;
  dew_point_2m: number;
  apparent_temperature: number;
  precipitation: number;
  rain: number;
  showers: number;
  snowfall: number;
  weather_code: number;
  pressure_msl: number;
  surface_pressure: number;
  cloud_cover: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  wind_gusts_10m: number;
  time: string;
}

export interface OpenMeteoDaily {
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  sunrise: string[];
  sunset: string[];
  precipitation_sum: number[];
  precipitation_hours: number[];
}

export interface OpenMeteoResponse {
  current: OpenMeteoCurrent;
  daily?: OpenMeteoDaily;
}

export interface TeaPlantationPhrases {
  sunny: string[];
  cloudy: string[];
  rain: string[];
  wind: string[];
  humid: string[];
  default: string[];
}

export interface WeatherData {
  temperature_2m: number;
  relative_humidity_2m: number;
  dew_point_2m: number;
  apparent_temperature: number;
  precipitation: number;
  rain: number;
  showers: number;
  snowfall: number;
  weather_code: number;
  pressure_msl: number;
  surface_pressure: number;
  cloud_cover: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  wind_gusts_10m: number;
  time: string;
}

export interface BigDataCloudResponse {
  city?: string;
  locality?: string;
  principalSubdivision?: string;
}

export interface MapsCoAddress {
  city?: string;
  town?: string;
  village?: string;
  county?: string;
  state?: string;
}

export interface MapsCoResponse {
  address?: MapsCoAddress;
}

export interface NominatimAddress {
  city?: string;
  town?: string;
  village?: string;
  county?: string;
  state?: string;
}

export interface NominatimResponse {
  address?: NominatimAddress;
}

export interface WeatherDetailItemProps {
  icon: string;
  label: string;
  value: string | number;
  color?: string;
}

export interface FormatTimeOptions {
  hour: '2-digit' | 'numeric';
  minute: '2-digit' | 'numeric';
}
