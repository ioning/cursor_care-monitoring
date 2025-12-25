import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  // Приоритетный вызов поверх всего
  priorityCallOverlay: boolean;
  // Автоматический ответ на звонки
  autoAnswerCalls: boolean;
  // Громкая связь по умолчанию
  defaultSpeakerMode: boolean;
  // Время автоответа (секунды)
  autoAnswerDelay: number;
  // Вибрация при звонке
  callVibration: boolean;
  // Звук при звонке
  callSound: boolean;
  // Использовать Bluetooth для звонков
  useBluetoothForCalls: boolean;
  // Загружены ли настройки
  isLoaded: boolean;
}

const initialState: SettingsState = {
  priorityCallOverlay: true, // По умолчанию включено
  autoAnswerCalls: false,
  defaultSpeakerMode: true, // По умолчанию громкая связь
  autoAnswerDelay: 4,
  callVibration: true,
  callSound: true,
  useBluetoothForCalls: true,
  isLoaded: false,
};

const SETTINGS_STORAGE_KEY = '@care_monitoring:settings';

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setPriorityCallOverlay: (state, action: PayloadAction<boolean>) => {
      state.priorityCallOverlay = action.payload;
      saveSettings(state);
    },
    setAutoAnswerCalls: (state, action: PayloadAction<boolean>) => {
      state.autoAnswerCalls = action.payload;
      saveSettings(state);
    },
    setDefaultSpeakerMode: (state, action: PayloadAction<boolean>) => {
      state.defaultSpeakerMode = action.payload;
      saveSettings(state);
    },
    setAutoAnswerDelay: (state, action: PayloadAction<number>) => {
      state.autoAnswerDelay = action.payload;
      saveSettings(state);
    },
    setCallVibration: (state, action: PayloadAction<boolean>) => {
      state.callVibration = action.payload;
      saveSettings(state);
    },
    setCallSound: (state, action: PayloadAction<boolean>) => {
      state.callSound = action.payload;
      saveSettings(state);
    },
    setUseBluetoothForCalls: (state, action: PayloadAction<boolean>) => {
      state.useBluetoothForCalls = action.payload;
      saveSettings(state);
    },
    loadSettings: (state, action: PayloadAction<Partial<SettingsState>>) => {
      return {
        ...state,
        ...action.payload,
        isLoaded: true,
      };
    },
  },
});

// Сохранение настроек в AsyncStorage
async function saveSettings(settings: SettingsState) {
  try {
    await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

// Загрузка настроек из AsyncStorage
export async function loadSettingsFromStorage(): Promise<Partial<SettingsState>> {
  try {
    const data = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  return {};
}

export const {
  setPriorityCallOverlay,
  setAutoAnswerCalls,
  setDefaultSpeakerMode,
  setAutoAnswerDelay,
  setCallVibration,
  setCallSound,
  setUseBluetoothForCalls,
  loadSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;

