import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createStackNavigator } from '@react-navigation/stack';
import { isAuthenticated } from '../services/authApi';
import SplashScreen from '../screens/SplashScreen';
import GetStartedScreen from '../screens/GetStartedScreen';
import SignupScreen from '../screens/SignupScreen';
import LoginScreen from '../screens/LoginScreen';
import BottomTabs from './BottomTabs';
import DroneContactScreen from '../screens/DroneContactScreen';
import PestResultScreen from '../screens/PestResultScreen';
import PestQuestionnaireScreen from '../screens/PestQuestionnaireScreen';
import LanguageSelection from '../screens/LanguageSelection';
import FeedbackScreen from '../screens/FeedbackScreen';
import NotificationService from '../services/notificationService';
import PestDetail from '../screens/PestDetail';
import PPCInfoScreen from '../screens/PPCInfoScreen';
import CommunityScreen from '../screens/CommunityScreen';
import PestInfestationInfoScreen from '../screens/PestInfestationInfoScreen';
import CameraScreen from '../screens/CameraScreen';
import AdvisoryContactScreen from '../screens/AdvisoryContactScreen';
import LatestTeaNewsScreen from '../screens/LatestTeaNewsScreen';
import RecentOrdersScreen from '../screens/RecentOrdersScreen';
import OrderTrackingScreen from '../screens/OrderTrackingScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import BecomeSellerScreen from '../screens/BecomeSellerScreen';
import EditProfileScreen from '../screens/EditProfileScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [initialRoute, setInitialRoute] = useState<
    'GetStarted' | 'Signup' | 'MainTabs'
  >('GetStarted');

  useEffect(() => {
    let mounted = true;
    (async () => {
      const start = Date.now();
      try {
        // determine initial route: authenticated -> MainTabs, else GetStarted
        const auth = await isAuthenticated();
        if (auth) {
          if (mounted) setInitialRoute('MainTabs');
        }
      } catch (e) {
        // ignore and default to GetStarted
      }
      const elapsed = Date.now() - start;
      const remaining = Math.max(2000 - elapsed, 0);
      setTimeout(() => {
        if (mounted) setShowSplash(false);
      }, remaining);

      // Notifications will be requested from the HomeTab when user arrives there.
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <NavigationContainer>
        {showSplash ? (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Splash" component={SplashScreen} />
          </Stack.Navigator>
        ) : (
          <Stack.Navigator
            initialRouteName={initialRoute}
            screenOptions={{ headerShown: false }}
          >
            <Stack.Screen name="GetStarted">
              {props => (
                <GetStartedScreen
                  {...props}
                  onGetStarted={() => props.navigation.replace('Signup')}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="MainTabs" component={BottomTabs} />
            <Stack.Screen name="DroneContact" component={DroneContactScreen} />
            <Stack.Screen
              name="LanguageSelection"
              component={LanguageSelection}
            />
            <Stack.Screen name="Feedback" component={FeedbackScreen} />
            <Stack.Screen name="PestResult" component={PestResultScreen} />
            <Stack.Screen
              name="PestQuestionnaire"
              component={PestQuestionnaireScreen}
            />
            <Stack.Screen name="PPCInfo" component={PPCInfoScreen} />
            <Stack.Screen name="PestDetail" component={PestDetail} />
            <Stack.Screen name="CommunityScreen" component={CommunityScreen} />
            <Stack.Screen
              name="PestInfestationInfo"
              component={PestInfestationInfoScreen}
            />
            <Stack.Screen
              name="AdvisoryContact"
              component={AdvisoryContactScreen}
            />
            <Stack.Screen
              name="LatestTeaNews"
              component={LatestTeaNewsScreen}
            />
            <Stack.Screen name="CameraScreen" component={CameraScreen} />
            <Stack.Screen name="RecentOrders" component={RecentOrdersScreen} />
            <Stack.Screen
              name="OrderTracking"
              component={OrderTrackingScreen}
            />
            <Stack.Screen
              name="ChangePassword"
              component={ChangePasswordScreen}
            />
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
            />
            <Stack.Screen name="BecomeSeller" component={BecomeSellerScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          </Stack.Navigator>
        )}
      </NavigationContainer>
    </SafeAreaView>
  );
};
export default AppNavigator;
