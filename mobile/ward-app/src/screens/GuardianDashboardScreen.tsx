import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl, Dimensions, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { colors, spacing, typography, radii, shadows } from '../theme/designSystem';
import { WardStatusService, WardStatus } from '../services/WardStatusService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const statusMap = {
  stable: { text: 'Стабильно', color: colors.success },
  attention: { text: 'Нужно внимание', color: colors.warning },
  alert: { text: 'Тревога', color: colors.danger },
};

/**
 * Преобразует цвет в hex формат для маркеров на карте
 */
// Функция больше не нужна, так как используем кастомные маркеры

const DEFAULT_REGION = {
  latitude: 55.751244,
  longitude: 37.618423,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
};

const GuardianDashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const [wards, setWards] = useState<WardStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getInitialRegion = () => {
    const withLocation = wards.filter((w) => w.location);
    if (withLocation.length === 0) return DEFAULT_REGION;

    const latitudes = withLocation.map((w) => w.location!.latitude);
    const longitudes = withLocation.map((w) => w.location!.longitude);

    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    const midLat = (minLat + maxLat) / 2;
    const midLng = (minLng + maxLng) / 2;

    const latDelta = Math.max(0.01, (maxLat - minLat) * 1.8);
    const lngDelta = Math.max(0.01, (maxLng - minLng) * 1.8);

    return {
      latitude: midLat,
      longitude: midLng,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    };
  };

  const handleMarkerPress = (wardId: string) => {
    navigation.navigate('WardDetail' as never, { wardId } as never);
  };

  const loadWards = async () => {
    try {
      const wardsStatus = await WardStatusService.getWardsStatus();
      setWards(wardsStatus);
    } catch (error) {
      console.error('Failed to load wards:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadWards();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadWards();
  };

  const handleWardPress = (wardId: string) => {
    navigation.navigate('WardDetail' as never, { wardId } as never);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Загрузка данных...</Text>
      </View>
    );
  }

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
        {wards.length > 0 && wards.some(w => w.location) ? (
          <MapView
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            style={styles.map}
            initialRegion={getInitialRegion()}
            showsUserLocation={false}
            showsMyLocationButton={false}
            mapType="standard"
          >
            {wards.map((ward) => {
              if (!ward.location) return null;
              
              const statusConfig = statusMap[ward.status] ?? statusMap.stable;
              
              return (
                <Marker
                  key={ward.wardId}
                  coordinate={{
                    latitude: ward.location.latitude,
                    longitude: ward.location.longitude,
                  }}
                  title={ward.fullName}
                  description={`${statusConfig.text} • ${ward.lastSeen}`}
                  onPress={() => handleMarkerPress(ward.wardId)}
                >
                  <View style={styles.markerContainer}>
                    <View style={[styles.markerDot, { backgroundColor: statusConfig.color }]} />
                    <View style={[styles.markerPulse, { backgroundColor: statusConfig.color }]} />
                  </View>
                </Marker>
              );
            })}
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            <Icon name="map" size={64} color={colors.textMuted} />
            <Text style={styles.mapText}>Нет данных о местоположении</Text>
            <Text style={styles.mapHint}>Местоположение подопечных появится здесь</Text>
          </View>
        )}
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
        <TouchableOpacity onPress={() => navigation.navigate('Wards' as never)}>
          <Text style={styles.link}>Открыть список</Text>
        </TouchableOpacity>
      </View>

      {wards.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="people-outline" size={64} color={colors.textMuted} />
          <Text style={styles.emptyText}>Нет подопечных</Text>
          <Text style={styles.emptyHint}>Добавьте подопечного, чтобы начать мониторинг</Text>
        </View>
      ) : (
        <FlatList
          data={wards}
          keyExtractor={(item) => item.wardId}
          renderItem={({ item }: { item: WardStatus }) => {
            const statusConfig = statusMap[item.status] ?? statusMap.stable;
            const locationText = item.location?.address 
              ? item.location.address 
              : item.location 
              ? `${item.location.latitude.toFixed(4)}, ${item.location.longitude.toFixed(4)}`
              : 'Местоположение неизвестно';
            
            return (
              <TouchableOpacity
                style={[styles.wardCard, shadows.card]}
                onPress={() => handleWardPress(item.wardId)}
                activeOpacity={0.7}
              >
                <View style={styles.wardContent}>
                  <Text style={styles.wardName}>{item.fullName}</Text>
                  <Text style={styles.wardLocation}>{locationText}</Text>
                </View>
                <View style={styles.wardMeta}>
                  <View style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}>
                    <Text style={styles.statusText}>{statusConfig.text}</Text>
                  </View>
                  <Text style={styles.lastSeen}>{item.lastSeen}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          contentContainerStyle={{ paddingBottom: spacing.xl }}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
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
  map: {
    width: '100%',
    height: 220,
    borderRadius: radii.md,
    marginBottom: spacing.md,
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
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  markerDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 2,
  },
  markerPulse: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    opacity: 0.3,
    zIndex: 1,
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
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.body,
    color: colors.textMuted,
  },
  wardContent: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: typography.subtitle,
    fontWeight: '600',
    color: colors.text,
  },
  emptyHint: {
    marginTop: spacing.sm,
    fontSize: typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});

export default GuardianDashboardScreen;


