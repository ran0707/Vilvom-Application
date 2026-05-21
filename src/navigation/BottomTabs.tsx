import React from 'react';
import { useTranslation } from 'react-i18next';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeTab from '../tabs/HomeTab';
import ProfileTab from '../tabs/ProfileTab';
import SprayTab from '../tabs/Spray';
import DroneTab from '../tabs/DroneTab';
// Community is temporarily disabled — keeping import for future re-enable
// import CommunityScreen from '../screens/CommunityScreen';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const Tab = createBottomTabNavigator();

const ICON_SIZE = 25;

type TabIconProps = { color: string; focused: boolean };

const homeIcon    = ({ color }: TabIconProps) => <MaterialCommunityIcons name="home-outline"    size={ICON_SIZE} color={color} />;
const droneIcon   = ({ color }: TabIconProps) => <MaterialCommunityIcons name="quadcopter"      size={ICON_SIZE} color={color} />;
const sprayIcon   = ({ color }: TabIconProps) => <MaterialCommunityIcons name="water-outline"   size={ICON_SIZE} color={color} />;
const profileIcon = ({ color }: TabIconProps) => <MaterialCommunityIcons name="account-outline" size={ICON_SIZE} color={color} />;

const TAB_CONTENT_HEIGHT = 56; // icon + label, no inset

const BottomTabs = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  // Give the tab bar enough room for content + system navigation area
  const tabBarHeight   = TAB_CONTENT_HEIGHT + insets.bottom;
  const tabBarPadBottom = insets.bottom + 4;

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: '#9E9E9E',
        headerShown: false,
        tabBarStyle: {
          height: tabBarHeight,
          paddingBottom: tabBarPadBottom,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: '#F0F0F0',
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeTab}
        options={{
          title: t('nav.main_tabs') as string,
          tabBarLabel: t('nav.main_tabs') as string,
          tabBarIcon: homeIcon,
        }}
      />
      <Tab.Screen
        name="Drone"
        component={DroneTab}
        options={{
          title: 'Drone',
          tabBarLabel: 'Drone',
          tabBarIcon: droneIcon,
        }}
      />
      <Tab.Screen
        name="Spray log"
        component={SprayTab}
        options={{
          title: t('spray.title') as string,
          tabBarLabel: t('spray.title') as string,
          tabBarIcon: sprayIcon,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileTab}
        options={{
          title: t('profile.title') as string,
          tabBarLabel: t('profile.title') as string,
          tabBarIcon: profileIcon,
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomTabs;
