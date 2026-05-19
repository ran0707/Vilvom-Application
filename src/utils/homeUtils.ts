// src/utils/homeUtils.ts
import { PermissionsAndroid, Platform, Alert, Linking } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import {
  OpenMeteoCurrent,
  OpenMeteoResponse,
  WeatherData,
} from '../types/interfaces';
import {
  teaPlantationPhrases,
  weatherCodeDescriptions,
} from '../constants/statics';
import GeminiService from '../services/geminiService';
import { GEMINI_API_KEY } from '../config/gemini';
import {
  BigDataCloudResponse,
  MapsCoResponse,
  NominatimResponse,
  FormatTimeOptions,
  WeatherDetailItemProps,
} from '../constants/homeConstants';

// Pick appropriate tea plantation advice
export const pickTeaPhrase = (weatherData: WeatherData | null): string => {
  try {
    // Prefer localized phrases provided by i18n in callers. Fallback to static constants here.
    const phrases: any = {};
    const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    if (!weatherData)
      return (
        (phrases.default && pick(phrases.default)) ||
        teaPlantationPhrases.default[0]
      );
    if (weatherData.relative_humidity_2m > 85) {
      return (
        (phrases.humid && pick(phrases.humid)) ||
        teaPlantationPhrases.humid[
          Math.floor(Math.random() * teaPlantationPhrases.humid.length)
        ]
      );
    } else if (weatherData.temperature_2m > 28) {
      return (
        (phrases.sunny && pick(phrases.sunny)) ||
        teaPlantationPhrases.sunny[
          Math.floor(Math.random() * teaPlantationPhrases.sunny.length)
        ]
      );
    } else if (weatherData.wind_speed_10m > 8) {
      return (
        (phrases.wind && pick(phrases.wind)) ||
        teaPlantationPhrases.wind[
          Math.floor(Math.random() * teaPlantationPhrases.wind.length)
        ]
      );
    } else if (weatherData.relative_humidity_2m > 70) {
      return (
        (phrases.rain && pick(phrases.rain)) ||
        teaPlantationPhrases.rain[
          Math.floor(Math.random() * teaPlantationPhrases.rain.length)
        ]
      );
    } else {
      return (
        (phrases.cloudy && pick(phrases.cloudy)) ||
        teaPlantationPhrases.cloudy[
          Math.floor(Math.random() * teaPlantationPhrases.cloudy.length)
        ]
      );
    }
  } catch (e) {
    if (!weatherData) return teaPlantationPhrases.default[0];
    if (weatherData.relative_humidity_2m > 85)
      return teaPlantationPhrases.humid[
        Math.floor(Math.random() * teaPlantationPhrases.humid.length)
      ];
    if (weatherData.temperature_2m > 28)
      return teaPlantationPhrases.sunny[
        Math.floor(Math.random() * teaPlantationPhrases.sunny.length)
      ];
    if (weatherData.wind_speed_10m > 8)
      return teaPlantationPhrases.wind[
        Math.floor(Math.random() * teaPlantationPhrases.wind.length)
      ];
    if (weatherData.relative_humidity_2m > 70)
      return teaPlantationPhrases.rain[
        Math.floor(Math.random() * teaPlantationPhrases.rain.length)
      ];
    return teaPlantationPhrases.cloudy[
      Math.floor(Math.random() * teaPlantationPhrases.cloudy.length)
    ];
  }
};

// Ask permission (Android only)
export const requestLocationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'ios') {
    try {
      if ((Geolocation as any).requestAuthorization) {
        (Geolocation as any).requestAuthorization();
      }
    } catch (e) {
      // fallthrough
    }
    return true;
  }

  try {
    const perm = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
    const granted = await PermissionsAndroid.request(perm);
    console.log('[HomeTab] location permission result:', granted);
    if (granted === PermissionsAndroid.RESULTS.GRANTED) return true;

    if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
      try {
        Alert.alert(
          'Location Permission',
          'Location access is needed to provide location-based services. Permission has been denied permanently; please enable Location access from your device settings if you need location-based features.',
          [{ text: 'OK', style: 'default' }],
        );
      } catch (e) {
        // ignore
      }
    }

    return false;
  } catch (err) {
    console.warn('Permission error:', err);
    return false;
  }
};

