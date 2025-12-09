import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { colors, spacing, typography, radii, shadows } from '../theme/designSystem';

const mockWards = [
  {
    id: 'w1',
    name: 'Анна Иванова',
    status: 'stable',
    lastSeen: '2 мин назад',
    location: 'Петроградская, 10',
  },
  {
    id: 'w2',
    name: 'Иван Петров',
    status: 'alert',
    lastSeen: '35 мин назад',
    location: 'Парк Победы',
  },
  {
    id: 'w3',
    name: 'Мария Лебедева',
    status: 'attention',
    lastSeen: 'онлайн',
    location: 'Дом, этаж 3',
  },
];

const statusMap = {
  stable: { text: 'Стабильно', color: colors.success },
  attention: { text: 'Нужно внимание', color: colors.warning },
  alert: { text: 'Тревога', color: colors.danger },
};

const GuardianDashboardScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Дашборд</Text>
          <Text style={styles.subtitle}>Карта подопечных и актуальные события</Text>
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Icon name="tune" size={20} color={colors.primary} />
          <Text style={styles.filterText}>Фильтры</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.mapCard, shadows.card]}>
        <View style={styles.mapPlaceholder}>
          <Icon name="map" size={64} color={colors.textMuted} />
          <Text style={styles.mapText}>Здесь будет карта с пинами</Text>
          <Text style={styles.mapHint}>Подключите react-native-maps и данные местоположения</Text>
        </View>
        <View style={styles.mapLegend}>
          {Object.entries(statusMap).map(([key, props]) => (
            <View key={key} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: props.color }]} />
              <Text style={styles.legendLabel}>{props.text}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Подопечные</Text>
        <TouchableOpacity>
          <Text style={styles.link}>Открыть список</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={mockWards}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const statusConfig = statusMap[item.status as keyof typeof statusMap] ?? statusMap.stable;
          return (
            <View style={[styles.wardCard, shadows.card]}>
              <View>
                <Text style={styles.wardName}>{item.name}</Text>
                <Text style={styles.wardLocation}>{item.location}</Text>
              </View>
              <View style={styles.wardMeta}>
                <View style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}>
                  <Text style={styles.statusText}>{statusConfig.text}</Text>
                </View>
                <Text style={styles.lastSeen}>{item.lastSeen}</Text>
              </View>
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.hero,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.body,
    color: colors.textMuted,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radii.circle,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  filterText: {
    color: colors.primary,
    fontWeight: '600',
  },
  mapCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  mapPlaceholder: {
    backgroundColor: colors.background,
    borderRadius: radii.md,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.divider,
    marginBottom: spacing.md,
  },
  mapText: {
    fontSize: typography.subtitle,
    color: colors.text,
    marginTop: spacing.sm,
  },
  mapHint: {
    color: colors.textMuted,
    fontSize: typography.caption,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  mapLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: radii.circle,
  },
  legendLabel: {
    fontSize: typography.caption,
    color: colors.text,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.text,
  },
  link: {
    color: colors.primary,
    fontWeight: '600',
  },
  wardCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  wardName: {
    fontSize: typography.subtitle,
    fontWeight: '700',
    color: colors.text,
  },
  wardLocation: {
    fontSize: typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  wardMeta: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    borderRadius: radii.circle,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    marginBottom: spacing.xs,
  },
  statusText: {
    color: '#fff',
    fontSize: typography.caption,
    fontWeight: '600',
  },
  lastSeen: {
    fontSize: typography.caption,
    color: colors.textMuted,
  },
});

export default GuardianDashboardScreen;


