import React, { useEffect, useState, useRef } from 'react';
import { ScrollView, Animated, Easing, Dimensions } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import {
  WeatherCurrent,
  WeatherDaily,
  WeatherFullData,
} from '../types/interfaces';

import NotificationPopup from '../components/NotificationPopup';
import TaskCard from '../components/TaskCard';
import DroneServiceCard from '../components/DroneServiceCard';
import WeatherDetailsModal from '../components/WeatherDetailsModal';
import PestInfestationCard from '../components/PestInfestationCard';
import { getHomeData } from '../services/authApi';
import { teaPlantationPhrases, notifications } from '../constants/statics';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getItem } from '../utils/storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import NotificationService from '../services/notificationService';
import { isAuthenticated } from '../services/authApi';

import { useTranslation } from 'react-i18next';

import { STORAGE_KEY, SprayLogLocal } from '../constants/homeConstants';

import {
  requestLocationPermission,
  getWeatherIcon,
  getWeatherDescription,
  getCityNameFromCoords,
  formatTime,
  renderWeatherDetailItem,
} from '../utils/homeUtils';

import {
  HeaderSection,
  WeatherSection,
} from '../components/HomeTabSections';
import SuccessStories from '../components/SuccessStories';

import styles from '../styles/HomeTabStyles';
import LogoHeader from '../components/LogoHeader';
const { height } = Dimensions.get('window');

