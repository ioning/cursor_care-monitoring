import React, { useEffect, useRef } from 'react';
import { StatusBar, Platform } from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { store } from './store';
import { AppNavigator } from './navigation/AppNavigator';
import { NotificationService } from './services/NotificationService';
import { LocationService } from './services/LocationService';
import { BluetoothService } from './services/BluetoothService';
import { OfflineService } from './services/OfflineService';
import { AudioService } from './services/AudioService';
import { loadSettings, loadSettingsFromStorage } from './store/slices/settingsSlice';

export const navigationRef = React.createRef<NavigationContainerRef<any>>();

const App: React.FC = () => {
  useEffect(() => {
    // Загружаем настройки при старте
    const initializeSettings = async () => {
      const savedSettings = await loadSettingsFromStorage();
      store.dispatch(loadSettings(savedSettings));
    };
    initializeSettings();

    // Initialize services with navigation ref
    OfflineService.initialize();
    NotificationService.initialize(navigationRef);
    LocationService.initialize();
    BluetoothService.initialize();
    AudioService.initialize();

    // Очищаем просроченный кэш при старте
    OfflineService.clearExpiredCache();

    return () => {
      // Cleanup
      LocationService.cleanup();
      BluetoothService.cleanup();
      AudioService.cleanup();
      NotificationService.unregisterToken();
    };
  }, []);

  return (
    <Provider store={store}>
      <NavigationContainer ref={navigationRef}>
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