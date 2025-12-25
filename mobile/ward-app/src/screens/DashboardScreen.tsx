import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { RootState } from '../store';
import { fetchDevices, autoConnectDevices } from '../store/slices/deviceSlice';
import { CallService } from '../services/CallService';
import { colors, spacing, typography, radii, shadows, getStatusColor } from '../theme/designSystem';

type MetricConfig = {
  key: string;
  label: string;
  icon: string;
  unit?: string;
  formatter?: (value: number) => string;
  thresholds: {
    safe: [number, number];
    caution: [number, number];
  };
};

const metricConfig: MetricConfig[] = [
  {
    key: 'heart_rate',
    label: 'Пульс',
    icon: 'favorite',
    unit: 'уд/мин',
    thresholds: {
      safe: [55, 95],
      caution: [95, 110],
    },
  },
  {
    key: 'temperature',
    label: 'Температура',
    icon: 'device-thermostat',
    unit: '°C',
    thresholds: {
      safe: [35.8, 37.2],
      caution: [37.2, 38],
    },
  },
  {
    key: 'steps',
    label: 'Активность',
    icon: 'directions-walk',
    unit: 'шагов',
    thresholds: {
      safe: [4000, 10000],
      caution: [2000, 3999],
    },
    formatter: (value: number) => value.toLocaleString('ru-RU'),
  },
];

const determineStatus = (value: number | null, config: MetricConfig) => {
  if (value === null || Number.isNaN(value)) {
    return { tone: 'caution' as const, text: 'Нет данных' };
  }

  const within = (range: [number, number]) => value >= range[0] && value <= range[1];

  if (within(config.thresholds.safe)) {
    return { tone: 'safe' as const, text: 'Стабильно' };
  }

  if (within(config.thresholds.caution)) {
    return { tone: 'caution' as const, text: 'Нужно внимание' };
  }

  return { tone: 'alert' as const, text: 'Требует действий' };
};

