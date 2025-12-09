import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Vibration,
  Animated,
} from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { RootState } from '../store';
import { apiClient } from '../services/ApiClient';
import { colors, spacing, typography, radii, shadows } from '../theme/designSystem';

const HOLD_SECONDS = 5;

const SOSScreen: React.FC = () => {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [message, setMessage] = useState('Нажмите и удерживайте кнопку 5 секунд');
  const [isSending, setIsSending] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animation = useRef(new Animated.Value(0)).current;

  const { currentLocation } = useSelector((state: RootState) => state.location);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(animation, { toValue: 1, duration: 1600, useNativeDriver: true }),
        Animated.timing(animation, { toValue: 0, duration: 1600, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [animation]);

  const resetCountdown = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setCountdown(null);
    Vibration.cancel();
  };

  const sendSOS = async () => {
    try {
      setIsSending(true);
      setMessage('Отправляем сигнал, оставайтесь на линии…');
      await apiClient.instance.post('/dispatcher/calls', {
        callType: 'emergency',
        priority: 'critical',
        source: 'mobile_app',
        location: currentLocation
          ? {
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }
          : null,
      });
      setMessage('Сигнал принят. Помощь уже в пути.');
    } catch (error) {
      setMessage('Не удалось отправить сигнал. Попробуйте ещё раз или позвоните диспетчеру.');
    } finally {
      setIsSending(false);
    }
  };

  const startHold = () => {
    if (isSending) {
      return;
    }
    setCountdown(HOLD_SECONDS);
    setMessage('Держите кнопку. Отмена — отпустите палец.');
    Vibration.vibrate([0, 500, 300], true);

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null) {
          return null;
        }
        if (prev <= 1) {
          resetCountdown();
          sendSOS();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelHold = () => {
    if (isSending) {
      return;
    }
    resetCountdown();
    setMessage('Нажмите и удерживайте кнопку 5 секунд');
  };

  const animatedScale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  const animatedOpacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25, 0],
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Экстренный вызов</Text>
      <Text style={styles.subtitle}>
        Удерживайте кнопку, чтобы автоматически отправить сигнал диспетчеру.
      </Text>

      <View style={styles.sosWrapper}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.pulseCircle,
            {
              transform: [{ scale: animatedScale }],
              opacity: animatedOpacity,
            },
          ]}
        />
        <Pressable
          onPressIn={startHold}
          onPressOut={cancelHold}
          style={({ pressed }) => [
            styles.sosButton,
            pressed && !isSending ? styles.sosButtonPressed : null,
          ]}
          accessibilityRole="button"
          accessibilityHint="Удерживайте 5 секунд, чтобы вызвать помощь"
        >
          {isSending ? (
            <Icon name="sync" size={48} color="#fff" />
          ) : (
            <Text style={styles.sosText}>SOS</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.statusBlock}>
        <View style={styles.statusRow}>
          <Icon name="campaign" size={24} color={colors.accent} />
          <Text style={styles.statusMessage}>{message}</Text>
        </View>
        {countdown !== null && !isSending && (
          <Text style={styles.countdown}>До отправки: {countdown} с</Text>
        )}
      </View>

      <View style={styles.infoCard}>
        <Icon name="location-on" size={24} color={colors.primary} />
        <View style={styles.infoTextGroup}>
          <Text style={styles.infoLabel}>Местоположение</Text>
          <Text style={styles.infoValue}>
            {currentLocation
              ? `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`
              : 'Ожидаем GPS сигнал'}
          </Text>
        </View>
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
    alignItems: 'center',
  },
  title: {
    fontSize: typography.hero,
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.body,
    color: '#D0D5DD',
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  sosWrapper: {
    marginVertical: spacing.lg,
    width: 260,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseCircle: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: colors.accent,
  },
  sosButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.soft,
  },
  sosButtonPressed: {
    transform: [{ scale: 0.96 }],
  },
  sosText: {
    fontSize: 56,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 4,
  },
  statusBlock: {
    backgroundColor: '#1F2937',
    borderRadius: radii.lg,
    padding: spacing.lg,
    width: '100%',
    ...shadows.card,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusMessage: {
    color: '#fff',
    fontSize: typography.subtitle,
    flex: 1,
  },
  countdown: {
    marginTop: spacing.sm,
    color: '#FEDF89',
    fontSize: typography.subtitle,
    fontWeight: '700',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginTop: spacing.xl,
    width: '100%',
  },
  infoTextGroup: {
    flex: 1,
  },
  infoLabel: {
    fontSize: typography.caption,
    color: colors.textMuted,
  },
  infoValue: {
    fontSize: typography.subtitle,
    fontWeight: '600',
    color: colors.text,
  },
});

export default SOSScreen;

