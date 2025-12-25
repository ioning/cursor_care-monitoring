import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import MapView, { Marker, Circle, Polygon, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { LocationService as ApiLocationService } from '../services/ApiLocationService';
import { GeofenceService, Geofence } from '../services/GeofenceService';
import { colors, spacing, typography, radii, shadows } from '../theme/designSystem';

type LatestLocation = {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
  timestamp?: string;
  createdAt?: string;
};

const WardLocationScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const wardId = (route.params as any)?.wardId as string | undefined;

  const [location, setLocation] = useState<LatestLocation | null>(null);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGeofences, setIsLoadingGeofences] = useState(false);

  const load = async () => {
    if (!wardId) {
      Alert.alert('Ошибка', 'Не указан wardId', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      return;
    }
    setIsLoading(true);
    try {
      const resp = await ApiLocationService.getLatestLocation(wardId);
      const data = (resp as any)?.data ?? resp;
      setLocation(data || null);
    } catch (e: any) {
      Alert.alert('Ошибка', e?.message || 'Не удалось получить местоположение');
    } finally {
      setIsLoading(false);
    }
  };

  const loadGeofences = async () => {
    if (!wardId) return;
    setIsLoadingGeofences(true);
    try {
      const list = await GeofenceService.loadGeofences(wardId);
      setGeofences(list);
    } catch (e: any) {
      console.error('Failed to load geofences:', e);
    } finally {
      setIsLoadingGeofences(false);
    }
  };

  useEffect(() => {
    load();
    loadGeofences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wardId]);

  const region: Region | null = useMemo(() => {
    if (!location) {
      // Если нет локации, но есть геозоны, центрируем на них
      if (geofences.length > 0) {
        const firstGeofence = geofences[0];
        if (firstGeofence.shape === 'circle' && firstGeofence.centerLatitude != null && firstGeofence.centerLongitude != null) {
          return {
            latitude: firstGeofence.centerLatitude,
            longitude: firstGeofence.centerLongitude,
            latitudeDelta: 0.03,
            longitudeDelta: 0.03,
          };
        }
      }
      return null;
    }
    return {
      latitude: Number(location.latitude),
      longitude: Number(location.longitude),
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }, [location, geofences]);

  const lastUpdate = location?.timestamp || location?.createdAt;

  return (
    <View style={styles.container}>
      <View style={[styles.headerCard, shadows.card]}>
        <View style={styles.headerLeft}>
          <Icon name="location-on" size={24} color={colors.primary} />
          <View style={styles.headerText}>
            <Text style={styles.title}>Последняя точка</Text>
            <Text style={styles.subtitle}>
              {lastUpdate ? `Обновлено: ${new Date(lastUpdate).toLocaleString('ru-RU')}` : 'Нет данных'}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={load} disabled={isLoading} activeOpacity={0.8}>
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Icon name="refresh" size={22} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.quickActionButton, shadows.card]}
          onPress={() => navigation.navigate('WardGeofences' as never, { wardId } as never)}
          activeOpacity={0.85}
        >
          <Icon name="shield" size={20} color={colors.primary} />
          <Text style={styles.quickActionText}>Геозоны</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickActionButton, shadows.card]}
          onPress={() => navigation.navigate('GeofenceViolations' as never, { wardId } as never)}
          activeOpacity={0.85}
        >
          <Icon name="history" size={20} color={colors.primary} />
          <Text style={styles.quickActionText}>Нарушения</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.mapCard, shadows.card]}>
        {region ? (
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={region}
            showsUserLocation={false}
            showsMyLocationButton={false}
          >
            {location && (
              <Marker
                coordinate={{ latitude: region.latitude, longitude: region.longitude }}
                title="Подопечный"
                description={location?.address || `${region.latitude.toFixed(4)}, ${region.longitude.toFixed(4)}`}
              />
            )}
            {geofences.map((geofence) => {
              const zoneColor = geofence.type === 'safe_zone' ? colors.success : colors.danger;
              if (geofence.shape === 'circle' && geofence.centerLatitude != null && geofence.centerLongitude != null && geofence.radius != null) {
                return (
                  <Circle
                    key={geofence.id}
                    center={{ latitude: geofence.centerLatitude, longitude: geofence.centerLongitude }}
                    radius={geofence.radius}
                    strokeColor={zoneColor}
                    fillColor={geofence.type === 'safe_zone' ? 'rgba(76, 175, 80, 0.15)' : 'rgba(244, 67, 54, 0.15)'}
                    strokeWidth={2}
                  />
                );
              } else if (geofence.shape === 'polygon' && geofence.polygonPoints && geofence.polygonPoints.length >= 3) {
                return (
                  <Polygon
                    key={geofence.id}
                    coordinates={geofence.polygonPoints}
                    strokeColor={zoneColor}
                    fillColor={geofence.type === 'safe_zone' ? 'rgba(76, 175, 80, 0.15)' : 'rgba(244, 67, 54, 0.15)'}
                    strokeWidth={2}
                  />
                );
              }
              return null;
            })}
          </MapView>
        ) : (
          <View style={styles.emptyMap}>
            <Icon name="map" size={64} color={colors.textMuted} />
            <Text style={styles.emptyText}>Местоположение отсутствует</Text>
            <Text style={styles.emptyHint}>Подопечный появится на карте после отправки координат</Text>
          </View>
        )}
      </View>

      {location?.address ? (
        <View style={[styles.addressCard, shadows.card]}>
          <Icon name="place" size={20} color={colors.textMuted} />
          <Text style={styles.addressText}>{location.address}</Text>
        </View>
      ) : null}
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
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  headerText: {
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
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: radii.circle,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  quickActionText: {
    fontSize: typography.subtitle,
    fontWeight: '700',
    color: colors.primary,
  },
  map: {
    flex: 1,
  },
  emptyMap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
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
  },
  addressCard: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  addressText: {
    flex: 1,
    fontSize: typography.body,
    color: colors.text,
  },
});

export default WardLocationScreen;


