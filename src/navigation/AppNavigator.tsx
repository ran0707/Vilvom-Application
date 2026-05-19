import React, { useEffect, useRef } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
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
import ForgotPasswordScreen      from '../screens/ForgotPasswordScreen';
import BecomeSellerScreen        from '../screens/BecomeSellerScreen';
import EditProfileScreen         from '../screens/EditProfileScreen';
import AdminNavigator            from './AdminNavigator';

const Stack = createStackNavigator();

// Splash screen that handles auth check + navigation itself
const SplashEntry = ({ navigation }: any) => {
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const start = Date.now();
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          const delay = Math.max(2000 - (Date.now() - start), 0);
          setTimeout(() => { if (!cancelled) navigation.replace('GetStarted'); }, delay);
          return;
        }
        const userDataStr = await AsyncStorage.getItem('userData');
        const userData = userDataStr ? JSON.parse(userDataStr) : null;
        const dest  = userData?.isAdmin ? 'AdminPanel' : 'MainTabs';
        const delay = Math.max(2000 - (Date.now() - start), 0);
        setTimeout(() => { if (!cancelled) navigation.replace(dest); }, delay);
      } catch {
        setTimeout(() => {
          if (!cancelled) navigation.replace('GetStarted');
        }, 2000);
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
      screenOptions={{ headerShown: false, animationEnabled: false }}
    >
      <Stack.Screen name="Splash"    component={SplashEntry} />
      <Stack.Screen name="GetStarted">
        {props => (
          <GetStartedScreen
            {...props}
            onGetStarted={() => props.navigation.replace('Signup')}
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
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="BecomeSeller"   component={BecomeSellerScreen} />
      <Stack.Screen name="EditProfile"    component={EditProfileScreen} />
      <Stack.Screen name="AdminPanel"      component={AdminNavigator} />
    </Stack.Navigator>
  </NavigationContainer>
);

export default AppNavigator;
