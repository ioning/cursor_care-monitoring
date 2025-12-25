import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Vibration, Alert, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import Icon from 'react-native-vector-icons/MaterialIcons';
import InCallManager from 'react-native-incall-manager';

import { colors, spacing, typography, radii, shadows } from '../theme/designSystem';
import { CallService } from '../services/CallService';
import { AudioService } from '../services/AudioService';
import { BluetoothService } from '../services/BluetoothService';

const AUTO_ANSWER_SECONDS = 4;

export const IncomingCallScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const callId = (route.params as any)?.callId;
  const settings = useSelector((state: RootState) => state.settings);
  const [remaining, setRemaining] = useState(settings.autoAnswerDelay || AUTO_ANSWER_SECONDS);
  const [isProcessing, setIsProcessing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const caller = useMemo(
    () => ({
      name: 'Диспетчер',
      role: 'Круглосуточная поддержка',
    }),
    [],
  );

  useEffect(() => {
    if (!callId) {
      Alert.alert('Ошибка', 'ID звонка не указан', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
      return;
    }

    // Устанавливаем приоритетный вызов поверх всего
    if (settings.priorityCallOverlay) {
      // Для Android: устанавливаем флаг системного окна
      if (Platform.OS === 'android') {
        InCallManager.setKeepScreenOn(true);
        // Устанавливаем максимальный приоритет для уведомления
        InCallManager.start({ media: 'audio' });
      }
    }

    // Вибрация, если включена в настройках
    if (settings.callVibration) {
      Vibration.vibrate([0, 400, 400], true);
    }

    // Звук звонка, если включен в настройках
    if (settings.callSound) {
      // Звук будет воспроизводиться через уведомление
    }

    // Автоответ, если включен
    if (settings.autoAnswerCalls) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev: number) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      Vibration.cancel();
      if (Platform.OS === 'android') {
        InCallManager.setKeepScreenOn(false);
      }
    };
  }, [callId, navigation, settings]);

  const handleAnswer = useCallback(async () => {
    if (isProcessing || !callId) return;

    setIsProcessing(true);
    Vibration.cancel();

    try {
      // Инициализируем аудио сессию для звонка
      await AudioService.initialize();

      // Включаем громкую связь, если включено в настройках
      if (settings.defaultSpeakerMode) {
        await AudioService.enableSpeaker();
      }

      // Используем Bluetooth, если включено в настройках
      if (settings.useBluetoothForCalls) {
        try {
          // Проверяем подключенные Bluetooth устройства
          const connectionStatus = BluetoothService.getConnectionStatus();
          if (connectionStatus.connected) {
            // Bluetooth устройство подключено - используем его для звонка
            console.log('[IncomingCall] Using Bluetooth device for call');
            // InCallManager автоматически использует Bluetooth, если доступен
          }
        } catch (bluetoothError) {
          console.warn('[IncomingCall] Bluetooth not available, using speaker:', bluetoothError);
          // Продолжаем с громкой связью
        }
      }
      
      // Принимаем звонок
      await CallService.accept(callId);
      
      // Показываем сообщение об успехе
      const message = settings.defaultSpeakerMode 
        ? 'Громкая связь включена' 
        : 'Звонок принят';
      Alert.alert('Звонок принят', message, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      console.error('Failed to accept call:', error);
      // Даже если что-то не удалось, пытаемся принять звонок
      try {
        await CallService.accept(callId);
        Alert.alert('Звонок принят', 'Некоторые настройки не применены', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } catch (acceptError: any) {
        Alert.alert('Ошибка', acceptError.message || 'Не удалось принять звонок');
      }
    } finally {
      setIsProcessing(false);
    }
  }, [callId, isProcessing, navigation, settings]);

  useEffect(() => {
    if (remaining === 0 && intervalRef.current && !isProcessing && settings.autoAnswerCalls) {
      clearInterval(intervalRef.current);
      handleAnswer();
    }
  }, [remaining, isProcessing, handleAnswer, settings.autoAnswerCalls]);

  const handleDecline = async () => {
    if (isProcessing || !callId) return;

    setIsProcessing(true);
    Vibration.cancel();

    try {
      await CallService.decline(callId, 'Отклонено пользователем');
      Alert.alert('Звонок отклонен', '', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось отклонить звонок');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.callerCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{caller.name.charAt(0)}</Text>
        </View>
        <Text style={styles.callerName}>{caller.name}</Text>
        <Text style={styles.callerRole}>{caller.role}</Text>
        {settings.autoAnswerCalls && (
          <View style={styles.timerBadge}>
            <Icon name="access-time" size={18} color={colors.accent} />
            <Text style={styles.timerText}>
              Автоответ через {remaining} c
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.declineButton, isProcessing && styles.disabledButton]}
          onPress={handleDecline}
          activeOpacity={0.85}
          disabled={isProcessing}
        >
          <Icon name="call-end" size={36} color="#fff" />
          <Text style={styles.actionLabel}>Отклонить</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.answerButton, isProcessing && styles.disabledButton]}
          onPress={handleAnswer}
          activeOpacity={0.85}
          disabled={isProcessing}
        >
          <Icon name="call" size={36} color="#fff" />
          <Text style={styles.actionLabel}>Ответить</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.helperText}>
        <Text style={styles.helperLabel}>Нажмите «Ответить», чтобы связаться с диспетчером.</Text>
        {settings.autoAnswerCalls && (
          <Text style={styles.helperLabel}>
            Если вы ничего не сделаете, звонок автоматически примется через {settings.autoAnswerDelay || AUTO_ANSWER_SECONDS} секунды{settings.defaultSpeakerMode ? ' с включением громкой связи' : ''}.
          </Text>
        )}
        {settings.defaultSpeakerMode && (
          <Text style={styles.helperLabel}>
            Громкая связь будет включена автоматически для использования браслета.
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    justifyContent: 'space-between',
  },
  callerCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    ...shadows.soft,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: radii.circle,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    color: '#fff',
    fontSize: 48,
    fontWeight: '700',
  },
  callerName: {
    fontSize: typography.hero,
    fontWeight: '700',
    color: colors.text,
  },
  callerRole: {
    fontSize: typography.body,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#FFF1F1',
    borderRadius: radii.circle,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginTop: spacing.md,
  },
  timerText: {
    color: colors.accent,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  declineButton: {
    backgroundColor: colors.danger,
  },
  answerButton: {
    backgroundColor: colors.success,
  },
  actionLabel: {
    color: '#fff',
    fontSize: typography.subtitle,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  helperText: {
    marginBottom: spacing.lg,
  },
  helperLabel: {
    color: '#CBD5F5',
    fontSize: typography.body,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default IncomingCallScreen;