// Get city name from coordinates
export const getCityNameFromCoords = async (
  lat: number,
  lon: number,
): Promise<string> => {
  try {
    const services = [
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
      `https://geocode.maps.co/reverse?lat=${lat}&lon=${lon}&format=json`,
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
    ];

    for (const url of services) {
      try {
        const response = await fetch(url, {
          headers: { 'User-Agent': 'CamelliaTeaApp/1.0' },
        });

        if (response.ok) {
          if (url.includes('bigdatacloud')) {
            const data: BigDataCloudResponse = await response.json();
            return (
              data.city ||
              data.locality ||
              data.principalSubdivision ||
              'Current Location'
            );
          } else if (url.includes('geocode.maps.co')) {
            const data: MapsCoResponse = await response.json();
            return (
              data.address?.city ||
              data.address?.town ||
              data.address?.village ||
              data.address?.county ||
              data.address?.state ||
              'Current Location'
            );
          } else if (url.includes('nominatim')) {
            const data: NominatimResponse = await response.json();
            return (
              data.address?.city ||
              data.address?.town ||
              data.address?.village ||
              data.address?.county ||
              data.address?.state ||
              'Current Location'
            );
          }
        }
      } catch (error) {
        console.log(`Geocoding service failed: ${url}`, error);
        continue;
      }
    }

    return 'Current Location';
  } catch (error) {
    console.error('Error getting city name:', error);
    return 'Current Location';
  }
};

