// src/components/HomeTabSections.tsx
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome5';
import WeatherCard from './WeatherCard';
import NotificationPopup from './NotificationPopup';
import FieldCard from './FieldCard';
import PestCard from './PestCard';
import TaskCard from './TaskCard';
import DroneServiceCard from './DroneServiceCard';
import WeatherDetailsModal from './WeatherDetailsModal';
import { useTranslation } from 'react-i18next';
import { WeatherDetailItemProps } from '../constants/homeConstants';

interface HeaderSectionProps {
  avatarUrl: string;
  user: { name: string; email: string } | null;
  showNotifications: () => void;
}

export const HeaderSection: React.FC<HeaderSectionProps> = ({
  avatarUrl,
  user,
  showNotifications,
}) => {
  const { t } = useTranslation();
  return (
    <View style={styles.header}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        <View>
          <Text style={styles.helloText}>{t('home.hello')}</Text>
          <Text style={styles.username}>
            {user ? user.name : (t('common.loading') as string)}
          </Text>
        </View>
      </View>
      <TouchableOpacity style={styles.notifBtn} onPress={showNotifications}>
        <Icon name="bell" size={22} color="#222" />
        <View style={styles.notifDot} />
      </TouchableOpacity>
    </View>
  );
};

interface WeatherSectionProps {
  city: string;
  loading: boolean;
  weather: any;
  phrase: string;
  getWeatherIcon: () => string;
  onPress: () => void;
  onRetry: () => void;
}

export const WeatherSection: React.FC<WeatherSectionProps> = ({
  city,
  loading,
  weather,
  phrase,
  getWeatherIcon,
  onPress,
  onRetry,
}) => (
  <View style={weatherSectionStyles.container}>
    <WeatherCard
      loading={loading}
      weather={weather}
      phrase={phrase}
      getWeatherIcon={getWeatherIcon}
      onPress={onPress}
      onRetry={onRetry}
      city={city}
    />
  </View>
);

interface PestsSectionProps {
  recentPests: any[];
  navigation: any;
  t: any;
}

export const PestsSection: React.FC<PestsSectionProps> = ({
  recentPests,
  navigation,
  t,
}) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{t('home.my_pests')}</Text>
    <TouchableOpacity
      onPress={() => navigation.navigate('PesticideHub' as never)}
    >
      <Text style={styles.seeAll}>{t('common.see_all')}</Text>
    </TouchableOpacity>
  </View>
);

interface TasksSectionProps {
  upcomingTasks: any[];
  t: any;
}

export const TasksSection: React.FC<TasksSectionProps> = ({
  upcomingTasks,
  t,
}) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{t('home.tasks_title')}</Text>
    <TouchableOpacity onPress={() => {}}>
      <Text style={styles.seeAll}>{t('common.see_all')}</Text>
    </TouchableOpacity>
  </View>
);

export const renderWeatherDetailItem = (
  icon: WeatherDetailItemProps['icon'],
  label: WeatherDetailItemProps['label'],
  value: WeatherDetailItemProps['value'],
  color: WeatherDetailItemProps['color'] = '#666',
): React.ReactElement => (
  <View style={styles.detailItem}>
    <View style={styles.detailIconContainer}>
      <Icon name={icon} size={20} color={color} />
    </View>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
  },
  avatar: { width: 52, height: 52, borderRadius: 26, marginRight: 12 },
  helloText: { fontSize: 14, color: '#777' },
  username: { fontSize: 20, fontWeight: '700', color: '#111' },
  notifBtn: {
    position: 'relative',
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f8f8',
  },
  notifDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'red',
    position: 'absolute',
    top: 5,
    right: 5,
  },
  locationName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 4,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    marginTop: 10,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#222' },
  seeAll: { fontSize: 14, color: '#4CAF50' },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  detailIconContainer: {
    width: 40,
    alignItems: 'center',
  },
  detailLabel: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
});

const weatherSectionStyles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  locationText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#2E7D32',
    textAlign: 'center',
    marginBottom: 8,
    marginTop: 20,
    letterSpacing: 0.5,
  },
});
