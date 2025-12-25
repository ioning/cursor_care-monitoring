import PushNotification from 'react-native-push-notification';
import { Platform } from 'react-native';
import { NavigationContainerRef } from '@react-navigation/native';
import { store } from '../store';
import { addAlert } from '../store/slices/alertSlice';
import { apiClient } from './ApiClient';

interface PushToken {
  token: string;
  platform: 'ios' | 'android';
}

class NotificationServiceClass {
  private isInitialized = false;
  private pushToken: string | null = null;
  private navigationRef: React.RefObject<NavigationContainerRef<any>> | null = null;

  async initialize(navRef?: React.RefObject<NavigationContainerRef<any>>) {
    if (this.isInitialized) return;
    this.navigationRef = navRef || null;

    PushNotification.configure({
      onRegister: async (token) => {
        console.log('Push notification token:', token);
        this.pushToken = token.token;

        // Отправляем токен на backend
        try {
          await this.registerToken({
            token: token.token,
            platform: Platform.OS as 'ios' | 'android',
          });
        } catch (error) {
          console.error('Failed to register push token:', error);
        }
      },
      onNotification: (notification) => {
        console.log('Notification received:', notification);

        // Обрабатываем разные типы уведомлений
        if (notification.data?.type === 'alert' && notification.data?.alert) {
          // Добавляем алерт в store
          store.dispatch(addAlert(notification.data.alert));
        }

        if (notification.data?.type === 'call' && notification.data?.callId) {
          // Обрабатываем входящий звонок - навигация к экрану звонка
          this.navigateToIncomingCall(notification.data.callId);
        }

        if (notification.userInteraction) {
          // Пользователь нажал на уведомление
          if (notification.data?.type === 'call' && notification.data?.callId) {
            this.navigateToIncomingCall(notification.data.callId);
          }
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

    // Создаем каналы для Android
    if (Platform.OS === 'android') {
      // Канал для критических алертов
      PushNotification.createChannel(
        {
          channelId: 'care-monitoring-alerts',
          channelName: 'Алерты здоровья',
          channelDescription: 'Критические уведомления о состоянии здоровья',
          playSound: true,
          soundName: 'default',
          importance: 5, // Max importance
          vibrate: true,
        },
        (created) => console.log(`Alert channel created: ${created}`)
      );

      // Канал для обычных уведомлений
      PushNotification.createChannel(
        {
          channelId: 'care-monitoring-general',
          channelName: 'Общие уведомления',
          channelDescription: 'Общие уведомления приложения',
          playSound: true,
          soundName: 'default',
          importance: 4,
          vibrate: true,
        },
        (created) => console.log(`General channel created: ${created}`)
      );

      // Канал для вызовов с максимальным приоритетом
      PushNotification.createChannel(
        {
          channelId: 'care-monitoring-calls',
          channelName: 'Экстренные вызовы',
          channelDescription: 'Уведомления о входящих экстренных вызовах',
          playSound: true,
          soundName: 'default',
          importance: 5, // Max importance - показывает поверх всех окон
          vibrate: true,
          // Для Android 8.0+ - показывать поверх всех окон
          channelShowBadge: true,
        },
        (created) => console.log(`Call channel created: ${created}`)
      );
    }

    this.isInitialized = true;
  }

  /**
   * Регистрация токена на backend
   */
  private async registerToken(tokenData: PushToken): Promise<void> {
    try {
      await apiClient.instance.post('/integration/notifications/devices', {
        token: tokenData.token,
        platform: tokenData.platform,
        deviceType: 'mobile',
      });
    } catch (error) {
      console.error('Failed to register push token on backend:', error);
      throw error;
    }
  }

  /**
   * Отменить регистрацию токена на backend
   */
  async unregisterToken(): Promise<void> {
    if (!this.pushToken) return;

    try {
      await apiClient.instance.delete('/integration/notifications/devices', {
        data: { token: this.pushToken },
      });
      this.pushToken = null;
    } catch (error) {
      console.error('Failed to unregister push token:', error);
    }
  }

  /**
   * Показать локальное уведомление
   */
  showLocalNotification(
    title: string,
    message: string,
    data?: any,
    channelId: string = 'care-monitoring-general'
  ) {
    PushNotification.localNotification({
      channelId: Platform.OS === 'android' ? channelId : undefined,
      title,
      message,
      data,
      playSound: true,
      soundName: 'default',
      priority: 'high',
      importance: 'high',
    });
  }

  /**
   * Показать уведомление о критическом алерте
   */
  showAlertNotification(alert: any) {
    this.showLocalNotification(
      'Новый алерт',
      alert.message || 'Требуется ваше внимание',
      { type: 'alert', alert },
      'care-monitoring-alerts'
    );
  }

  /**
   * Показать уведомление о входящем звонке с максимальным приоритетом
   */
  showCallNotification(call: any, priorityOverlay: boolean = true) {
    PushNotification.localNotification({
      channelId: Platform.OS === 'android' ? 'care-monitoring-calls' : undefined,
      title: 'Входящий вызов',
      message: `Новый экстренный вызов от ${call.source || 'системы'}`,
      data: { type: 'call', callId: call.id },
      playSound: true,
      soundName: 'default',
      priority: 'max', // Максимальный приоритет
      importance: 'high',
      // Для Android - показывать поверх всех окон
      ongoing: priorityOverlay, // Нельзя смахнуть
      autoCancel: false, // Не удаляется автоматически
      // Для показа поверх всех окон
      ...(Platform.OS === 'android' && priorityOverlay && {
        // Дополнительные настройки для Android
        userInfo: { priority: 'max' },
      }),
    });
  }

  /**
   * Отменить все уведомления
   */
  cancelAll() {
    PushNotification.cancelAllLocalNotifications();
  }

  /**
   * Отменить уведомление по ID
   */
  cancelNotification(notificationId: string) {
    PushNotification.cancelLocalNotifications({ id: notificationId });
  }

  /**
   * Получить количество непрочитанных уведомлений
   */
  async getBadgeCount(): Promise<number> {
    return new Promise((resolve) => {
      PushNotification.getDeliveredNotifications((notifications) => {
        resolve(notifications.length);
      });
    });
  }

  /**
   * Установить badge count
   */
  setBadgeCount(count: number) {
    PushNotification.setApplicationIconBadgeNumber(count);
  }

  /**
   * Навигация к экрану входящего звонка
   */
  private navigateToIncomingCall(callId: string) {
    if (this.navigationRef?.current?.isReady()) {
      this.navigationRef.current.navigate('IncomingCall' as never, { callId } as never);
    } else {
      // Если навигация еще не готова, ждем немного и пробуем снова
      setTimeout(() => {
        if (this.navigationRef?.current?.isReady()) {
          this.navigationRef.current.navigate('IncomingCall' as never, { callId } as never);
        }
      }, 500);
    }
  }
}

export const NotificationService = new NotificationServiceClass();
