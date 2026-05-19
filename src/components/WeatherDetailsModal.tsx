import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';

interface WeatherDetailsModalProps {
  visible: boolean;
  opacityAnim: Animated.Value;
  slideAnim: Animated.Value;
  weather: any;
  fullWeatherData: any;
  phrase: string;
  getWeatherIcon: () => string;
  getWeatherDescription: () => string;
  formatTime: (t: string | undefined) => string;
  renderWeatherDetailItem: (
    icon: string,
    label: string,
    value: string | number,
    color?: string,
  ) => React.ReactElement;
  onClose: () => void;
  styles: any;
}

const WeatherDetailsModal: React.FC<WeatherDetailsModalProps> = ({
  visible,
  opacityAnim,
  slideAnim,
  weather,
  fullWeatherData,
  phrase,
  getWeatherIcon,
  getWeatherDescription,
  formatTime,
  renderWeatherDetailItem,
  onClose,
  styles,
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="none"
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <TouchableOpacity
        style={styles.modalBackdrop}
        activeOpacity={1}
        onPress={onClose}
      />
      <Animated.View
        style={[
          styles.weatherDetailsPopup,
          {
            opacity: opacityAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.grabber} />
        <View style={styles.weatherPopupHeader}>
          <Text style={styles.weatherPopupTitle}>Weather Details</Text>
          <TouchableOpacity onPress={onClose}>
            <Icon name="times" size={22} color="#777" />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.weatherDetailsContent}>
          {weather && fullWeatherData && (
            <>
              {/* Current Conditions */}
              <View style={styles.weatherSection}>
                <Text style={styles.sectionTitle}>Current Conditions</Text>
                <View style={styles.currentWeatherHeader}>
                  <Icon name={getWeatherIcon()} size={40} color="#FDB813" />
                  <View>
                    <Text style={styles.largeTemp}>
                      {Math.round(weather.temperature_2m)}°C
                    </Text>
                    <Text style={styles.weatherCondition}>
                      {getWeatherDescription()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.teaAdvice}>{phrase}</Text>
              </View>
              {/* Temperature Details */}
              <View style={styles.weatherSection}>
                <Text style={styles.sectionTitle}>Temperature</Text>
                {renderWeatherDetailItem(
                  'thermometer-half',
                  'Feels Like',
                  `${Math.round(
                    weather.apparent_temperature || weather.temperature_2m,
                  )}°C`,
                  '#FF6B6B',
                )}
                {renderWeatherDetailItem(
                  'temperature-low',
                  'Dew Point',
                  `${Math.round(weather.dew_point_2m || 0)}°C`,
                  '#4ECDC4',
                )}
                {fullWeatherData?.daily?.length > 0 && (
                  <>
                    {renderWeatherDetailItem(
                      'arrow-up',
                      "Today's High",
                      `${Math.round(
                        fullWeatherData.daily[0]?.temperature_2m_max ||
                          weather.temperature_2m,
                      )}°C`,
                      '#FF9F1C',
                    )}
                    {renderWeatherDetailItem(
                      'arrow-down',
                      "Today's Low",
                      `${Math.round(
                        fullWeatherData.daily[0]?.temperature_2m_min ||
                          weather.temperature_2m,
                      )}°C`,
                      '#1A535C',
                    )}
                  </>
                )}
              </View>
              {/* Precipitation */}
              <View style={styles.weatherSection}>
                <Text style={styles.sectionTitle}>Precipitation</Text>
                {renderWeatherDetailItem(
                  'tint',
                  'Rain',
                  `${weather.rain || 0}mm`,
                  '#3498DB',
                )}
                {renderWeatherDetailItem(
                  'cloud-rain',
                  'Showers',
                  `${weather.showers || 0}mm`,
                  '#2980B9',
                )}
                {renderWeatherDetailItem(
                  'snowflake',
                  'Snowfall',
                  `${weather.snowfall || 0}cm`,
                  '#BDC3C7',
                )}
                {renderWeatherDetailItem(
                  'clock',
                  'Precipitation Hours',
                  `${fullWeatherData?.daily?.[0]?.precipitation_hours || 0}h`,
                  '#9B59B6',
                )}
              </View>
              {/* Wind & Pressure */}
              <View style={styles.weatherSection}>
                <Text style={styles.sectionTitle}>Wind & Pressure</Text>
                {renderWeatherDetailItem(
                  'wind',
                  'Wind Speed',
                  `${Math.round(weather.wind_speed_10m || 0)} m/s`,
                  '#27AE60',
                )}
                {renderWeatherDetailItem(
                  'compass',
                  'Wind Direction',
                  `${Math.round(weather.wind_direction_10m || 0)}°`,
                  '#16A085',
                )}
                {renderWeatherDetailItem(
                  'wind',
                  'Wind Gusts',
                  `${Math.round(
                    weather.wind_gusts_10m || weather.wind_speed_10m || 0,
                  )} m/s`,
                  '#2ECC71',
                )}
                {renderWeatherDetailItem(
                  'weight',
                  'Pressure',
                  `${Math.round(weather.pressure_msl)} hPa`,
                  '#E74C3C',
                )}
              </View>
              {/* Atmospheric Conditions */}
              <View style={styles.weatherSection}>
                <Text style={styles.sectionTitle}>Atmospheric Conditions</Text>
                {renderWeatherDetailItem(
                  'cloud',
                  'Cloud Cover',
                  `${Math.round(weather.cloud_cover || 0)}%`,
                  '#95A5A6',
                )}
                {renderWeatherDetailItem(
                  'tint',
                  'Humidity',
                  `${Math.round(weather.relative_humidity_2m || 0)}%`,
                  '#3498DB',
                )}
                {renderWeatherDetailItem(
                  'eye',
                  'Visibility',
                  weather.visibility ? `${weather.visibility} km` : 'Good',
                  '#F39C12',
                )}
              </View>
              {/* Sun Times */}
              {fullWeatherData?.daily?.length > 0 && (
                <View style={styles.weatherSection}>
                  <Text style={styles.sectionTitle}>Sun</Text>
                  {renderWeatherDetailItem(
                    'sun',
                    'Sunrise',
                    fullWeatherData.daily[0]?.sunrise || '06:00',
                    '#F1C40F',
                  )}
                  {renderWeatherDetailItem(
                    'moon',
                    'Sunset',
                    fullWeatherData.daily[0]?.sunset || '18:30',
                    '#E67E22',
                  )}
                </View>
              )}

              {/* Extended Forecast */}
              {fullWeatherData?.daily?.length > 1 && (
                <View style={styles.weatherSection}>
                  <Text style={styles.sectionTitle}>15-Day Forecast</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.forecastScroll}
                  >
                    {fullWeatherData.daily.map((day: any, index: number) => {
                      const date = new Date(day.time);
                      const isToday = index === 0;
                      const dayName = isToday
                        ? 'Today'
                        : date.toLocaleDateString('en', { weekday: 'short' });
                      const monthDay = date.toLocaleDateString('en', {
                        month: 'short',
                        day: 'numeric',
                      });

                      return (
                        <View key={index} style={styles.forecastCard}>
                          <Text style={styles.forecastDay}>{dayName}</Text>
                          <Text style={styles.forecastDate}>{monthDay}</Text>
                          <Icon
                            name={
                              day.icon?.includes('day') ||
                              day.icon?.includes('sun')
                                ? 'sun'
                                : day.icon?.includes('rain')
                                ? 'cloud-rain'
                                : day.icon?.includes('cloud')
                                ? 'cloud'
                                : 'sun'
                            }
                            size={20}
                            color="#4CAF50"
                            style={styles.forecastIcon}
                          />
                          <Text style={styles.forecastHigh}>
                            {Math.round(day.temperature_2m_max)}°
                          </Text>
                          <Text style={styles.forecastLow}>
                            {Math.round(day.temperature_2m_min)}°
                          </Text>
                          {day.precipitation_sum > 0 && (
                            <Text style={styles.forecastRain}>
                              {Math.round(day.precipitation_sum)}mm
                            </Text>
                          )}
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* Additional Info */}
              <View style={styles.weatherSection}>
                <Text style={styles.sectionTitle}>Additional Information</Text>
                {renderWeatherDetailItem(
                  'info-circle',
                  'Weather Code',
                  String(weather.weather_code || 'N/A'),
                  '#7F8C8D',
                )}
                {renderWeatherDetailItem(
                  'clock',
                  'Last Updated',
                  weather.time
                    ? new Date(weather.time).toLocaleTimeString()
                    : 'N/A',
                  '#34495E',
                )}
              </View>
            </>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  </Modal>
);

export default WeatherDetailsModal;
