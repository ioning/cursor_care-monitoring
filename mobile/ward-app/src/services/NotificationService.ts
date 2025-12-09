import PushNotification from 'react-native-push-notification';
import { Platform } from 'react-native';
import { store } from '../store';
import { addAlert } from '../store/slices/alertSlice';

class NotificationService {
  private isInitialized = false;

  initialize() {
    if (this.isInitialized) return;

    PushNotification.configure({
      onRegister: function (token) {
        console.log('TOKEN:', token);
        // Send token to backend
      },
      onNotification: function (notification) {
        console.log('NOTIFICATION:', notification);

        if (notification.data?.alert) {
          store.dispatch(addAlert(notification.data.alert));
        }

        if (notification.userInteraction) {
          // User tapped notification
        }
      },
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios',
    });

    // Create default channel for Android
    PushNotification.createChannel(
      {
        channelId: 'care-monitoring',
        channelName: 'Care Monitoring',
        channelDescription: 'Notifications for health alerts',
        playSound: true,
        soundName: 'default',
        importance: 4,
        vibrate: true,
      },
      (created) => console.log(`Channel created: ${created}`)
    );

    this.isInitialized = true;
  }

  showLocalNotification(title: string, message: string, data?: any) {
    PushNotification.localNotification({
      channelId: 'care-monitoring',
      title,
      message,
      data,
      playSound: true,
      soundName: 'default',
    });
  }

  cancelAll() {
    PushNotification.cancelAllLocalNotifications();
  }
}

export const NotificationService = new NotificationService();