const DashboardScreen: React.FC = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { user } = useSelector((state: RootState) => state.auth);
  const { connectedDevice } = useSelector((state: RootState) => state.device);
  const { latest } = useSelector((state: RootState) => state.telemetry);
  const { currentLocation } = useSelector((state: RootState) => state.location);
  const [isCalling, setIsCalling] = useState(false);

  useEffect(() => {
    // Загружаем устройства и автоматически подключаемся
    const loadAndConnect = async () => {
      await dispatch(fetchDevices());
      // Автоматически подключаемся к устройствам с серийными номерами
      await dispatch(autoConnectDevices());
    };
    loadAndConnect();
  }, [dispatch]);

  const metrics = useMemo(() => {
    return metricConfig.map((config) => {
      const rawValue = latest[config.key]?.value;
      const numeric = rawValue !== undefined ? Number(rawValue) : null;
      const status = determineStatus(numeric, config);
      const formatted =
        numeric === null || Number.isNaN(numeric)
          ? '--'
          : config.formatter
          ? config.formatter(numeric)
          : `${numeric}`;

      return {
        ...config,
        value: formatted,
        tone: status.tone,
        statusText: status.text,
      };
    });
  }, [latest]);

  const connectionLabel = connectedDevice
    ? `Браслет ${connectedDevice.name}`
    : 'Браслет не подключён';

  const connectionStatus = connectedDevice ? 'Онлайн' : 'Нет связи';

  const handleCallDispatcher = async () => {
    setIsCalling(true);
    try {
      const call = await CallService.createCall({
        callType: 'assistance',
        priority: 'medium',
        source: 'mobile_app',
        location: currentLocation
          ? {
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              accuracy: currentLocation.accuracy,
            }
          : undefined,
      });
      Alert.alert('Успешно', 'Ваш запрос отправлен диспетчеру. Ожидайте звонка.', [{ text: 'OK' }]);
    } catch (error: any) {
      console.error('Failed to create call:', error);
      Alert.alert('Ошибка', error.message || 'Не удалось связаться с диспетчером. Попробуйте еще раз.');
    } finally {
      setIsCalling(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <Text style={styles.heroGreeting}>Здравствуйте,</Text>
          <Text style={styles.heroName}>{user?.fullName || 'подопечный'}</Text>
          <Text style={styles.heroSubtitle}>
            Система следит за вашим состоянием и готова к экстренной помощи
          </Text>

          <View style={styles.heroStatusRow}>
            <View style={styles.heroStatusBadge}>
              <Icon name="watch" color={colors.primary} size={24} />
              <View style={styles.heroStatusText}>
                <Text style={styles.badgeCaption}>{connectionLabel}</Text>
                <Text style={styles.badgeValue}>{connectionStatus}</Text>
              </View>
            </View>
            <View style={styles.heroStatusBadge}>
              <Icon name="battery-full" color={colors.success} size={24} />
              <View style={styles.heroStatusText}>
                <Text style={styles.badgeCaption}>Заряд</Text>
                <Text style={styles.badgeValue}>
                  {connectedDevice ? '82%' : '—'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Простое самочувствие</Text>
            <Text style={styles.sectionHint}>Цвет подскажет, всё ли в порядке</Text>
          </View>
          <View style={styles.metricsGrid}>
            {metrics.map((metric) => (
              <View key={metric.key} style={[styles.metricCard, shadows.card]}>
                <View style={styles.metricIconWrapper}>
                  <Icon name={metric.icon} size={32} color={getStatusColor(metric.tone)} />
                </View>
                <Text style={styles.metricValue}>{metric.value}</Text>
                <Text style={styles.metricLabel}>{metric.label}{metric.unit ? `, ${metric.unit}` : ''}</Text>
                <View style={[styles.metricStatusBadge, { backgroundColor: getStatusColor(metric.tone) }]}>
                  <Text style={styles.metricStatusText}>{metric.statusText}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Быстрые действия</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: colors.accent }]}
              accessibilityRole="button"
              onPress={() => navigation.navigate('SOS' as never)}
            >
              <Icon name="emergency" size={28} color="#fff" />
              <Text style={styles.quickActionText}>Экстренный SOS</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: colors.primary }, isCalling && styles.quickActionButtonDisabled]}
              onPress={handleCallDispatcher}
              disabled={isCalling}
              activeOpacity={0.85}
            >
              {isCalling ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Icon name="call" size={28} color="#fff" />
              )}
              <Text style={styles.quickActionText}>
                {isCalling ? 'Соединение...' : 'Позвонить диспетчеру'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Где вы находитесь</Text>
          <View style={[styles.locationCard, shadows.card]}>
            <Icon name="my-location" size={24} color={colors.primary} />
            {currentLocation ? (
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Точное местоположение</Text>
                <Text style={styles.locationValue}>
                  {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
                </Text>
              </View>
            ) : (
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Ожидаем координаты</Text>
                <Text style={styles.locationValue}>Включите GPS, чтобы система видела вас</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing.xl,
  },
  heroCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.soft,
  },
  heroGreeting: {
    fontSize: typography.subtitle,
    color: colors.textMuted,
  },
  heroName: {
    fontSize: typography.hero,
    fontWeight: '700',
    color: colors.text,
    marginVertical: spacing.xs,
  },
  heroSubtitle: {
    fontSize: typography.body,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  heroStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  heroStatusBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  heroStatusText: {
    marginLeft: spacing.sm,
  },
  badgeCaption: {
    fontSize: typography.caption,
    color: colors.textMuted,
  },
  badgeValue: {
    fontSize: typography.subtitle,
    fontWeight: '600',
    color: colors.text,
  },
  section: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.card,
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.text,
  },
  sectionHint: {
    fontSize: typography.body,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    borderRadius: radii.lg,
    backgroundColor: colors.background,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  metricIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: radii.circle,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  metricValue: {
    fontSize: typography.hero,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.sm,
  },
  metricLabel: {
    fontSize: typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  metricStatusBadge: {
    marginTop: spacing.md,
    borderRadius: radii.circle,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    alignSelf: 'flex-start',
  },
  metricStatusText: {
    color: '#fff',
    fontSize: typography.caption,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'column',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  quickActionButton: {
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  quickActionText: {
    color: '#fff',
    fontSize: typography.subtitle,
    fontWeight: '700',
  },
  quickActionButtonDisabled: {
    opacity: 0.6,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  locationValue: {
    fontSize: typography.subtitle,
    fontWeight: '600',
    color: colors.text,
  },
});

export default DashboardScreen;

