import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { checkAuth } from '../store/slices/authSlice';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Screens
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import SOSScreen from '../screens/SOSScreen';
import AlertsScreen from '../screens/AlertsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import GuardianWardsScreen from '../screens/GuardianWardsScreen';
import GuardianWardDetailScreen from '../screens/GuardianWardDetailScreen';
import CreateWardScreen from '../screens/CreateWardScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const WardMainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'Dashboard') {
            iconName = 'dashboard';
          } else if (route.name === 'SOS') {
            iconName = 'emergency';
          } else if (route.name === 'Alerts') {
            iconName = 'notifications';
          } else if (route.name === 'Settings') {
            iconName = 'settings';
          } else {
            iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen 
        name="SOS" 
        component={SOSScreen}
        options={{
          tabBarBadge: undefined,
        }}
      />
      <Tab.Screen 
        name="Alerts" 
        component={AlertsScreen}
        options={({ route }) => ({
          tabBarBadge: undefined, // Will be set dynamically
        })}
      />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

const GuardianMainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'Wards') {
            iconName = 'people';
          } else if (route.name === 'Alerts') {
            iconName = 'notifications';
          } else if (route.name === 'Settings') {
            iconName = 'settings';
          } else {
            iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
      })}
    >
      <Tab.Screen name="Wards" component={GuardianWardsScreen} />
      <Tab.Screen 
        name="Alerts" 
        component={AlertsScreen}
        options={({ route }) => ({
          tabBarBadge: undefined, // Will be set dynamically
        })}
      />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, isLoading, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  if (isLoading) {
    // Show loading screen
    return null;
  }

  const isGuardian = user?.role === 'guardian';

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen 
            name="Main" 
            component={isGuardian ? GuardianMainTabs : WardMainTabs} 
          />
          {isGuardian && (
            <>
              <Stack.Screen 
                name="WardDetail" 
                component={GuardianWardDetailScreen}
                options={{ headerShown: true, title: 'Детали подопечного' }}
              />
              <Stack.Screen 
                name="CreateWard" 
                component={CreateWardScreen}
                options={{ headerShown: true, title: 'Добавить подопечного' }}
              />
            </>
          )}
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
};

