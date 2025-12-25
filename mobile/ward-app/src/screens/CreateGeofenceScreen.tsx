import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import MapView, { Circle, Marker, Polygon, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { GeofenceService } from '../services/GeofenceService';
import { colors, spacing, typography, radii, shadows } from '../theme/designSystem';

const DEFAULT_CENTER = { latitude: 55.751244, longitude: 37.618423 };

const CreateGeofenceScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const wardId = (route.params as any)?.wardId as string | undefined;

  const [name, setName] = useState('Дом');
  const [zoneType, setZoneType] = useState<'safe_zone' | 'restricted_zone'>('safe_zone');
  const [shape, setShape] = useState<'circle' | 'polygon'>('circle');
  const [radius, setRadius] = useState('200');
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [polygonPoints, setPolygonPoints] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [isSaving, setIsSaving] = useState(false);

  const region: Region = useMemo(
    () => ({
      latitude: center.latitude,
      longitude: center.longitude,
      latitudeDelta: 0.03,
      longitudeDelta: 0.03,
    }),
    [center],
  );

  const parsedRadius = Math.max(50, Math.min(5000, Number(radius) || 200));

  const save = async () => {
    if (!wardId) {
      Alert.alert('Ошибка', 'Не указан wardId');
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
        return;
      }

      await GeofenceService.createGeofence(wardId, {
        wardId,
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
        enabled: true,
      } as any);

      Alert.alert('Готово', 'Геозона создана', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e: any) {
      Alert.alert('Ошибка', e?.message || 'Не удалось создать геозону');
    } finally {
      setIsSaving(false);
    }
  };

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
          </>
        ) : (
          <>
            <Text style={[styles.hint, { marginTop: spacing.md }]}>
              Точки полигона: {polygonPoints.length}. Тапайте по карте, чтобы добавить вершины.
            </Text>
            <View style={styles.polygonActions}>
              <TouchableOpacity
                style={styles.smallBtn}
                onPress={() => setPolygonPoints((prev) => prev.slice(0, -1))}
                activeOpacity={0.85}
                disabled={polygonPoints.length === 0}
              >
                <Icon name="undo" size={18} color={colors.primary} />
                <Text style={styles.smallBtnText}>Шаг назад</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.smallBtn}
                onPress={() => setPolygonPoints([])}
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
          onPress={(e) => {
            const coord = e.nativeEvent.coordinate;
            if (shape === 'circle') {
              setCenter(coord);
            } else {
              setPolygonPoints((prev) => [...prev, coord]);
            }
          }}
        >
          {shape === 'circle' ? (
            <>
              <Marker coordinate={center} title={name || 'Геозона'} />
              <Circle
                center={center}
                radius={parsedRadius}
                strokeColor={colors.primary}
                fillColor="rgba(33, 150, 243, 0.15)"
                strokeWidth={2}
              />
            </>
          ) : (
            <>
              {polygonPoints.map((p, idx) => (
                <Marker key={`${idx}-${p.latitude}-${p.longitude}`} coordinate={p} title={`Точка ${idx + 1}`} />
              ))}
              {polygonPoints.length >= 3 ? (
                <Polygon
                  coordinates={polygonPoints}
                  strokeColor={colors.primary}
                  fillColor="rgba(33, 150, 243, 0.15)"
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

export default CreateGeofenceScreen;


