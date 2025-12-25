import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

import { AlertService, Alert as AlertDto } from '../services/AlertService';
import { colors, spacing, typography, radii, shadows } from '../theme/designSystem';

type FilterKey = 'all' | 'critical';

const severityConfig: Record<string, { color: string; icon: string }> = {
  critical: { color: colors.danger, icon: 'error' },
  high: { color: colors.warning, icon: 'warning' },
  medium: { color: colors.info, icon: 'info' },
  low: { color: colors.primary, icon: 'notifications' },
};

const WardAlertsScreen: React.FC = () => {
  const route = useRoute();
  const wardId = (route.params as any)?.wardId as string | undefined;

  const [alerts, setAlerts] = useState<AlertDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!wardId) {
      setError('Не указан wardId');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const list = await AlertService.getAlerts({ wardId });
      setAlerts(list);
    } catch (e: any) {
      setError(e?.message || 'Не удалось загрузить алерты');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wardId]);

  const filtered = useMemo(() => {
    if (filter === 'all') return alerts;
    return alerts.filter((a) => a.severity === 'critical' || a.severity === 'high');
  }, [alerts, filter]);

  const renderItem = ({ item }: { item: AlertDto }) => {
    const severity = severityConfig[item.severity] || severityConfig.low;
    const createdAt = item.createdAt ? new Date(item.createdAt) : null;

    return (
      <View style={[styles.alertCard, shadows.card]}>
        <View style={[styles.severityIcon, { backgroundColor: severity.color }]}>
          <Icon name={severity.icon} size={28} color="#fff" />
        </View>
        <View style={styles.alertContent}>
          <Text style={styles.alertTitle}>{item.title || 'Алерт'}</Text>
          <Text style={styles.alertDescription}>{item.description || ''}</Text>
          <View style={styles.alertMeta}>
            <Text style={styles.alertTime}>
              {createdAt ? format(createdAt, 'dd MMM yyyy, HH:mm', { locale: ru }) : '—'}
            </Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.severity || 'low'}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const filters: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'Все' },
    { key: 'critical', label: 'Критические' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.filtersRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterChipText, filter === f.key && styles.filterChipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {error ? (
        <View style={styles.emptyState}>
          <Icon name="error-outline" size={56} color={colors.textMuted} />
          <Text style={styles.emptyText}>{error}</Text>
        </View>
      ) : filtered.length === 0 && !isLoading ? (
        <View style={styles.emptyState}>
          <Icon name="notifications-none" size={56} color={colors.textMuted} />
          <Text style={styles.emptyText}>Алертов нет</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: spacing.md }}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  filterChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.circle,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: typography.body,
    color: colors.textMuted,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  severityIcon: {
    width: 56,
    height: 56,
    borderRadius: radii.circle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: typography.subtitle,
    fontWeight: '700',
    color: colors.text,
  },
  alertDescription: {
    fontSize: typography.body,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  alertMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  alertTime: {
    fontSize: typography.caption,
    color: colors.textMuted,
  },
  badge: {
    backgroundColor: colors.background,
    borderRadius: radii.circle,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  badgeText: {
    fontSize: typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: typography.subtitle,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

export default WardAlertsScreen;


