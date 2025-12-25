import { Platform, Linking, Alert } from 'react-native';
import { check, request, PERMISSIONS, RESULTS, openSettings } from 'react-native-permissions';

/**
 * Запросить разрешение на отображение поверх всех окон (SYSTEM_ALERT_WINDOW)
 * Требуется для приоритетных звонков
 */
export async function requestOverlayPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true; // iOS не требует этого разрешения
  }

  try {
    // Проверяем текущее состояние разрешения
    const result = await check(PERMISSIONS.ANDROID.SYSTEM_ALERT_WINDOW);

    if (result === RESULTS.GRANTED) {
      return true;
    }

    if (result === RESULTS.DENIED) {
      // Запрашиваем разрешение
      // Примечание: SYSTEM_ALERT_WINDOW требует ручного разрешения в настройках
      const requestResult = await request(PERMISSIONS.ANDROID.SYSTEM_ALERT_WINDOW);
      
      if (requestResult === RESULTS.GRANTED) {
        return true;
      }

      // Если разрешение не предоставлено, показываем диалог с инструкциями
      Alert.alert(
        'Разрешение на отображение поверх окон',
        'Для приоритетных звонков требуется разрешение на отображение поверх всех окон. Нажмите "Настройки" и включите разрешение для этого приложения.',
        [
          {
            text: 'Отмена',
            style: 'cancel',
            onPress: () => {},
          },
          {
            text: 'Настройки',
            onPress: async () => {
              // Открываем настройки приложения
              await openSettings();
            },
          },
        ]
      );

      return false;
    }

    // Если разрешение заблокировано, открываем настройки
    if (result === RESULTS.BLOCKED) {
      Alert.alert(
        'Разрешение заблокировано',
        'Разрешение на отображение поверх окон заблокировано. Пожалуйста, включите его в настройках приложения.',
        [
          {
            text: 'Отмена',
            style: 'cancel',
            onPress: () => {},
          },
          {
            text: 'Настройки',
            onPress: async () => {
              await openSettings();
            },
          },
        ]
      );
      return false;
    }

    return false;
  } catch (error) {
    console.error('Failed to request overlay permission:', error);
    return false;
  }
}

/**
 * Проверить, есть ли разрешение на отображение поверх всех окон
 */
export async function checkOverlayPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    const result = await check(PERMISSIONS.ANDROID.SYSTEM_ALERT_WINDOW);
    return result === RESULTS.GRANTED;
  } catch (error) {
    console.error('Failed to check overlay permission:', error);
    return false;
  }
}

