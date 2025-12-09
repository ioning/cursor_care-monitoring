import React, { useEffect } from 'react';
import { StatusBar, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { store } from './store';
import { AppNavigator } from './navigation/AppNavigator';
import { NotificationService } from './services/NotificationService';
import { LocationService } from './services/LocationService';
import { BluetoothService } from './services/BluetoothService';

const App: React.FC = () => {
  useEffect(() => {
    // Initialize services
    NotificationService.initialize();
    LocationService.initialize();
    BluetoothService.initialize();

    return () => {
      // Cleanup
      LocationService.cleanup();
      BluetoothService.cleanup();
    };
  }, []);

  return (
    <Provider store={store}>
      <NavigationContainer>
        <StatusBar
          barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
          backgroundColor={Platform.OS === 'android' ? '#2196F3' : undefined}
        />
        <AppNavigator />
      </NavigationContainer>
    </Provider>
  );
};

export default App;