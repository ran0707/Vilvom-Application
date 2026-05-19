import React from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { StyleSheet } from 'react-native';

interface WeatherCardProps {
  loading: boolean;
  weather: any;
  phrase: string;
  getWeatherIcon: () => string;
  onPress: () => void;
  onRetry: () => void;
  city: string;
}

const WeatherCard: React.FC<WeatherCardProps> = ({
  loading,
  weather,
  phrase,
  getWeatherIcon,
  onPress,
  onRetry,
  city,
}) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.cardWrapper}>
    <View style={styles.card}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Fetching weather...</Text>
        </View>
      ) : weather ? (
        <>
          {/* Header: City */}
          <Text style={styles.cityText}>{city}</Text>

          {/* Main Info */}
          <View style={styles.mainContainer}>
            <Icon name={getWeatherIcon()} size={48} color="#FFD166" />
            <View style={styles.tempContainer}>
              <Text style={styles.tempText}>{Math.round(weather.temperature_2m)}°C</Text>
              <Text style={styles.feelsText}>
                Feels like {Math.round(weather.apparent_temperature || weather.temperature_2m)}°C
              </Text>
            </View>
          </View>

          {/* Weather Phrase */}
          <Text style={styles.phraseText} numberOfLines={2}>
            {phrase}
          </Text>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Icon name="tint" size={16} color="#4CAF50" />
              <Text style={styles.statValue}>{Math.round(weather.relative_humidity_2m || 0)}%</Text>
              <Text style={styles.statLabel}>Humidity</Text>
            </View>
            <View style={styles.stat}>
              <Icon name="wind" size={16} color="#4CAF50" />
              <Text style={styles.statValue}>{Math.round(weather.wind_speed_10m || 0)} m/s</Text>
              <Text style={styles.statLabel}>Wind</Text>
            </View>
            <View style={styles.stat}>
              <Icon name="cloud-rain" size={16} color="#4CAF50" />
              <Text style={styles.statValue}>{weather.precipitation || 0} mm</Text>
              <Text style={styles.statLabel}>Rain</Text>
            </View>
            <View style={styles.stat}>
              <Icon name="eye" size={16} color="#4CAF50" />
              <Text style={styles.statValue}>{weather.visibility || 5} km</Text>
              <Text style={styles.statLabel}>Visibility</Text>
            </View>
          </View>
        </>
      ) : (
        <View style={styles.errorContainer}>
          <Icon name="exclamation-triangle" size={32} color="#FF9800" />
          <Text style={styles.errorText}>Weather data unavailable</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Icon name="refresh" size={16} color="white" />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  </TouchableOpacity>
);

export default WeatherCard;

const styles = StyleSheet.create({
  cardWrapper: { paddingHorizontal: 16, marginVertical: 8 },
  card: {
    backgroundColor: '#F0F8FF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 5,
  },
  cityText: { fontSize: 18, fontWeight: '700', color: '#2E8B57', marginBottom: 12 },
  mainContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  tempContainer: { marginLeft: 12 },
  tempText: { fontSize: 32, fontWeight: '700', color: '#333' },
  feelsText: { fontSize: 14, color: '#666', marginTop: 2 },
  phraseText: { fontSize: 14, color: '#555', marginBottom: 16 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 14, fontWeight: '600', color: '#333', marginTop: 2 },
  statLabel: { fontSize: 12, color: '#777' },
  loadingContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 30 },
  loadingText: { marginTop: 10, fontSize: 14, color: '#555' },
  errorContainer: { alignItems: 'center', paddingVertical: 20 },
  errorText: { marginTop: 8, fontSize: 16, fontWeight: '600', color: '#FF9800' },
  retryButton: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  retryText: { color: 'white', marginLeft: 6, fontWeight: '600' },
});
