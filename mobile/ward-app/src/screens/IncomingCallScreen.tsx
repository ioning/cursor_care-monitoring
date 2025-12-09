import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Vibration } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { colors, spacing, typography, radii, shadows } from '../theme/designSystem';

const AUTO_ANSWER_SECONDS = 10;

export const IncomingCallScreen: React.FC = () => {
  const [remaining, setRemaining] = useState(AUTO_ANSWER_SECONDS);
  const intervalRef = useRef<NodeJS.Timeout>();

  const caller = useMemo(
    () => ({
      name: 'Диспетчер',
      role: 'Круглосуточная поддержка',
    }),
    [],
  );

  useEffect(() => {
    Vibration.vibrate([0, 400, 400], true);
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      Vibration.cancel();
    };
  }, []);

  useEffect(() => {
    if (remaining === 0 && intervalRef.current) {
      clearInterval(intervalRef.current);
      handleAnswer();
    }
  }, [remaining]);

  const handleAnswer = () => {
    Vibration.cancel();
    // TODO: integrate with CallService.accept();
  };

  const handleDecline = () => {
    Vibration.cancel();
    // TODO: integrate with CallService.decline();
  };

  return (
    <View style={styles.container}>
      <View style={styles.callerCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{caller.name.charAt(0)}</Text>
        </View>
        <Text style={styles.callerName}>{caller.name}</Text>
        <Text style={styles.callerRole}>{caller.role}</Text>
        <View style={styles.timerBadge}>
          <Icon name="access-time" size={18} color={colors.accent} />
          <Text style={styles.timerText}>
            Автоответ через {remaining} c
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.declineButton]}
          onPress={handleDecline}
          activeOpacity={0.85}
        >
          <Icon name="call-end" size={36} color="#fff" />
          <Text style={styles.actionLabel}>Отклонить</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.answerButton]}
          onPress={handleAnswer}
          activeOpacity={0.85}
        >
          <Icon name="call" size={36} color="#fff" />
          <Text style={styles.actionLabel}>Ответить</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.helperText}>
        <Text style={styles.helperLabel}>Нажмите «Ответить», чтобы связаться с диспетчером.</Text>
        <Text style={styles.helperLabel}>
          Если вы ничего не сделаете, звонок автоматически примется.
        </Text>
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
});

export default IncomingCallScreen;


