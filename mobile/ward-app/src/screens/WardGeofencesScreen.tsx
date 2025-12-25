import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl, Switch } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { GeofenceService, Geofence } from '../services/GeofenceService';
import { colors, spacing, typography, radii, shadows } from '../theme/designSystem';

const WardGeofencesScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const wardId = (route.params as any)?.wardId as string | undefined;

  const [items, setItems] = useState<Geofence[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = async () => {
    if (!wardId) return;
    setIsLoading(true);
    try {
      const list = await GeofenceService.loadGeofences(wardId); // backend returns all by default
      setItems(list);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wardId]);

  const enabledCount = useMemo(() => items.filter((g) => g.enabled).length, [items]);

  const confirmDelete = (geofenceId: string) => {
    Alert.alert('Удалить геозону?', 'Действие необратимо', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            await GeofenceService.deleteGeofence(geofenceId);
            setItems((prev) => prev.filter((g) => g.id !== geofenceId));
          } catch (e: any) {
            Alert.alert('Ошибка', e?.message || 'Не удалось удалить геозону');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Geofence }) => {
    const subtitle =
      item.shape === 'circle' && item.radius != null
        ? `Круг • ${Math.round(item.radius)} м`
        : item.shape === 'polygon'
        ? `Полигон • ${item.polygonPoints?.length ?? 0} точек`
        : '—';

    const typeLabel = item.type === 'restricted_zone' ? 'Запретная' : 'Безопасная';

    return (
      <View style={[styles.card, shadows.card]}>
        <View style={styles.cardLeft}>
          <View style={[styles.iconBadge, { backgroundColor: item.enabled ? colors.success : colors.textMuted }]}>
            <Icon name="my-location" size={22} color="#fff" />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardSubtitle}>{typeLabel} • {subtitle}</Text>
          </View>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity
            onPress={() => navigation.navigate('EditGeofence' as never, { geofenceId: item.id, wardId } as never)}
            style={styles.actionButton}
            activeOpacity={0.8}
          >
            <Icon name="edit" size={20} color={colors.primary} />
          </TouchableOpacity>
          <Switch
            value={item.enabled}
            onValueChange={async (value) => {
              try {
                setItems((prev) => prev.map((g) => (g.id === item.id ? { ...g, enabled: value } : g)));
                await GeofenceService.updateGeofence(item.id, { enabled: value });
              } catch (e: any) {
                // rollback
                setItems((prev) => prev.map((g) => (g.id === item.id ? { ...g, enabled: !value } : g)));
                Alert.alert('Ошибка', e?.message || 'Не удалось обновить геозону');
              }
            }}
            trackColor={{ false: '#ccc', true: colors.primary }}
          />
          <TouchableOpacity onPress={() => confirmDelete(item.id)} style={styles.actionButton} activeOpacity={0.8}>
            <Icon name="delete" size={22} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.headerCard, shadows.card]}>
        <View style={styles.headerLeft}>
          <Icon name="shield" size={22} color={colors.primary} />
          <View>
            <Text style={styles.headerTitle}>Геозоны</Text>
            <Text style={styles.headerSubtitle}>Активных: {enabledCount}</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('GeofenceViolations' as never, { wardId } as never)}
            activeOpacity={0.85}
          >
            <Icon name="history" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('CreateGeofence' as never, { wardId } as never)}
            activeOpacity={0.85}
          >
            <Icon name="add" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {items.length === 0 && !isLoading ? (
        <View style={styles.emptyState}>
          <Icon name="location-off" size={64} color={colors.textMuted} />
          <Text style={styles.emptyText}>Геозон пока нет</Text>
          <TouchableOpacity
            style={styles.primaryAction}
            onPress={() => navigation.navigate('CreateGeofence' as never, { wardId } as never)}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryActionText}>Создать геозону</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(it) => it.id}
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
  headerCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.subtitle,
    fontWeight: '700',
    color: colors.text,
  },
  headerSubtitle: {
    marginTop: spacing.xs,
    fontSize: typography.caption,
    color: colors.textMuted,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: radii.circle,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  primaryAction: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  primaryActionText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: typography.subtitle,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: radii.circle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: typography.subtitle,
    fontWeight: '700',
    color: colors.text,
  },
  cardSubtitle: {
    marginTop: spacing.xs,
    fontSize: typography.caption,
    color: colors.textMuted,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionButton: {
    padding: spacing.sm,
  },
  trash: {
    padding: spacing.sm,
  },
});

export default WardGeofencesScreen;


