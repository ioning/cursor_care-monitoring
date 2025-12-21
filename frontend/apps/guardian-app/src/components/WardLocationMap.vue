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
      <div ref="mapContainer" v-else class="yandex-map"></div>
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
        <div v-if="currentLocation.address" class="info-item">
          <span class="info-label">Адрес:</span>
          <span class="info-value">{{ currentLocation.address }}</span>
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
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useLocationStore } from '../stores/location';
import type { Location } from '../api/location.api';

// Типы для Яндекс карт
declare global {
  interface Window {
    ymaps: any;
  }
}

interface Props {
  wardId: string;
  wardName: string;
}

const props = defineProps<Props>();

const locationStore = useLocationStore();
const mapContainer = ref<HTMLDivElement | null>(null);
const map = ref<any>(null);
const currentMarker = ref<any>(null);
const historyMarkers = ref<any[]>([]);
const historyPolyline = ref<any>(null);
const geofenceCircles = ref<any[]>([]);

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

// Загрузка скрипта Яндекс карт
function loadYandexMaps(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.ymaps) {
      window.ymaps.ready(() => resolve());
      return;
    }

    const script = document.createElement('script');
    const apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY || 'YOUR_API_KEY';
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU`;
    script.async = true;
    script.onload = () => {
      window.ymaps.ready(() => resolve());
    };
    script.onerror = () => reject(new Error('Failed to load Yandex Maps'));
    document.head.appendChild(script);
  });
}

// Инициализация карты
async function initMap() {
  if (!mapContainer.value) return;

  try {
    await loadYandexMaps();

    map.value = new window.ymaps.Map(mapContainer.value, {
      center: currentLocation.value 
        ? [currentLocation.value.latitude, currentLocation.value.longitude]
        : [59.9343, 30.3351], // Санкт-Петербург по умолчанию
      zoom: 15,
      controls: ['zoomControl', 'fullscreenControl', 'typeSelector', 'geolocationControl'],
    });

    updateMarker();
    updateGeofences();
  } catch (error) {
    console.error('Failed to initialize map:', error);
  }
}

// Обновление маркера текущего местоположения
function updateMarker() {
  if (!map.value || !currentLocation.value) return;

  // Удаляем старый маркер
  if (currentMarker.value) {
    map.value.geoObjects.remove(currentMarker.value);
  }

  // Создаем новый маркер
  currentMarker.value = new window.ymaps.Placemark(
    [currentLocation.value.latitude, currentLocation.value.longitude],
    {
      balloonContentHeader: props.wardName,
      balloonContentBody: `
        <div>
          <p><strong>Текущее местоположение</strong></p>
          <p>Точность: ${currentLocation.value.accuracy ? Math.round(currentLocation.value.accuracy) + 'м' : 'Неизвестно'}</p>
          <p>Время: ${formatTime(currentLocation.value.timestamp)}</p>
          ${currentLocation.value.address ? `<p>Адрес: ${currentLocation.value.address}</p>` : ''}
        </div>
      `,
      hintContent: props.wardName,
    },
    {
      preset: 'islands#redIcon',
      iconColor: '#3b82f6',
    }
  );

  map.value.geoObjects.add(currentMarker.value);
  
  // Центрируем карту на маркере
  map.value.setCenter([currentLocation.value.latitude, currentLocation.value.longitude], 15);
}

// Обновление геозон
function updateGeofences() {
  if (!map.value) return;

  // Удаляем старые геозоны
  geofenceCircles.value.forEach((circle) => {
    map.value.geoObjects.remove(circle);
  });
  geofenceCircles.value = [];

  // Добавляем новые геозоны
  geofences.value.forEach((geofence) => {
    const circle = new window.ymaps.Circle(
      [[geofence.centerLatitude, geofence.centerLongitude], geofence.radius],
      {},
      {
        fillColor: geofence.type === 'safe_zone' ? '#10b981' : '#ef4444',
        fillOpacity: 0.2,
        strokeColor: geofence.type === 'safe_zone' ? '#10b981' : '#ef4444',
        strokeWidth: 2,
      }
    );

    circle.properties.set('balloonContent', `
      <div>
        <h4>${geofence.name}</h4>
        <p>Тип: ${geofence.type === 'safe_zone' ? 'Безопасная зона' : 'Запрещенная зона'}</p>
        <p>Радиус: ${Math.round(geofence.radius)}м</p>
      </div>
    `);

    map.value.geoObjects.add(circle);
    geofenceCircles.value.push(circle);
  });
}

// Обновление истории на карте
function updateHistory() {
  if (!map.value || !showHistory.value || locationHistory.value.length === 0) {
    // Удаляем историю, если она скрыта
    if (historyPolyline.value) {
      map.value.geoObjects.remove(historyPolyline.value);
      historyPolyline.value = null;
    }
    historyMarkers.value.forEach((marker) => {
      map.value.geoObjects.remove(marker);
    });
    historyMarkers.value = [];
    return;
  }

  // Удаляем старую историю
  if (historyPolyline.value) {
    map.value.geoObjects.remove(historyPolyline.value);
  }
  historyMarkers.value.forEach((marker) => {
    map.value.geoObjects.remove(marker);
  });
  historyMarkers.value = [];

  if (locationHistory.value.length < 2) return;

  // Создаем полилинию для пути
  const coordinates = locationHistory.value.map((loc) => [loc.latitude, loc.longitude]);
  historyPolyline.value = new window.ymaps.Polyline(coordinates, {}, {
    strokeColor: '#3b82f6',
    strokeWidth: 3,
    strokeOpacity: 0.6,
  });

  map.value.geoObjects.add(historyPolyline.value);

  // Добавляем маркеры для истории (первые 50 точек)
  locationHistory.value.slice(0, 50).forEach((location, index) => {
    const marker = new window.ymaps.Placemark(
      [location.latitude, location.longitude],
      {
        balloonContent: `
          <div>
            <p><strong>История #${locationHistory.value.length - index}</strong></p>
            <p>Время: ${formatTime(location.timestamp)}</p>
          </div>
        `,
      },
      {
        preset: 'islands#blueCircleDotIcon',
        iconColor: '#3b82f6',
      }
    );

    map.value.geoObjects.add(marker);
    historyMarkers.value.push(marker);
  });
}

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
    map.value.setCenter(
      [currentLocation.value.latitude, currentLocation.value.longitude],
      15
    );
  }
}

function centerOnLocation(location: { latitude: number; longitude: number }) {
  if (map.value) {
    map.value.setCenter([location.latitude, location.longitude], 16);
  }
}

async function loadHistory() {
  if (!historyFrom.value || !historyTo.value) {
    // Загружаем историю за последние 7 дней, если даты не указаны
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 7);
    historyFrom.value = from.toISOString().split('T')[0];
    historyTo.value = to.toISOString().split('T')[0];
  }

  historyLoading.value = true;
  try {
    const response = await locationStore.fetchLocationHistory(props.wardId, {
      from: new Date(historyFrom.value).toISOString(),
      to: new Date(historyTo.value).toISOString(),
      limit: 100,
    });
    // Обрабатываем ответ - может быть { success: true, data: [...] } или напрямую массив
    if (response?.data) {
      locationHistory.value = Array.isArray(response.data) ? response.data : [];
    } else if (Array.isArray(response)) {
      locationHistory.value = response;
    } else {
      console.warn('Unexpected location history response format:', response);
      locationHistory.value = [];
    }
    console.log(`Loaded ${locationHistory.value.length} location history points`);
    updateHistory();
  } catch (error: any) {
    console.error('Failed to load location history:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    locationHistory.value = [];
  } finally {
    historyLoading.value = false;
  }
}

// Отслеживание изменений
watch(currentLocation, () => {
  updateMarker();
}, { deep: true });

watch(geofences, () => {
  updateGeofences();
}, { deep: true });

watch(showHistory, () => {
  updateHistory();
});

watch(locationHistory, () => {
  if (showHistory.value) {
    updateHistory();
  }
}, { deep: true });

onMounted(async () => {
  await nextTick();
  await initMap();
  
  // Загружаем начальные данные
  await Promise.all([
    locationStore.fetchLatestLocation(props.wardId),
    locationStore.fetchGeofences(props.wardId),
  ]);

  // Начинаем отслеживание
  locationStore.startTracking(props.wardId, 10000);
});

onUnmounted(() => {
  locationStore.stopTracking(props.wardId);
});
</script>

<style scoped>
.ward-location-map {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
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
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.map-controls {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.map-container {
  width: 100%;
  min-height: 500px;
  position: relative;
}

.yandex-map {
  width: 100%;
  height: 500px;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: var(--shadow, 0 2px 8px rgba(0, 0, 0, 0.1));
}

.loading,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary, #666);
}

.empty-hint {
  font-size: 0.875rem;
  margin-top: 0.5rem;
  color: var(--text-secondary, #999);
}

.location-info {
  margin-top: 1.5rem;
}

.info-card {
  background: var(--card-bg, #fff);
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: var(--shadow, 0 2px 8px rgba(0, 0, 0, 0.1));
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 500;
  color: var(--text-secondary, #666);
}

.info-value {
  color: var(--text-primary, #000);
}

.history-panel {
  margin-top: 1.5rem;
  background: var(--card-bg, #fff);
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: var(--shadow, 0 2px 8px rgba(0, 0, 0, 0.1));
}

.history-panel h4 {
  font-size: 1.125rem;
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
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.history-list {
  max-height: 300px;
  overflow-y: auto;
}

.history-item {
  padding: 0.75rem;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 0.375rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.history-item:hover {
  background-color: var(--bg-color, #f9fafb);
}

.history-time {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.history-coords {
  font-size: 0.875rem;
  color: var(--text-secondary, #666);
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
}

.btn-primary {
  background-color: var(--primary-color, #3b82f6);
  color: white;
}

.btn-primary:hover {
  background-color: var(--primary-color-dark, #2563eb);
}

.btn-secondary {
  background-color: var(--secondary-color, #6b7280);
  color: white;
}

.btn-secondary:hover {
  background-color: var(--secondary-color-dark, #4b5563);
}
</style>
