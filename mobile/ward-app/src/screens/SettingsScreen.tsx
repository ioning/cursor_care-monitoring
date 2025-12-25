import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { logout } from '../store/slices/authSlice';
import { setTracking } from '../store/slices/locationSlice';
import {
  setPriorityCallOverlay,
  setAutoAnswerCalls,
  setDefaultSpeakerMode,
  setAutoAnswerDelay,
  setCallVibration,
  setCallSound,
  setUseBluetoothForCalls,
  loadSettings,
  loadSettingsFromStorage,
} from '../store/slices/settingsSlice';
import { requestOverlayPermission, checkOverlayPermission } from '../utils/permissions';
import Icon from 'react-native-vector-icons/MaterialIcons';

const SettingsScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { isTracking } = useSelector((state: RootState) => state.location);
  const settings = useSelector((state: RootState) => state.settings);
  const [hasOverlayPermission, setHasOverlayPermission] = useState(true);

  // Загружаем настройки при монтировании
  useEffect(() => {
    const loadSettingsAsync = async () => {
      if (!settings.isLoaded) {
        const savedSettings = await loadSettingsFromStorage();
        dispatch(loadSettings(savedSettings));
      }
    };
    loadSettingsAsync();

    // Проверяем разрешение на отображение поверх всех окон
    if (Platform.OS === 'android') {
      checkOverlayPermission().then(setHasOverlayPermission);
    }
  }, [dispatch, settings.isLoaded]);

  const handleLogout = () => {
    Alert.alert('Выход', 'Вы уверены, что хотите выйти?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Выйти',
        style: 'destructive',
        onPress: () => dispatch(logout()),
      },
    ]);
  };

  const handleLocationToggle = (value: boolean) => {
    dispatch(setTracking(value));
    // Start/stop location tracking
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Профиль</Text>
        <View style={styles.profileCard}>
          <Icon name="account-circle" size={60} color="#2196F3" />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.fullName || 'Пользователь'}</Text>
            <Text style={styles.profileEmail}>{user?.email || ''}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Настройки</Text>
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Icon name="location-on" size={24} color="#2196F3" />
            <Text style={styles.settingLabel}>Отслеживание местоположения</Text>
          </View>
          <Switch
            value={isTracking}
            onValueChange={handleLocationToggle}
            trackColor={{ false: '#ccc', true: '#2196F3' }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Звонки</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Icon name="phone-in-talk" size={24} color="#2196F3" />
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Приоритетный вызов поверх всего</Text>
              <Text style={styles.settingDescription}>
                Звонки отображаются поверх всех окон
              </Text>
              {Platform.OS === 'android' && !hasOverlayPermission && (
                <Text style={styles.warningText}>
                  ⚠️ Требуется разрешение в настройках
                </Text>
              )}
            </View>
          </View>
          <Switch
            value={settings.priorityCallOverlay && hasOverlayPermission}
            onValueChange={async (value) => {
              if (value && Platform.OS === 'android' && !hasOverlayPermission) {
                // Запрашиваем разрешение
                const granted = await requestOverlayPermission();
                if (granted) {
                  setHasOverlayPermission(true);
                  dispatch(setPriorityCallOverlay(true));
                } else {
                  // Проверяем еще раз после возврата из настроек
                  setTimeout(async () => {
                    const hasPermission = await checkOverlayPermission();
                    setHasOverlayPermission(hasPermission);
                    if (hasPermission) {
                      dispatch(setPriorityCallOverlay(true));
                    }
                  }, 1000);
                }
              } else {
                dispatch(setPriorityCallOverlay(value));
              }
            }}
            trackColor={{ false: '#ccc', true: '#2196F3' }}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Icon name="volume-up" size={24} color="#2196F3" />
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Громкая связь по умолчанию</Text>
              <Text style={styles.settingDescription}>
                Автоматически включать громкую связь на браслете
              </Text>
            </View>
          </View>
          <Switch
            value={settings.defaultSpeakerMode}
            onValueChange={(value) => dispatch(setDefaultSpeakerMode(value))}
            trackColor={{ false: '#ccc', true: '#2196F3' }}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Icon name="bluetooth" size={24} color="#2196F3" />
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Использовать Bluetooth</Text>
              <Text style={styles.settingDescription}>
                Использовать Bluetooth гарнитуру для звонков
              </Text>
            </View>
          </View>
          <Switch
            value={settings.useBluetoothForCalls}
            onValueChange={(value) => dispatch(setUseBluetoothForCalls(value))}
            trackColor={{ false: '#ccc', true: '#2196F3' }}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Icon name="vibration" size={24} color="#2196F3" />
            <Text style={styles.settingLabel}>Вибрация при звонке</Text>
          </View>
          <Switch
            value={settings.callVibration}
            onValueChange={(value) => dispatch(setCallVibration(value))}
            trackColor={{ false: '#ccc', true: '#2196F3' }}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Icon name="volume-up" size={24} color="#2196F3" />
            <Text style={styles.settingLabel}>Звук при звонке</Text>
          </View>
          <Switch
            value={settings.callSound}
            onValueChange={(value) => dispatch(setCallSound(value))}
            trackColor={{ false: '#ccc', true: '#2196F3' }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>О приложении</Text>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Версия 0.1.0</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Политика конфиденциальности</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Условия использования</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Icon name="exit-to-app" size={24} color="#f44336" />
        <Text style={styles.logoutText}>Выйти</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    margin: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: 15,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
  settingTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  menuItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuText: {
    fontSize: 16,
    color: '#333',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f44336',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f44336',
    marginLeft: 10,
  },
  warningText: {
    fontSize: 12,
    color: '#f44336',
    marginTop: 4,
    fontStyle: 'italic',
  },
});

export default SettingsScreen;

