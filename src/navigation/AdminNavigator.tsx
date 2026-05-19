import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import AdminDashboard from '../screens/admin/AdminDashboard';
import AdminDroneBookings from '../screens/admin/AdminDroneBookings';

const Tab = createBottomTabNavigator();

const ICON_SIZE = 25;

type IconProps = { color: string };

const dashboardIcon = ({ color }: IconProps) => (
  <MaterialCommunityIcons name="view-dashboard-outline" size={ICON_SIZE} color={color} />
);
const bookingsIcon = ({ color }: IconProps) => (
  <MaterialCommunityIcons name="quadcopter" size={ICON_SIZE} color={color} />
);

const AdminNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarActiveTintColor: '#2E7D32',
      tabBarInactiveTintColor: '#9E9E9E',
      headerShown: false,
      tabBarStyle: {
        height: Platform.OS === 'android' ? 72 : 90,
        paddingBottom: Platform.OS === 'android' ? 16 : 32,
        paddingTop: 4,
        borderTopWidth: 1,
        borderTopColor: '#E8F5E9',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        backgroundColor: '#FAFFF9',
      },
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '500',
      },
    }}
  >
    <Tab.Screen
      name="Dashboard"
      component={AdminDashboard}
      options={{ tabBarLabel: 'Dashboard', tabBarIcon: dashboardIcon }}
    />
    <Tab.Screen
      name="DroneBookings"
      component={AdminDroneBookings}
      options={{ tabBarLabel: 'Drone Bookings', tabBarIcon: bookingsIcon }}
    />
  </Tab.Navigator>
);

export default AdminNavigator;