// Fetch weather data
export const fetchWeatherData = async (
  lat: number,
  lon: number,
  setWeather: (w: OpenMeteoCurrent | null) => void,
  setFullWeatherData: (d: OpenMeteoResponse | null) => void,
  setCity: (c: string) => void,
  setLoading: (l: boolean) => void,
  setPhrase: (p: string) => void,
  pickTeaPhrase: (w: WeatherData | null) => string,
  translateTextIfNeeded: (t: string, targetLang?: string) => Promise<string>,
): Promise<void> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,precipitation,rain,showers,snowfall,weather_code,pressure_msl,surface_pressure,cloud_cover,wind_speed_10m,wind_direction_10m,wind_gusts_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,precipitation_hours&timezone=auto`,
      { signal: controller.signal },
    );

    clearTimeout(timeoutId);

    if (response.ok) {
      const data: OpenMeteoResponse = await response.json();
      if (data && data.current) {
        setWeather(data.current);
        setFullWeatherData(data);
        const rawPhrase = pickTeaPhrase(data.current);
        (async () => {
          try {
            // Caller should pass the desired target language when calling translateTextIfNeeded.
            const translated = await translateTextIfNeeded(rawPhrase, 'en');
            setPhrase(translated || rawPhrase);
          } catch (e) {
            setPhrase(rawPhrase);
          }
        })();

        const cityName = await getCityNameFromCoords(lat, lon);
        setCity(cityName);
      } else {
        setWeather(null);
        setCity('Location unavailable');
      }
    } else {
      setWeather(null);
      setCity('Weather service error');
    }
  } catch (error) {
    console.error('Weather API Error:', error);
    setWeather(null);
    setCity('Network error');
  } finally {
    setLoading(false);
  }
};

// Main function to get location and weather
export const fetchLocationAndWeather = async (
  setCity: (c: string) => void,
  setLoading: (l: boolean) => void,
  fetchWeatherData: (lat: number, lon: number) => Promise<void>,
): Promise<void> => {
  try {
    const hasPermission = await requestLocationPermission();

    if (!hasPermission) {
      setCity('Location permission denied');
      setLoading(false);
      return;
    }

    setCity('Detecting location...');

    Geolocation.getCurrentPosition(
      async position => {
        const { latitude, longitude } = position.coords;
        await fetchWeatherData(latitude, longitude);
      },
      error => {
        console.log('Geolocation error:', error);
        if (error && typeof error.code === 'number') {
          switch (error.code) {
            case 1:
              setCity('Location permission denied');
              break;
            case 2:
              setCity('Location provider unavailable');
              break;
            case 3:
              setCity('Location request timed out');
              break;
            default:
              setCity('Location access failed');
          }
        } else {
          setCity('Location access failed');
        }
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  } catch (error) {
    console.error('Unexpected Error:', error);
    setCity('Unexpected error');
    setLoading(false);
  }
};

// Pick icon based on weather data
export const getWeatherIcon = (weather: OpenMeteoCurrent | null): string => {
  if (!weather) return 'cloud';

  if (weather.weather_code !== undefined) {
    if (weather.weather_code === 0 || weather.weather_code === 1) return 'sun';
    if (weather.weather_code >= 51 && weather.weather_code <= 67)
      return 'cloud-rain';
    if (weather.weather_code >= 71 && weather.weather_code <= 77)
      return 'snowflake';
    if (weather.weather_code >= 95 && weather.weather_code <= 99) return 'bolt';
    if (weather.weather_code === 45 || weather.weather_code === 48)
      return 'smog';
  }

  if (weather.temperature_2m > 28) return 'sun';
  if (weather.wind_speed_10m > 10) return 'wind';
  if (weather.relative_humidity_2m > 80) return 'cloud-rain';
  return 'cloud';
};

// Get weather condition description
export const getWeatherDescription = (
  weather: OpenMeteoCurrent | null,
): string => {
  if (!weather || weather.weather_code === undefined) return 'Unknown';
  return (
    weatherCodeDescriptions[
      weather.weather_code as keyof typeof weatherCodeDescriptions
    ] || 'Unknown'
  );
};

// Translate dynamic text using Gemini
export const translateTextIfNeeded = async (
  text: string,
  targetLang: string = 'en',
): Promise<string> => {
  try {
    const lng = targetLang || 'en';
    if (!text || lng.startsWith('en')) return text;
    const system = `Translate the following short user-facing text into ${lng}. Preserve technical terms. Provide only the translated text.`;
    const resp = await GeminiService.sendChatMessage(GEMINI_API_KEY, [
      { role: 'system', content: system },
      { role: 'user', content: text },
    ]);
    return resp || text;
  } catch (e) {
    return text;
  }
};

// Format time
export const formatTime = (timeString: string | undefined): string => {
  if (!timeString) return 'N/A';
  return new Date(timeString).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  } as FormatTimeOptions);
};

// Weather detail items for the modal
export const renderWeatherDetailItem = (
  icon: WeatherDetailItemProps['icon'],
  label: WeatherDetailItemProps['label'],
  value: WeatherDetailItemProps['value'],
  color: WeatherDetailItemProps['color'] = '#666',
): React.ReactElement => {
  const React = require('react');
  const { View, Text } = require('react-native');
  const Icon = require('react-native-vector-icons/FontAwesome5').default;

  return React.createElement(
    View,
    {
      key: `${icon}-${label}`,
      style: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#f8f9fa',
        marginVertical: 2,
        borderRadius: 8,
      },
    },
    React.createElement(
      View,
      {
        style: {
          flexDirection: 'row',
          alignItems: 'center',
          flex: 1,
        },
      },
      React.createElement(Icon, {
        name: icon,
        size: 16,
        color: color,
        style: { marginRight: 12, width: 20 },
      }),
      React.createElement(
        Text,
        {
          style: {
            fontSize: 14,
            color: '#333',
            flex: 1,
          },
        },
        label,
      ),
    ),
    React.createElement(
      Text,
      {
        style: {
          fontSize: 14,
          fontWeight: '600',
          color: '#333',
          textAlign: 'right',
        },
      },
      String(value),
    ),
  );
};