const HomeTab = () => {
  const { t, i18n } = useTranslation();
  const [avatarUrl, setAvatarUrl] = useState(
    'https://i.pravatar.cc/150?img=12',
  );
  const navigation = useNavigation();
  const [weather, setWeather] = useState<WeatherCurrent | null>(null);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState(t('home.getting_location') as string);
  const [phrase, setPhrase] = useState('');
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [weatherDetailsVisible, setWeatherDetailsVisible] = useState(false);
  const [fullWeatherData, setFullWeatherData] =
    useState<WeatherFullData | null>(null);
  const [upcomingTasks, setUpcomingTasks] = useState<SprayLogLocal[]>([]);
  const [user, setUser] = useState<{ name: string; email: string } | null>(
    null,
  );




  // Animation values
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const weatherOpacityAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;
  // track whether we've already run the permission orchestration for this session
  const permissionsOrchestrated = useRef(false);

  // Coimbatore coordinates as fallback location
  const COIMBATORE_COORDS = {
    lat: 11.0168,
    lon: 76.9558,
    name: 'Coimbatore',
  };

  // Fetch weather data from Open-Meteo (free, no API key required)
  const fetchWeatherData = async (lat: number, lon: number): Promise<void> => {
    try {
      setLoading(true);

      const url =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,` +
        `precipitation,rain,showers,snowfall,weather_code,pressure_msl,surface_pressure,` +
        `cloud_cover,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index,visibility,is_day` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,` +
        `apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_sum,rain_sum,` +
        `showers_sum,snowfall_sum,precipitation_hours,precipitation_probability_max,` +
        `wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant` +
        `&wind_speed_unit=ms&timezone=auto&forecast_days=10&past_days=5`;

      console.log('Fetching weather data from Open-Meteo...');

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Open-Meteo error: ${response.status}`);
      }

      const data = await response.json();
      const current = data.current ?? {};
      const daily = data.daily ?? {};

      console.log('Open-Meteo data fetched successfully');

      // Map Open-Meteo current → WeatherCurrent
      const mappedCurrent: WeatherCurrent = {
        temperature_2m: current.temperature_2m ?? 0,
        relative_humidity_2m: current.relative_humidity_2m ?? 0,
        dew_point_2m: current.dew_point_2m ?? 0,
        apparent_temperature: current.apparent_temperature ?? 0,
        precipitation: current.precipitation ?? 0,
        rain: current.rain ?? 0,
        showers: current.showers ?? 0,
        snowfall: current.snowfall ?? 0,
        weather_code: current.weather_code ?? 0,
        pressure_msl: current.pressure_msl ?? 0,
        surface_pressure: current.surface_pressure ?? 0,
        cloud_cover: current.cloud_cover ?? 0,
        wind_speed_10m: current.wind_speed_10m ?? 0,       // already m/s
        wind_direction_10m: current.wind_direction_10m ?? 0,
        wind_gusts_10m: current.wind_gusts_10m ?? 0,       // already m/s
        time: current.time ?? new Date().toISOString(),
        uv_index: current.uv_index ?? 0,
        visibility: current.visibility ?? 10,
        is_day: current.is_day ?? 1,
        icon: String(current.weather_code ?? 0),
        description: getWeatherDescription({ weather_code: current.weather_code } as any) ?? 'Clear',
      };

      // Map Open-Meteo daily arrays → WeatherDaily[]
      const times: string[] = daily.time ?? [];
      const mappedDaily: WeatherDaily[] = times.map((date: string, i: number) => ({
        time: date,
        weather_code: daily.weather_code?.[i] ?? 0,
        temperature_2m_max: daily.temperature_2m_max?.[i] ?? 25,
        temperature_2m_min: daily.temperature_2m_min?.[i] ?? 15,
        apparent_temperature_max: daily.apparent_temperature_max?.[i] ?? 25,
        apparent_temperature_min: daily.apparent_temperature_min?.[i] ?? 15,
        sunrise: daily.sunrise?.[i] ?? '',
        sunset: daily.sunset?.[i] ?? '',
        uv_index_max: daily.uv_index_max?.[i] ?? 0,
        precipitation_sum: daily.precipitation_sum?.[i] ?? 0,
        rain_sum: daily.rain_sum?.[i] ?? 0,
        showers_sum: daily.showers_sum?.[i] ?? 0,
        snowfall_sum: daily.snowfall_sum?.[i] ?? 0,
        precipitation_hours: daily.precipitation_hours?.[i] ?? 0,
        precipitation_probability_max: daily.precipitation_probability_max?.[i] ?? 0,
        wind_speed_10m_max: daily.wind_speed_10m_max?.[i] ?? 0,
        wind_gusts_10m_max: daily.wind_gusts_10m_max?.[i] ?? 0,
        wind_direction_10m_dominant: daily.wind_direction_10m_dominant?.[i] ?? 0,
        shortcode: String(daily.weather_code?.[i] ?? 0),
        icon: String(daily.weather_code?.[i] ?? 0),
        description: getWeatherDescription({ weather_code: daily.weather_code?.[i] } as any) ?? 'Clear',
      }));

      // Resolve city name from coordinates (free reverse-geocoding)
      const cityName = await getCityNameFromCoords(lat, lon);
      setCity(cityName);

      // Create full weather data structure
      const fullData: WeatherFullData = {
        latitude: lat,
        longitude: lon,
        generationtime_ms: 0,
        utc_offset_seconds: 0,
        timezone: data.timezone ?? 'UTC',
        timezone_abbreviation: '',
        elevation: 0,
        current_units: {
          time: 'iso8601',
          interval: 'seconds',
          temperature_2m: '°C',
          relative_humidity_2m: '%',
          apparent_temperature: '°C',
          is_day: '',
          precipitation: 'mm',
          rain: 'mm',
          showers: 'mm',
          snowfall: 'mm',
          weather_code: 'wmo code',
          cloud_cover: '%',
          pressure_msl: 'hPa',
          surface_pressure: 'hPa',
          wind_speed_10m: 'm/s',
          wind_direction_10m: '°',
          wind_gusts_10m: 'm/s',
        },
        current: mappedCurrent,
        daily_units: {
          time: 'iso8601',
          weather_code: 'wmo code',
          temperature_2m_max: '°C',
          temperature_2m_min: '°C',
          apparent_temperature_max: '°C',
          apparent_temperature_min: '°C',
          sunrise: 'iso8601',
          sunset: 'iso8601',
          uv_index_max: '',
          precipitation_sum: 'mm',
          rain_sum: 'mm',
          showers_sum: 'mm',
          snowfall_sum: 'mm',
          precipitation_hours: 'h',
          precipitation_probability_max: '%',
          wind_speed_10m_max: 'm/s',
          wind_gusts_10m_max: 'm/s',
          wind_direction_10m_dominant: '°',
          shortcode: '',
        },
        daily: mappedDaily,
      };

      setWeather(mappedCurrent);
      setFullWeatherData(fullData);

      // Generate weather-appropriate phrase
      const getRandomPhrase = (weather: WeatherCurrent): string => {
        let phraseCategory = 'default';

        // Determine category based on weather conditions
        if (weather.rain > 0 || weather.precipitation > 0) {
          phraseCategory = 'rain';
        } else if (weather.cloud_cover < 20) {
          phraseCategory = 'sunny';
        } else if (weather.cloud_cover > 70) {
          phraseCategory = 'cloudy';
        } else if (weather.wind_speed_10m > 15) {
          phraseCategory = 'wind';
        } else if (weather.relative_humidity_2m > 80) {
          phraseCategory = 'humid';
        }

        const phrases =
          teaPlantationPhrases[
            phraseCategory as keyof typeof teaPlantationPhrases
          ] || teaPlantationPhrases.default;
        return phrases[Math.floor(Math.random() * phrases.length)];
      };

      const randomPhrase = getRandomPhrase(mappedCurrent);
      setPhrase(randomPhrase);
    } catch (error) {
      console.error('Open-Meteo Error:', error);
      setWeather(null);
      setCity(t('home.network_error') as string);
    } finally {
      setLoading(false);
    }
  };

  // Main function to get location and weather with Coimbatore fallback
  const fetchLocationAndWeather = async () => {
    // Set a timeout to ensure we always show Coimbatore data if location takes too long
    const locationTimeout = setTimeout(() => {
      console.log('Location fetch timeout, using Coimbatore as fallback');
      setCity('Using Coimbatore location...');
      fetchWeatherData(COIMBATORE_COORDS.lat, COIMBATORE_COORDS.lon);
    }, 10000); // 10 second timeout

    try {
      const hasPermission = await requestLocationPermission();

      if (!hasPermission) {
        // Use Coimbatore as fallback when permission is denied
        console.log('Location permission denied, using Coimbatore as fallback');
        clearTimeout(locationTimeout);
        setCity('Using Coimbatore location...');
        await fetchWeatherData(COIMBATORE_COORDS.lat, COIMBATORE_COORDS.lon);
        return;
      }

      setCity(t('home.detecting_location') as string);

      // Single attempt to get location with shorter timeout
      Geolocation.getCurrentPosition(
        async position => {
          clearTimeout(locationTimeout);
          const { latitude, longitude } = position.coords;
          console.log('Location detected:', latitude, longitude);
          await fetchWeatherData(latitude, longitude);
        },
        error => {
          console.log('Geolocation error:', error);
          clearTimeout(locationTimeout);
          // Use Coimbatore as fallback for any location error
          console.log('Location error occurred, using Coimbatore as fallback');
          setCity('Using Coimbatore location...');
          fetchWeatherData(COIMBATORE_COORDS.lat, COIMBATORE_COORDS.lon);
        },
        {
          enableHighAccuracy: false, // Use network location for faster response
          timeout: 8000, // Reduced timeout to 8 seconds
          maximumAge: 300000, // Accept cached location up to 5 minutes old
        },
      );
    } catch (error) {
      console.error('Unexpected Error:', error);
      clearTimeout(locationTimeout);
      // Use Coimbatore as fallback for any unexpected error
      console.log('Unexpected error occurred, using Coimbatore as fallback');
      setCity('Using Coimbatore location...');
      fetchWeatherData(COIMBATORE_COORDS.lat, COIMBATORE_COORDS.lon);
    }
  };

  // Show notification popup
  const showNotifications = () => {
    setNotificationVisible(true);
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Hide notification popup
  const hideNotifications = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setNotificationVisible(false));
  };

  // Show weather details popup
  const showWeatherDetails = () => {
    setWeatherDetailsVisible(true);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.back(1)),
        useNativeDriver: true,
      }),
      Animated.timing(weatherOpacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Hide weather details popup
  const hideWeatherDetails = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(weatherOpacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      } as any),
    ]).start(() => setWeatherDetailsVisible(false));
  };

  useEffect(() => {
    // Always try to get location first, but ensure we have data
    fetchLocationAndWeather();
    loadUpcomingTasks();
    // Always attempt to fetch user data (it handles authentication internally)
    fetchUserData();

    // Fallback timer - if still loading after 15 seconds, force Coimbatore data
    const fallbackTimer = setTimeout(() => {
      if (loading && !weather) {
        console.log('Fallback timer triggered - showing Coimbatore data');
        setCity('Showing Coimbatore weather...');
        fetchWeatherData(COIMBATORE_COORDS.lat, COIMBATORE_COORDS.lon);
      }
    }, 15000);

    return () => clearTimeout(fallbackTimer);
  }, []);

  // Send a test greeting notification when Home tab becomes focused
  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;
      (async () => {
        try {
          // Run permission orchestration only once per session
          if (!permissionsOrchestrated.current) {
            permissionsOrchestrated.current = true;
            try {
              const locGranted = await requestLocationPermission();
              console.log('[HomeTab] location permission:', locGranted);
            } catch (e) {
              console.warn('[HomeTab] location permission error', e);
            }
          }

          const granted =
            await NotificationService.requestNotificationPermission();
          console.log('[HomeTab] notification permission:', granted);

          const avail = await NotificationService.isAvailable();
          console.log('[HomeTab] notification lib available:', avail);

          if (!mounted) return;

          const welcomeSent = await NotificationService.hasWelcomeBeenSent();
          console.log('[HomeTab] welcomeSent flag:', welcomeSent);
          if (welcomeSent) return;

          if (granted === false) {
            console.log(
              '[HomeTab] notifications permission denied, skipping greeting',
            );
            return;
          }

          const hour = new Date().getHours();
          let greeting = t('home.greeting.day') as string;
          if (hour < 12) greeting = t('home.greeting.morning') as string;
          else if (hour < 17) greeting = t('home.greeting.afternoon') as string;
          else greeting = t('home.greeting.evening') as string;

          const name = user?.name ?? 'there';
          console.log('[HomeTab] sending greeting notification now');
          NotificationService.sendWelcomeNotification({
            title: greeting,
            message: `${greeting}, ${name}!`,
          });
        } catch (e) {
          console.warn('[HomeTab] greeting notification failed', e);
        }
      })();

      return () => {
        mounted = false;
      };
    }, [user]),
  );

  // Fetch user data from backend
  const fetchUserData = async () => {
    try {
      // Check if user is authenticated first
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        console.log('User not authenticated, using guest mode');
        setUser({ name: 'Guest User', email: 'guest@example.com' });
        return;
      }

      const response = await getHomeData();
      setUser({
        name: response.user.name ?? 'User',
        email: response.user.email ?? '',
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.warn(
          'Network request failed - backend server may not be running',
        );
        setUser({ name: 'Guest User', email: 'guest@example.com' });
      } else if (error && (error as any).message?.includes('token') || (error as any).message?.includes('Unauthorized')) {
        console.log('Authentication error, using guest mode');
        setUser({ name: 'Guest User', email: 'guest@example.com' });
      } else {
        setUser({ name: 'User', email: '' });
      }
    }
  };

  const loadUpcomingTasks = async () => {
    try {
      const raw = await getItem(STORAGE_KEY);
      const parsed: SprayLogLocal[] = raw ? JSON.parse(raw) : [];
      const now = new Date();
      const upcoming = parsed
        .filter(p => new Date(p.datetime) >= now)
        .sort((a, b) => (a.datetime > b.datetime ? 1 : -1))
        .slice(0, 3);
      setUpcomingTasks(upcoming);
    } catch (e) {
      console.warn('Failed to load upcoming tasks', e);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good Morning',  icon: '🌅' };
    if (hour < 17) return { text: 'Good Afternoon', icon: '☀️' };
    return { text: 'Good Evening', icon: '🌙' };
  };
  const greeting = getGreeting();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* ── Greeting ───────────────────────────────────────── */}
        <View style={styles.greetingBlock}>
          <Text style={styles.greetingText}>
            {greeting.text}{'  '}{greeting.icon}
          </Text>
          <Text style={styles.greetingName}>
            {user?.name ?? '...'}
          </Text>
        </View>

        <WeatherSection
          city={city}
          loading={loading}
          weather={weather}
          phrase={phrase}
          getWeatherIcon={() => getWeatherIcon(weather)}
          onPress={showWeatherDetails}
          onRetry={() => {
            setLoading(true);
            setCity(t('home.getting_location') as string);
            fetchLocationAndWeather();
          }}
        />

        <DroneServiceCard />
        {/* Pest Infestation Card */}
        <PestInfestationCard
          onScan={() => (navigation as any).navigate('CameraScreen')}
          onLearnMore={() =>
            (navigation as any).navigate('PestInfestationInfo')
          }
        />

        {/* Success stories component replaces the prior Tasks area */}
        <SuccessStories />
      </ScrollView>

      <NotificationPopup
        visible={notificationVisible}
        opacityAnim={opacityAnim}
        scaleAnim={scaleAnim}
        notifications={notifications}
        onClose={hideNotifications}
      />

      <WeatherDetailsModal
        visible={weatherDetailsVisible}
        opacityAnim={weatherOpacityAnim}
        slideAnim={slideAnim}
        weather={weather}
        fullWeatherData={fullWeatherData}
        phrase={phrase}
        getWeatherIcon={() => getWeatherIcon(weather)}
        getWeatherDescription={() => getWeatherDescription(weather)}
        formatTime={formatTime}
        renderWeatherDetailItem={renderWeatherDetailItem}
        onClose={hideWeatherDetails}
        styles={styles}
      />
    </SafeAreaView>
  );
};

export default HomeTab;
