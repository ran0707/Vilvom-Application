import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import SplashScreen      from '../screens/SplashScreen';
import GetStartedScreen  from '../screens/GetStartedScreen';
import SignupScreen      from '../screens/SignupScreen';
import LoginScreen       from '../screens/LoginScreen';
import BottomTabs        from './BottomTabs';
import DroneContactScreen        from '../screens/DroneContactScreen';
import PestResultScreen          from '../screens/PestResultScreen';
import PestQuestionnaireScreen   from '../screens/PestQuestionnaireScreen';
import LanguageSelection         from '../screens/LanguageSelection';
import FeedbackScreen            from '../screens/FeedbackScreen';
import PestDetail                from '../screens/PestDetail';
import PPCInfoScreen             from '../screens/PPCInfoScreen';
import CommunityScreen           from '../screens/CommunityScreen';
import PestInfestationInfoScreen from '../screens/PestInfestationInfoScreen';
import CameraScreen              from '../screens/CameraScreen';
import AdvisoryContactScreen     from '../screens/AdvisoryContactScreen';
import LatestTeaNewsScreen       from '../screens/LatestTeaNewsScreen';
import RecentOrdersScreen        from '../screens/RecentOrdersScreen';
import OrderTrackingScreen       from '../screens/OrderTrackingScreen';
import ChangePasswordScreen      from '../screens/ChangePasswordScreen';
import BecomeSellerScreen        from '../screens/BecomeSellerScreen';
import EditProfileScreen         from '../screens/EditProfileScreen';
import HelpSupportScreen         from '../screens/HelpSupportScreen';
import AdminNavigator            from './AdminNavigator';

const Stack = createStackNavigator();

const safeDecode = (str: string): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  str = String(str).replace(/=+$/, '');
  if (str.length % 4 === 1) return '';
  for (let bc = 0, bs = 0, idx = 0; idx < str.length; idx++) {
    const p = chars.indexOf(str.charAt(idx));
    if (p === -1) continue;
    bs = bc % 4 ? bs * 64 + p : p;
    if (bc++ % 4) output += String.fromCharCode(255 & bs >> (-2 * bc & 6));
  }
  return output;
};

const isTokenExpired = (token: string): boolean => {
  try {
    if (!token || typeof token !== 'string') return true;
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const padding = '='.repeat((4 - (parts[1].length % 4)) % 4);
    const base64 = (parts[1] + padding).replace(/-/g, '+').replace(/_/g, '/');
    const json = safeDecode(base64);
    if (!json) return true;
    const { exp } = JSON.parse(json);
    if (typeof exp !== 'number') return false;
    return Date.now() >= exp * 1000;
  } catch {
    return true;
  }
};

// Splash: check persisted session and route immediately — no login prompt for existing users
const SplashEntry = ({ navigation }: any) => {
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const start = Date.now();
      const minSplash = 2000;
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          const delay = Math.max(minSplash - (Date.now() - start), 0);
          setTimeout(() => { if (!cancelled) navigation.replace('GetStarted'); }, delay);
          return;
        }
        if (isTokenExpired(token)) {
          await AsyncStorage.multiRemove(['authToken', 'userData']);
          const delay = Math.max(minSplash - (Date.now() - start), 0);
          setTimeout(() => { if (!cancelled) navigation.replace('GetStarted'); }, delay);
          return;
        }
        const userDataStr = await AsyncStorage.getItem('userData');
        const userData = userDataStr ? JSON.parse(userDataStr) : null;
        const dest = userData?.isAdmin ? 'AdminPanel' : 'MainTabs';
        const delay = Math.max(minSplash - (Date.now() - start), 0);
        setTimeout(() => { if (!cancelled) navigation.replace(dest); }, delay);
      } catch {
        const delay = Math.max(minSplash - (Date.now() - start), 0);
        setTimeout(() => { if (!cancelled) navigation.replace('GetStarted'); }, delay);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [navigation]);

  return <SplashScreen />;
};

const AppNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{ headerShown: false, animation: 'none' }}
    >
      <Stack.Screen name="Splash"    component={SplashEntry} />
      <Stack.Screen name="GetStarted">
        {props => (
          <GetStartedScreen
            {...props}
            onGetStarted={() => props.navigation.replace('Login')}
            onSignup={() => props.navigation.navigate('Signup')}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Signup"         component={SignupScreen} />
      <Stack.Screen name="Login"          component={LoginScreen} />
      <Stack.Screen name="MainTabs"       component={BottomTabs} />
      <Stack.Screen name="DroneContact"   component={DroneContactScreen} />
      <Stack.Screen name="LanguageSelection" component={LanguageSelection} />
      <Stack.Screen name="Feedback"       component={FeedbackScreen} />
      <Stack.Screen name="PestResult"     component={PestResultScreen} />
      <Stack.Screen name="PestQuestionnaire" component={PestQuestionnaireScreen} />
      <Stack.Screen name="PPCInfo"        component={PPCInfoScreen} />
      <Stack.Screen name="PestDetail"     component={PestDetail} />
      <Stack.Screen name="CommunityScreen" component={CommunityScreen} />
      <Stack.Screen name="PestInfestationInfo" component={PestInfestationInfoScreen} />
      <Stack.Screen name="AdvisoryContact" component={AdvisoryContactScreen} />
      <Stack.Screen name="LatestTeaNews"  component={LatestTeaNewsScreen} />
      <Stack.Screen name="CameraScreen"   component={CameraScreen} />
      <Stack.Screen name="RecentOrders"   component={RecentOrdersScreen} />
      <Stack.Screen name="OrderTracking"  component={OrderTrackingScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="BecomeSeller"   component={BecomeSellerScreen} />
      <Stack.Screen name="EditProfile"    component={EditProfileScreen} />
      <Stack.Screen name="HelpSupport"    component={HelpSupportScreen} />
      <Stack.Screen name="AdminPanel"      component={AdminNavigator} />
    </Stack.Navigator>
  </NavigationContainer>
);

export default AppNavigator;
