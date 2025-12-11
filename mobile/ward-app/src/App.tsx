import React, { useEffect } from 'react';
import { StatusBar, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { store } from './store';
import { AppNavigator } from './navigation/AppNavigator';
import { NotificationService } from './services/NotificationService';
import { LocationService } from './services/LocationService';
import { BluetoothService } from './services/BluetoothService';
import { OfflineService } from './services/OfflineService';

const App: React.FC = () => {
  useEffect(() => {
    // Initialize services
    OfflineService.initialize();
    NotificationService.initialize();
    LocationService.initialize();
    BluetoothService.initialize();

    // Очищаем просроченный кэш при старте
    OfflineService.clearExpiredCache();

    return () => {
      // Cleanup
      LocationService.cleanup();
      BluetoothService.cleanup();
      NotificationService.unregisterToken();
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