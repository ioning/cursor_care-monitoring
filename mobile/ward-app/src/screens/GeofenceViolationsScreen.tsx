import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { GeofenceService, GeofenceViolation } from '../services/GeofenceService';
import { colors, spacing, typography, radii, shadows } from '../theme/designSystem';

const GeofenceViolationsScreen: React.FC = () => {
  const route = useRoute();
  const wardId = (route.params as any)?.wardId as string | undefined;

  const [items, setItems] = useState<GeofenceViolation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = async () => {
    if (!wardId) return;
    setIsLoading(true);
    try {
      const list = await GeofenceService.getViolations(wardId, 50);
      setItems(list);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wardId]);

  const renderItem = ({ item }: { item: GeofenceViolation }) => {
    const icon = item.violationType === 'exit' ? 'logout' : 'login';
    const label = item.violationType === 'exit' ? 'Выход' : 'Вход';

    return (
      <View style={[styles.card, shadows.card]}>
        <View style={styles.left}>
          <View style={[styles.iconBadge, { backgroundColor: item.violationType === 'exit' ? colors.danger : colors.success }]}>
            <Icon name={icon} size={20} color="#fff" />
          </View>
          <View style={styles.text}>
            <Text style={styles.title}>{label}</Text>
            <Text style={styles.subtitle}>
              {new Date(item.timestamp).toLocaleString('ru-RU')}
            </Text>
          </View>
        </View>
        <Text style={styles.coords}>
          {item.location.latitude.toFixed(4)}, {item.location.longitude.toFixed(4)}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {items.length === 0 && !isLoading ? (
        <View style={styles.emptyState}>
          <Icon name="history" size={64} color={colors.textMuted} />
          <Text style={styles.emptyText}>Нарушений пока нет</Text>
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: radii.circle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
  },
  title: {
    fontSize: typography.subtitle,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: typography.caption,
    color: colors.textMuted,
  },
  coords: {
    fontSize: typography.caption,
    color: colors.textMuted,
  },
});

export default GeofenceViolationsScreen;


