import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

import { AppDispatch, RootState } from '../store';
import { fetchAlerts, markAsRead } from '../store/slices/alertSlice';
import { colors, spacing, typography, radii, shadows } from '../theme/designSystem';

type FilterKey = 'all' | 'critical' | 'unread';

const severityConfig = {
  critical: { color: colors.danger, icon: 'error' },
  high: { color: colors.warning, icon: 'warning' },
  medium: { color: colors.info, icon: 'info' },
  low: { color: colors.primary, icon: 'notifications' },
};

const AlertsScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { alerts, isLoading } = useSelector((state: RootState) => state.alert);
  const [filter, setFilter] = useState<FilterKey>('all');

  useEffect(() => {
    dispatch(fetchAlerts());
  }, [dispatch]);

  const filteredAlerts = useMemo(() => {
    if (filter === 'all') return alerts;
    if (filter === 'critical') {
      return alerts.filter((alert) => alert.severity === 'critical' || alert.severity === 'high');
    }
    if (filter === 'unread') {
      return alerts.filter((alert) => !alert.isRead);
    }
    return alerts;
  }, [alerts, filter]);

  const handleAlertPress = (alertId: string) => {
    dispatch(markAsRead(alertId));
  };

  const renderAlert = ({ item }: { item: any }) => {
    const severity = severityConfig[item.severity as keyof typeof severityConfig] || severityConfig.low;
    return (
      <TouchableOpacity
        style={[styles.alertCard, shadows.card]}
        onPress={() => handleAlertPress(item.id)}
        activeOpacity={0.85}
      >
        <View style={[styles.severityIcon, { backgroundColor: severity.color }]}>
          <Icon name={severity.icon} size={28} color="#fff" />
        </View>
        <View style={styles.alertContent}>
          <View style={styles.alertHeader}>
            <Text style={styles.alertTitle}>{item.title}</Text>
            {!item.isRead && <Text style={styles.unreadBadge}>Новые</Text>}
          </View>
          <Text style={styles.alertDescription}>{item.description}</Text>
          <View style={styles.alertMeta}>
            <Text style={styles.alertTime}>
              {format(new Date(item.createdAt), 'dd MMM yyyy, HH:mm', { locale: ru })}
            </Text>
            <Text style={styles.alertAiScore}>AI достоверность: {item.aiConfidence ?? '—'}%</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const filters: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'Все' },
    { key: 'critical', label: 'Критические' },
    { key: 'unread', label: 'Непрочитанные' },
  ];

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
  const newCount = alerts.filter((a) => !a.isRead).length;

  return (
    <View style={styles.container}>
      <View style={styles.summaryCard}>
        <View>
          <Text style={styles.summaryLabel}>Всего уведомлений</Text>
          <Text style={styles.summaryValue}>{alerts.length}</Text>
        </View>
        <View>
          <Text style={styles.summaryLabel}>Критические</Text>
          <Text style={styles.summaryValue}>{criticalCount}</Text>
        </View>
        <View>
          <Text style={styles.summaryLabel}>Новые</Text>
          <Text style={styles.summaryValue}>{newCount}</Text>
        </View>
      </View>

      <View style={styles.filtersRow}>
        {filters.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[
              styles.filterChip,
              filter === item.key && styles.filterChipActive,
            ]}
            onPress={() => setFilter(item.key)}
          >
            <Text
              style={[
                styles.filterChipText,
                filter === item.key && styles.filterChipTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredAlerts.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name='notifications-active' size={64} color={colors.textMuted} />
          <Text style={styles.emptyText}>Здесь появятся оповещения</Text>
        </View>
      ) : (
        <FlatList
          data={filteredAlerts}
          renderItem={renderAlert}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: spacing.md }}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={() => dispatch(fetchAlerts())} />
          }
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
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.lg,
    marginTop: spacing.lg,
    ...shadows.card,
  },
  summaryLabel: {
    fontSize: typography.caption,
    color: colors.textMuted,
  },
  summaryValue: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.text,
  },
  filtersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  filterChip: {
    flex: 1,
    marginHorizontal: spacing.xs,
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
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '700',
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
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertTitle: {
    fontSize: typography.subtitle,
    fontWeight: '700',
    color: colors.text,
  },
  unreadBadge: {
    backgroundColor: colors.accent,
    color: '#fff',
    fontSize: typography.tiny,
    fontWeight: '700',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: radii.circle,
  },
  alertDescription: {
    fontSize: typography.body,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  alertMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  alertTime: {
    fontSize: typography.caption,
    color: colors.textMuted,
  },
  alertAiScore: {
    fontSize: typography.caption,
    color: colors.text,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: typography.subtitle,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

export default AlertsScreen;

