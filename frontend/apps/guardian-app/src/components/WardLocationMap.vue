<template>
  <div class="ward-location-map">
    <div class="map-header">
      <h3>📍 Геолокация</h3>
      <div class="map-controls">
        <button
          @click="toggleTracking"
          class="btn btn-sm"
          :class="isTracking ? 'btn-secondary' : 'btn-primary'"
        >
          {{ isTracking ? '⏸ Остановить' : '▶ Начать' }} отслеживание
        </button>
        <button @click="centerOnWard" class="btn btn-sm btn-secondary" v-if="currentLocation">
          🎯 Центрировать
        </button>
        <button @click="showHistory = !showHistory" class="btn btn-sm btn-secondary">
          {{ showHistory ? 'Скрыть' : 'Показать' }} историю
        </button>
      </div>
    </div>

    <div class="map-container">
      <div v-if="isLoading && !currentLocation" class="loading">Загрузка геолокации...</div>
      <div v-else-if="!currentLocation" class="empty-state">
        <p>📍 Геолокация недоступна</p>
        <p class="empty-hint">Подопечный должен включить отслеживание в мобильном приложении</p>
      </div>
      <LMap
        v-else
        ref="map"
        :zoom="zoom"
        :center="mapCenter"
        style="height: 500px; width: 100%"
        @update:center="mapCenter = $event"
        @update:zoom="zoom = $event"
      >
        <LTileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          :attribution="attribution"
        />

        <!-- Current Location Marker -->
        <LMarker
          :lat-lng="[currentLocation.latitude, currentLocation.longitude]"
          :icon="currentLocationIcon"
        >
          <LPopup>
            <div class="location-popup">
              <h4>{{ wardName }}</h4>
              <p><strong>Текущее местоположение</strong></p>
              <p>Точность: {{ currentLocation.accuracy ? `${Math.round(currentLocation.accuracy)}м` : 'Неизвестно' }}</p>
              <p>Время: {{ formatTime(currentLocation.timestamp) }}</p>
            </div>
          </LPopup>
        </LMarker>

        <!-- Geofences -->
        <LCircle
          v-for="geofence in geofences"
          :key="geofence.id"
          :lat-lng="[geofence.centerLatitude, geofence.centerLongitude]"
          :radius="geofence.radius"
          :color="geofence.type === 'safe_zone' ? '#10b981' : '#ef4444'"
          :fill="true"
          :fill-opacity="0.2"
          :weight="2"
        >
          <LPopup>
            <div class="geofence-popup">
              <h4>{{ geofence.name }}</h4>
              <p>Тип: {{ geofence.type === 'safe_zone' ? 'Безопасная зона' : 'Запрещенная зона' }}</p>
              <p>Радиус: {{ Math.round(geofence.radius) }}м</p>
            </div>
          </LPopup>
        </LCircle>

        <!-- Location History Path -->
        <LPolyline
          v-if="showHistory && locationHistory.length > 1"
          :lat-lngs="historyPath"
          color="#3b82f6"
          :weight="3"
          :opacity="0.6"
        />

        <!-- History Markers -->
        <LMarker
          v-for="(location, index) in locationHistory.slice(0, 50)"
          :key="location.id"
          :lat-lng="[location.latitude, location.longitude]"
          :icon="historyMarkerIcon"
        >
          <LPopup>
            <div class="location-popup">
              <p><strong>История #{{ locationHistory.length - index }}</strong></p>
              <p>Время: {{ formatTime(location.timestamp) }}</p>
            </div>
          </LPopup>
        </LMarker>
      </LMap>
    </div>

    <!-- Location Info -->
    <div v-if="currentLocation" class="location-info">
      <div class="info-card">
        <div class="info-item">
          <span class="info-label">Последнее обновление:</span>
          <span class="info-value">{{ formatTime(currentLocation.timestamp) }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Точность:</span>
          <span class="info-value">
            {{ currentLocation.accuracy ? `${Math.round(currentLocation.accuracy)}м` : 'Неизвестно' }}
          </span>
        </div>
        <div class="info-item">
          <span class="info-label">Источник:</span>
          <span class="info-value">{{ getSourceLabel(currentLocation.source) }}</span>
        </div>
      </div>
    </div>

    <!-- History Panel -->
    <div v-if="showHistory" class="history-panel">
      <h4>История перемещений</h4>
      <div class="history-controls">
        <input
          type="date"
          v-model="historyFrom"
          @change="loadHistory"
          class="date-input"
        />
        <span>—</span>
        <input
          type="date"
          v-model="historyTo"
          @change="loadHistory"
          class="date-input"
        />
        <button @click="loadHistory" class="btn btn-sm btn-primary">Загрузить</button>
      </div>
      <div v-if="historyLoading" class="loading">Загрузка истории...</div>
      <div v-else-if="locationHistory.length === 0" class="empty-state">
        Нет данных за выбранный период
      </div>
      <div v-else class="history-list">
        <div
          v-for="location in locationHistory.slice(0, 20)"
          :key="location.id"
          class="history-item"
          @click="centerOnLocation(location)"
        >
          <div class="history-time">{{ formatTime(location.timestamp) }}</div>
          <div class="history-coords">
            {{ location.latitude.toFixed(6) }}, {{ location.longitude.toFixed(6) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import L from 'leaflet';
import type { LatLngExpression } from 'leaflet';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useLocationStore } from '../stores/location';
import 'leaflet/dist/leaflet.css';
import { LMap, LTileLayer, LMarker, LPopup, LCircle, LPolyline } from '@vue-leaflet/vue-leaflet';

interface Props {
  wardId: string;
  wardName: string;
}

const props = defineProps<Props>();

const locationStore = useLocationStore();
const map = ref<L.Map | null>(null);
const zoom = ref(15);
const mapCenter = ref<LatLngExpression>([59.9343, 30.3351]); // St. Petersburg default
const showHistory = ref(false);
const historyFrom = ref('');
const historyTo = ref('');
const historyLoading = ref(false);

const currentLocation = computed(() => locationStore.getWardLocation(props.wardId));
const geofences = computed(() => locationStore.getWardGeofences(props.wardId));
const isTracking = computed(() => locationStore.trackingWards.has(props.wardId));
const isLoading = computed(() => locationStore.isLoading);

const locationHistory = ref<Array<{
  id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}>>([]);

const historyPath = computed(() => {
  return locationHistory.value.map((loc) => [loc.latitude, loc.longitude] as LatLngExpression);
});

const currentLocationIcon = L.divIcon({
  className: 'ward-location-marker',
  html: '<div class="marker-pulse"></div><div class="marker-icon">📍</div>',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const historyMarkerIcon = L.divIcon({
  className: 'history-marker',
  html: '<div class="history-dot"></div>',
  iconSize: [8, 8],
  iconAnchor: [4, 4],
});

const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

function formatTime(dateString: string) {
  return format(new Date(dateString), 'dd.MM.yyyy HH:mm:ss', { locale: ru });
}

function getSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    mobile_app: 'Мобильное приложение',
    device: 'Устройство',
    manual: 'Вручную',
  };
  return labels[source] || source;
}

function toggleTracking() {
  if (isTracking.value) {
    locationStore.stopTracking(props.wardId);
  } else {
    locationStore.startTracking(props.wardId, 10000); // Update every 10 seconds
  }
}

function centerOnWard() {
  if (currentLocation.value && map.value) {
    map.value.setView(
      [currentLocation.value.latitude, currentLocation.value.longitude],
      15,
    );
  }
}

function centerOnLocation(location: { latitude: number; longitude: number }) {
  if (map.value) {
    map.value.setView([location.latitude, location.longitude], 16);
  }
}

async function loadHistory() {
  if (!historyFrom.value || !historyTo.value) {
    return;
  }

  historyLoading.value = true;
  try {
    const response = await locationStore.fetchLocationHistory(props.wardId, {
      from: historyFrom.value,
      to: historyTo.value,
      limit: 1000,
    });
    locationHistory.value = response.data || [];
  } catch (error) {
    console.error('Failed to load location history:', error);
  } finally {
    historyLoading.value = false;
  }
}

watch(currentLocation, (newLocation) => {
  if (newLocation && map.value) {
    mapCenter.value = [newLocation.latitude, newLocation.longitude];
    map.value.setView([newLocation.latitude, newLocation.longitude], zoom.value);
  }
}, { immediate: true });

onMounted(async () => {
  // Set default date range (last 7 days)
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 7);
  historyTo.value = format(to, 'yyyy-MM-dd');
  historyFrom.value = format(from, 'yyyy-MM-dd');

  // Load initial data
  await Promise.all([
    locationStore.fetchLatestLocation(props.wardId),
    locationStore.fetchGeofences(props.wardId),
  ]);

  // Start tracking
  locationStore.startTracking(props.wardId, 10000);
});

onUnmounted(() => {
  locationStore.stopTracking(props.wardId);
});
</script>

<style scoped>
.ward-location-map {
  margin-bottom: 2rem;
}

.map-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.map-header h3 {
  margin: 0;
  font-size: 1.25rem;
}

.map-controls {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.map-container {
  position: relative;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: var(--shadow, 0 1px 3px rgba(0, 0, 0, 0.1));
  margin-bottom: 1rem;
}

.loading,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary, #64748b);
}

.empty-hint {
  font-size: 0.875rem;
  margin-top: 0.5rem;
  opacity: 0.8;
}

.location-info {
  margin-bottom: 1rem;
}

.info-card {
  background: var(--card-bg, white);
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: var(--shadow, 0 1px 3px rgba(0, 0, 0, 0.1));
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.875rem;
  color: var(--text-secondary, #64748b);
}

.info-value {
  font-weight: 600;
  color: var(--text, #0f172a);
}

.history-panel {
  background: var(--card-bg, white);
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: var(--shadow, 0 1px 3px rgba(0, 0, 0, 0.1));
  margin-top: 1rem;
}

.history-panel h4 {
  margin-top: 0;
  margin-bottom: 1rem;
}

.history-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.date-input {
  padding: 0.5rem;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.history-list {
  max-height: 300px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.history-item {
  padding: 0.75rem;
  background: var(--bg-light, #f8fafc);
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background 0.2s;
}

.history-item:hover {
  background: var(--bg-gray, #f1f5f9);
}

.history-time {
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.history-coords {
  font-size: 0.75rem;
  color: var(--text-secondary, #64748b);
  font-family: monospace;
}

.location-popup,
.geofence-popup {
  min-width: 200px;
}

.location-popup h4,
.geofence-popup h4 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  font-size: 1rem;
}

.location-popup p,
.geofence-popup p {
  margin: 0.25rem 0;
  font-size: 0.875rem;
}

/* Marker Styles */
:deep(.ward-location-marker) {
  background: transparent;
  border: none;
}

.marker-pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #3b82f6;
  opacity: 0.3;
  animation: pulse 2s infinite;
}

.marker-icon {
  position: relative;
  z-index: 1;
  font-size: 24px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

@keyframes pulse {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.3;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 0.1;
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.3;
  }
}

:deep(.history-marker) {
  background: transparent;
  border: none;
}

.history-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #3b82f6;
  border: 2px solid white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}
</style>




    <div class="map-header">
      <h3>📍 Геолокация</h3>
      <div class="map-controls">
        <button
          @click="toggleTracking"
          class="btn btn-sm"
          :class="isTracking ? 'btn-secondary' : 'btn-primary'"
        >
          {{ isTracking ? '⏸ Остановить' : '▶ Начать' }} отслеживание
        </button>
        <button @click="centerOnWard" class="btn btn-sm btn-secondary" v-if="currentLocation">
          🎯 Центрировать
        </button>
        <button @click="showHistory = !showHistory" class="btn btn-sm btn-secondary">
          {{ showHistory ? 'Скрыть' : 'Показать' }} историю
        </button>
      </div>
    </div>

    <div class="map-container">
      <div v-if="isLoading && !currentLocation" class="loading">Загрузка геолокации...</div>
      <div v-else-if="!currentLocation" class="empty-state">
        <p>📍 Геолокация недоступна</p>
        <p class="empty-hint">Подопечный должен включить отслеживание в мобильном приложении</p>
      </div>
      <LMap
        v-else
        ref="map"
        :zoom="zoom"
        :center="mapCenter"
        style="height: 500px; width: 100%"
        @update:center="mapCenter = $event"
        @update:zoom="zoom = $event"
      >
        <LTileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          :attribution="attribution"
        />

        <!-- Current Location Marker -->
        <LMarker
          :lat-lng="[currentLocation.latitude, currentLocation.longitude]"
          :icon="currentLocationIcon"
        >
          <LPopup>
            <div class="location-popup">
              <h4>{{ wardName }}</h4>
              <p><strong>Текущее местоположение</strong></p>
              <p>Точность: {{ currentLocation.accuracy ? `${Math.round(currentLocation.accuracy)}м` : 'Неизвестно' }}</p>
              <p>Время: {{ formatTime(currentLocation.timestamp) }}</p>
            </div>
          </LPopup>
        </LMarker>

        <!-- Geofences -->
        <LCircle
          v-for="geofence in geofences"
          :key="geofence.id"
          :lat-lng="[geofence.centerLatitude, geofence.centerLongitude]"
          :radius="geofence.radius"
          :color="geofence.type === 'safe_zone' ? '#10b981' : '#ef4444'"
          :fill="true"
          :fill-opacity="0.2"
          :weight="2"
        >
          <LPopup>
            <div class="geofence-popup">
              <h4>{{ geofence.name }}</h4>
              <p>Тип: {{ geofence.type === 'safe_zone' ? 'Безопасная зона' : 'Запрещенная зона' }}</p>
              <p>Радиус: {{ Math.round(geofence.radius) }}м</p>
            </div>
          </LPopup>
        </LCircle>

        <!-- Location History Path -->
        <LPolyline
          v-if="showHistory && locationHistory.length > 1"
          :lat-lngs="historyPath"
          color="#3b82f6"
          :weight="3"
          :opacity="0.6"
        />

        <!-- History Markers -->
        <LMarker
          v-for="(location, index) in locationHistory.slice(0, 50)"
          :key="location.id"
          :lat-lng="[location.latitude, location.longitude]"
          :icon="historyMarkerIcon"
        >
          <LPopup>
            <div class="location-popup">
              <p><strong>История #{{ locationHistory.length - index }}</strong></p>
              <p>Время: {{ formatTime(location.timestamp) }}</p>
            </div>
          </LPopup>
        </LMarker>
      </LMap>
    </div>

    <!-- Location Info -->
    <div v-if="currentLocation" class="location-info">
      <div class="info-card">
        <div class="info-item">
          <span class="info-label">Последнее обновление:</span>
          <span class="info-value">{{ formatTime(currentLocation.timestamp) }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Точность:</span>
          <span class="info-value">
            {{ currentLocation.accuracy ? `${Math.round(currentLocation.accuracy)}м` : 'Неизвестно' }}
          </span>
        </div>
        <div class="info-item">
          <span class="info-label">Источник:</span>
          <span class="info-value">{{ getSourceLabel(currentLocation.source) }}</span>
        </div>
      </div>
    </div>

    <!-- History Panel -->
    <div v-if="showHistory" class="history-panel">
      <h4>История перемещений</h4>
      <div class="history-controls">
        <input
          type="date"
          v-model="historyFrom"
          @change="loadHistory"
          class="date-input"
        />
        <span>—</span>
        <input
          type="date"
          v-model="historyTo"
          @change="loadHistory"
          class="date-input"
        />
        <button @click="loadHistory" class="btn btn-sm btn-primary">Загрузить</button>
      </div>
      <div v-if="historyLoading" class="loading">Загрузка истории...</div>
      <div v-else-if="locationHistory.length === 0" class="empty-state">
        Нет данных за выбранный период
      </div>
      <div v-else class="history-list">
        <div
          v-for="location in locationHistory.slice(0, 20)"
          :key="location.id"
          class="history-item"
          @click="centerOnLocation(location)"
        >
          <div class="history-time">{{ formatTime(location.timestamp) }}</div>
          <div class="history-coords">
            {{ location.latitude.toFixed(6) }}, {{ location.longitude.toFixed(6) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import L from 'leaflet';
import type { LatLngExpression } from 'leaflet';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useLocationStore } from '../stores/location';
import 'leaflet/dist/leaflet.css';
import { LMap, LTileLayer, LMarker, LPopup, LCircle, LPolyline } from '@vue-leaflet/vue-leaflet';

interface Props {
  wardId: string;
  wardName: string;
}

const props = defineProps<Props>();

const locationStore = useLocationStore();
const map = ref<L.Map | null>(null);
const zoom = ref(15);
const mapCenter = ref<LatLngExpression>([59.9343, 30.3351]); // St. Petersburg default
const showHistory = ref(false);
const historyFrom = ref('');
const historyTo = ref('');
const historyLoading = ref(false);

const currentLocation = computed(() => locationStore.getWardLocation(props.wardId));
const geofences = computed(() => locationStore.getWardGeofences(props.wardId));
const isTracking = computed(() => locationStore.trackingWards.has(props.wardId));
const isLoading = computed(() => locationStore.isLoading);

const locationHistory = ref<Array<{
  id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}>>([]);

const historyPath = computed(() => {
  return locationHistory.value.map((loc) => [loc.latitude, loc.longitude] as LatLngExpression);
});

const currentLocationIcon = L.divIcon({
  className: 'ward-location-marker',
  html: '<div class="marker-pulse"></div><div class="marker-icon">📍</div>',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const historyMarkerIcon = L.divIcon({
  className: 'history-marker',
  html: '<div class="history-dot"></div>',
  iconSize: [8, 8],
  iconAnchor: [4, 4],
});

const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

function formatTime(dateString: string) {
  return format(new Date(dateString), 'dd.MM.yyyy HH:mm:ss', { locale: ru });
}

function getSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    mobile_app: 'Мобильное приложение',
    device: 'Устройство',
    manual: 'Вручную',
  };
  return labels[source] || source;
}

function toggleTracking() {
  if (isTracking.value) {
    locationStore.stopTracking(props.wardId);
  } else {
    locationStore.startTracking(props.wardId, 10000); // Update every 10 seconds
  }
}

function centerOnWard() {
  if (currentLocation.value && map.value) {
    map.value.setView(
      [currentLocation.value.latitude, currentLocation.value.longitude],
      15,
    );
  }
}

function centerOnLocation(location: { latitude: number; longitude: number }) {
  if (map.value) {
    map.value.setView([location.latitude, location.longitude], 16);
  }
}

async function loadHistory() {
  if (!historyFrom.value || !historyTo.value) {
    return;
  }

  historyLoading.value = true;
  try {
    const response = await locationStore.fetchLocationHistory(props.wardId, {
      from: historyFrom.value,
      to: historyTo.value,
      limit: 1000,
    });
    locationHistory.value = response.data || [];
  } catch (error) {
    console.error('Failed to load location history:', error);
  } finally {
    historyLoading.value = false;
  }
}

watch(currentLocation, (newLocation) => {
  if (newLocation && map.value) {
    mapCenter.value = [newLocation.latitude, newLocation.longitude];
    map.value.setView([newLocation.latitude, newLocation.longitude], zoom.value);
  }
}, { immediate: true });

onMounted(async () => {
  // Set default date range (last 7 days)
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 7);
  historyTo.value = format(to, 'yyyy-MM-dd');
  historyFrom.value = format(from, 'yyyy-MM-dd');

  // Load initial data
  await Promise.all([
    locationStore.fetchLatestLocation(props.wardId),
    locationStore.fetchGeofences(props.wardId),
  ]);

  // Start tracking
  locationStore.startTracking(props.wardId, 10000);
});

onUnmounted(() => {
  locationStore.stopTracking(props.wardId);
});
</script>

<style scoped>
.ward-location-map {
  margin-bottom: 2rem;
}

.map-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.map-header h3 {
  margin: 0;
  font-size: 1.25rem;
}

.map-controls {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.map-container {
  position: relative;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: var(--shadow, 0 1px 3px rgba(0, 0, 0, 0.1));
  margin-bottom: 1rem;
}

.loading,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary, #64748b);
}

.empty-hint {
  font-size: 0.875rem;
  margin-top: 0.5rem;
  opacity: 0.8;
}

.location-info {
  margin-bottom: 1rem;
}

.info-card {
  background: var(--card-bg, white);
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: var(--shadow, 0 1px 3px rgba(0, 0, 0, 0.1));
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.875rem;
  color: var(--text-secondary, #64748b);
}

.info-value {
  font-weight: 600;
  color: var(--text, #0f172a);
}

.history-panel {
  background: var(--card-bg, white);
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: var(--shadow, 0 1px 3px rgba(0, 0, 0, 0.1));
  margin-top: 1rem;
}

.history-panel h4 {
  margin-top: 0;
  margin-bottom: 1rem;
}

.history-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.date-input {
  padding: 0.5rem;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.history-list {
  max-height: 300px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.history-item {
  padding: 0.75rem;
  background: var(--bg-light, #f8fafc);
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background 0.2s;
}

.history-item:hover {
  background: var(--bg-gray, #f1f5f9);
}

.history-time {
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.history-coords {
  font-size: 0.75rem;
  color: var(--text-secondary, #64748b);
  font-family: monospace;
}

.location-popup,
.geofence-popup {
  min-width: 200px;
}

.location-popup h4,
.geofence-popup h4 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  font-size: 1rem;
}

.location-popup p,
.geofence-popup p {
  margin: 0.25rem 0;
  font-size: 0.875rem;
}

/* Marker Styles */
:deep(.ward-location-marker) {
  background: transparent;
  border: none;
}

.marker-pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #3b82f6;
  opacity: 0.3;
  animation: pulse 2s infinite;
}

.marker-icon {
  position: relative;
  z-index: 1;
  font-size: 24px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

@keyframes pulse {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.3;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 0.1;
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.3;
  }
}

:deep(.history-marker) {
  background: transparent;
  border: none;
}

.history-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #3b82f6;
  border: 2px solid white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}
</style>

