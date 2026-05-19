import React from 'react';
import { useTranslation } from 'react-i18next';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TouchableOpacity, View, StyleSheet, Platform } from 'react-native';
import HomeTab from '../tabs/HomeTab';
import ProfileTab from '../tabs/ProfileTab';
import MarketTab from '../tabs/MarketTab';
import SprayTab from '../tabs/Spray';
import CommunityScreen from '../screens/CommunityScreen';
import Icon from 'react-native-vector-icons/FontAwesome5';

const Tab = createBottomTabNavigator();

const BottomTabs = () => {
  const { t } = useTranslation();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          // Skip icon mapping for the center Scan tab (we handle it via custom button)
          if (route.name === 'Scan') return null;
          let iconName = '';
          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'PesticideHub') iconName = 'leaf';
          else if (route.name === 'Spray log') iconName = 'spray-can';
          else if (route.name === 'Profile') iconName = 'user';
          return <Icon name={iconName} size={size} color={color} solid />;
        },
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarStyle: {
          height: Platform.OS === 'android' ? 60 : 80,
          paddingBottom: Platform.OS === 'android' ? 8 : 20,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeTab}
        options={{
          headerShown: false,
          title: t('nav.main_tabs') as string,
          tabBarLabel: t('nav.main_tabs') as string,
        }}
      />
      <Tab.Screen
        name="PesticideHub"
        component={MarketTab}
        options={{
          title: t('market.title') as string,
          tabBarLabel: t('market.title') as string,
        }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityScreen}
        options={{
          title: 'Community',
          tabBarLabel: 'Community',
          tabBarIcon: ({ color, size }) => (
            <Icon name="comments" size={size} color={color} solid />
          ),
        }}
      />
      <Tab.Screen
        name="Spray log"
        component={SprayTab}
        options={{
          title: t('spray.title') as string,
          tabBarLabel: t('spray.title') as string,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileTab}
        options={{
          title: t('profile.title') as string,
          tabBarLabel: t('profile.title') as string,
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomTabs;

const styles = StyleSheet.create({
  scanWrapper: {
    top: -18,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  scanButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4285F4',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});
