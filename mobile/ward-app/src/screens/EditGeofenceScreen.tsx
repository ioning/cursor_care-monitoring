import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import MapView, { Circle, Marker, Polygon, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { GeofenceService, Geofence } from '../services/GeofenceService';
import { colors, spacing, typography, radii, shadows } from '../theme/designSystem';

const EditGeofenceScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const geofenceId = (route.params as any)?.geofenceId as string | undefined;
  const wardId = (route.params as any)?.wardId as string | undefined;

  const [geofence, setGeofence] = useState<Geofence | null>(null);
  const [name, setName] = useState('');
  const [zoneType, setZoneType] = useState<'safe_zone' | 'restricted_zone'>('safe_zone');
  const [shape, setShape] = useState<'circle' | 'polygon'>('circle');
  const [radius, setRadius] = useState('200');
  const [center, setCenter] = useState({ latitude: 55.751244, longitude: 37.618423 });
  const [polygonPoints, setPolygonPoints] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);

  useEffect(() => {
    const loadGeofence = async () => {
      if (!geofenceId || !wardId) {
        Alert.alert('Ошибка', 'Не указан geofenceId или wardId', [{ text: 'OK', onPress: () => navigation.goBack() }]);
        return;
      }

      setIsLoading(true);
      try {
        const geofences = await GeofenceService.loadGeofences(wardId);
        const found = geofences.find((g) => g.id === geofenceId);
        if (!found) {
          Alert.alert('Ошибка', 'Геозона не найдена', [{ text: 'OK', onPress: () => navigation.goBack() }]);
          return;
        }

        setGeofence(found);
        setName(found.name);
        setZoneType(found.type as 'safe_zone' | 'restricted_zone');
        setShape(found.shape || 'circle');

        if (found.shape === 'circle' && found.centerLatitude != null && found.centerLongitude != null && found.radius != null) {
          setCenter({ latitude: found.centerLatitude, longitude: found.centerLongitude });
          setRadius(String(found.radius));
        } else if (found.shape === 'polygon' && found.polygonPoints) {
          setPolygonPoints([...found.polygonPoints]);
        }
      } catch (e: any) {
        Alert.alert('Ошибка', e?.message || 'Не удалось загрузить геозону');
      } finally {
        setIsLoading(false);
      }
    };

    loadGeofence();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geofenceId, wardId]);

  const parsedRadius = Math.max(50, Math.min(5000, Number(radius) || 200));

  const region: Region = useMemo(() => {
    if (shape === 'circle') {
      return {
        latitude: center.latitude,
        longitude: center.longitude,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      };
    } else if (polygonPoints.length > 0) {
      const lats = polygonPoints.map((p) => p.latitude);
      const lngs = polygonPoints.map((p) => p.longitude);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      return {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: Math.max(0.01, (maxLat - minLat) * 1.5),
        longitudeDelta: Math.max(0.01, (maxLng - minLng) * 1.5),
      };
    }
    return { latitude: 55.751244, longitude: 37.618423, latitudeDelta: 0.03, longitudeDelta: 0.03 };
  }, [center, polygonPoints, shape]);

  const save = async () => {
    if (!geofenceId || !wardId) {
      Alert.alert('Ошибка', 'Не указан geofenceId или wardId');
      return;
    }
    if (!name.trim()) {
      Alert.alert('Ошибка', 'Укажите название геозоны');
      return;
    }

    setIsSaving(true);
    try {
      if (shape === 'polygon' && polygonPoints.length < 3) {
        Alert.alert('Ошибка', 'Для полигона нужно минимум 3 точки');
        setIsSaving(false);
        return;
      }

      await GeofenceService.updateGeofence(geofenceId, {
        name: name.trim(),
        type: zoneType,
        shape,
        ...(shape === 'circle'
          ? {
              centerLatitude: center.latitude,
              centerLongitude: center.longitude,
              radius: parsedRadius,
            }
          : {
              polygonPoints,
            }),
      } as any);

      Alert.alert('Готово', 'Геозона обновлена', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e: any) {
      Alert.alert('Ошибка', e?.message || 'Не удалось обновить геозону');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMapPress = (e: any) => {
    const coord = e.nativeEvent.coordinate;
    if (shape === 'circle') {
      setCenter(coord);
    } else {
      setPolygonPoints((prev) => [...prev, coord]);
    }
  };

  const handleMarkerDragEnd = (index: number, e: any) => {
    const newCoord = e.nativeEvent.coordinate;
    setPolygonPoints((prev) => {
      const updated = [...prev];
      updated[index] = newCoord;
      return updated;
    });
  };

  const handleMarkerPress = (index: number) => {
    if (selectedPointIndex === index) {
      // Удаляем точку при повторном нажатии
      setPolygonPoints((prev) => prev.filter((_, i) => i !== index));
      setSelectedPointIndex(null);
    } else {
      setSelectedPointIndex(index);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Text style={styles.loadingText}>Загрузка геозоны...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.formCard, shadows.card]}>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, zoneType === 'safe_zone' && styles.toggleBtnActive]}
            onPress={() => setZoneType('safe_zone')}
            activeOpacity={0.85}
          >
            <Text style={[styles.toggleText, zoneType === 'safe_zone' && styles.toggleTextActive]}>Безопасная</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, zoneType === 'restricted_zone' && styles.toggleBtnActive]}
            onPress={() => setZoneType('restricted_zone')}
            activeOpacity={0.85}
          >
            <Text style={[styles.toggleText, zoneType === 'restricted_zone' && styles.toggleTextActive]}>Запретная</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.toggleRow, { marginTop: spacing.sm }]}>
          <TouchableOpacity
            style={[styles.toggleBtn, shape === 'circle' && styles.toggleBtnActive]}
            onPress={() => setShape('circle')}
            activeOpacity={0.85}
          >
            <Text style={[styles.toggleText, shape === 'circle' && styles.toggleTextActive]}>Круг</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, shape === 'polygon' && styles.toggleBtnActive]}
            onPress={() => setShape('polygon')}
            activeOpacity={0.85}
          >
            <Text style={[styles.toggleText, shape === 'polygon' && styles.toggleTextActive]}>Полигон</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Название</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Например: Дом, Поликлиника"
        />

        {shape === 'circle' ? (
          <>
            <Text style={[styles.label, { marginTop: spacing.md }]}>Радиус (м)</Text>
            <TextInput
              style={styles.input}
              value={radius}
              onChangeText={setRadius}
              keyboardType="numeric"
              placeholder="200"
            />
            <Text style={styles.hint}>Минимум 50 м, максимум 5000 м</Text>
            <Text style={styles.hint}>Перетащите маркер, чтобы изменить центр</Text>
          </>
        ) : (
          <>
            <Text style={[styles.hint, { marginTop: spacing.md }]}>
              Точки полигона: {polygonPoints.length}. Тапайте по карте, чтобы добавить. Перетаскивайте маркеры для перемещения. Нажмите на маркер, чтобы удалить точку.
            </Text>
            <View style={styles.polygonActions}>
              <TouchableOpacity
                style={styles.smallBtn}
                onPress={() => {
                  setPolygonPoints((prev) => prev.slice(0, -1));
                  setSelectedPointIndex(null);
                }}
                activeOpacity={0.85}
                disabled={polygonPoints.length === 0}
              >
                <Icon name="undo" size={18} color={colors.primary} />
                <Text style={styles.smallBtnText}>Шаг назад</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.smallBtn}
                onPress={() => {
                  setPolygonPoints([]);
                  setSelectedPointIndex(null);
                }}
                activeOpacity={0.85}
                disabled={polygonPoints.length === 0}
              >
                <Icon name="delete-sweep" size={18} color={colors.primary} />
                <Text style={styles.smallBtnText}>Очистить</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      <View style={[styles.mapCard, shadows.card]}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={region}
          region={region}
          onPress={handleMapPress}
        >
          {shape === 'circle' ? (
            <>
              <Marker
                coordinate={center}
                title={name || 'Геозона'}
                draggable
                onDragEnd={(e) => setCenter(e.nativeEvent.coordinate)}
              />
              <Circle
                center={center}
                radius={parsedRadius}
                strokeColor={zoneType === 'safe_zone' ? colors.success : colors.danger}
                fillColor={zoneType === 'safe_zone' ? 'rgba(76, 175, 80, 0.15)' : 'rgba(244, 67, 54, 0.15)'}
                strokeWidth={2}
              />
            </>
          ) : (
            <>
              {polygonPoints.map((p, idx) => (
                <Marker
                  key={`${idx}-${p.latitude}-${p.longitude}`}
                  coordinate={p}
                  title={`Точка ${idx + 1}`}
                  draggable
                  onDragEnd={(e) => handleMarkerDragEnd(idx, e)}
                  onPress={() => handleMarkerPress(idx)}
                  pinColor={selectedPointIndex === idx ? colors.danger : colors.primary}
                />
              ))}
              {polygonPoints.length >= 3 ? (
                <Polygon
                  coordinates={polygonPoints}
                  strokeColor={zoneType === 'safe_zone' ? colors.success : colors.danger}
                  fillColor={zoneType === 'safe_zone' ? 'rgba(76, 175, 80, 0.15)' : 'rgba(244, 67, 54, 0.15)'}
                  strokeWidth={2}
                />
              ) : null}
            </>
          )}
        </MapView>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={save}
          disabled={isSaving}
          activeOpacity={0.85}
        >
          <Icon name="check" size={22} color="#fff" />
          <Text style={styles.saveText}>{isSaving ? 'Сохраняем…' : 'Сохранить'}</Text>
        </TouchableOpacity>
      </View>
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
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.subtitle,
    color: colors.textMuted,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  toggleBtn: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  toggleText: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.text,
  },
  toggleTextActive: {
    color: '#fff',
  },
  label: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: typography.subtitle,
  },
  hint: {
    marginTop: spacing.xs,
    fontSize: typography.caption,
    color: colors.textMuted,
  },
  polygonActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  smallBtn: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  smallBtnText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: typography.caption,
  },
  mapCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  actions: {
    paddingVertical: spacing.md,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveText: {
    color: '#fff',
    fontSize: typography.subtitle,
    fontWeight: '700',
  },
});

export default EditGeofenceScreen;

