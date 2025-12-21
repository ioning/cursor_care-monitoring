<template>
  <div class="wards-location-map">
    <div class="map-header">
      <h2>Карта подопечных</h2>
      <div class="map-controls">
        <button @click="refreshLocations" class="btn btn-sm btn-secondary" :disabled="isLoading">
          Обновить
        </button>
        <button @click="toggleTracking" class="btn btn-sm" :class="isTrackingAll ? 'btn-danger' : 'btn-primary'">
          {{ isTrackingAll ? 'Остановить отслеживание' : 'Начать отслеживание' }}
        </button>
      </div>
    </div>

    <div v-if="isLoading && wardLocations.size === 0" class="loading">
      Загрузка геолокации...
    </div>
    <div v-else-if="wardLocations.size === 0" class="empty-state">
      <p>Нет данных о местоположении подопечных</p>
    </div>
    <div ref="mapContainer" class="map-container"></div>

    <!-- Информация о подопечных -->
    <div v-if="wardLocations.size > 0" class="wards-info">
      <h3>Подопечные на карте ({{ wardLocations.size }})</h3>
      <div class="wards-list">
        <div
          v-for="[wardId, location] in wardLocations"
          :key="wardId"
          class="ward-item"
          @click="centerOnWard(wardId, location)"
        >
          <div class="ward-name">{{ getWardName(wardId) }}</div>
          <div class="ward-location">
            <span class="location-time">{{ formatTime(location.timestamp) }}</span>
            <span v-if="location.accuracy" class="location-accuracy">
              Точность: {{ Math.round(location.accuracy) }}м
            </span>
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
import { useCallsStore } from '../stores/calls';
import type { Location } from '../api/location.api';

// Типы для Яндекс карт
declare global {
  interface Window {
    ymaps: any;
  }
}

const locationStore = useLocationStore();
const callsStore = useCallsStore();

const mapContainer = ref<HTMLDivElement | null>(null);
const map = ref<any>(null);
const markers = ref<Map<string, any>>(new Map());
const isTrackingAll = ref(false);

const wardLocations = computed(() => locationStore.wardLocations);
const isLoading = computed(() => locationStore.isLoading);

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
      center: [59.9343, 30.3351], // Санкт-Петербург по умолчанию
      zoom: 10,
      controls: ['zoomControl', 'fullscreenControl', 'typeSelector', 'geolocationControl'],
    });

    // Обновляем маркеры при изменении локаций
    updateMarkers();
  } catch (error) {
    console.error('Failed to initialize map:', error);
  }
}

// Обновление маркеров на карте
function updateMarkers() {
  if (!map.value) return;

  // Удаляем старые маркеры
  markers.value.forEach((marker) => {
    map.value.geoObjects.remove(marker);
  });
  markers.value.clear();

  // Добавляем новые маркеры
  wardLocations.value.forEach((location, wardId) => {
    const marker = new window.ymaps.Placemark(
      [location.latitude, location.longitude],
      {
        balloonContentHeader: getWardName(wardId),
        balloonContentBody: `
          <div>
            <p><strong>Время:</strong> ${formatTime(location.timestamp)}</p>
            <p><strong>Точность:</strong> ${location.accuracy ? Math.round(location.accuracy) + 'м' : 'Неизвестно'}</p>
            <p><strong>Источник:</strong> ${getSourceLabel(location.source)}</p>
            ${location.address ? `<p><strong>Адрес:</strong> ${location.address}</p>` : ''}
          </div>
        `,
        hintContent: getWardName(wardId),
      },
      {
        preset: 'islands#redIcon',
        iconColor: getPriorityColor(wardId),
      }
    );

    map.value.geoObjects.add(marker);
    markers.value.set(wardId, marker);
  });

  // Автоматически подстраиваем границы карты под все маркеры
  if (wardLocations.value.size > 0) {
    const bounds = map.value.geoObjects.getBounds();
    if (bounds) {
      map.value.setBounds(bounds, { checkZoomRange: true });
    }
  }
}

// Получение имени подопечного
function getWardName(wardId: string): string {
  // Пытаемся найти имя в вызовах
  const call = callsStore.calls.find((c) => c.wardId === wardId);
  if (call?.ward?.fullName) {
    return call.ward.fullName;
  }
  return `Подопечный ${wardId.slice(0, 8)}`;
}

// Получение цвета маркера по приоритету
function getPriorityColor(wardId: string): string {
  const call = callsStore.calls.find((c) => c.wardId === wardId);
  if (!call) return '#3b82f6'; // Синий по умолчанию

  switch (call.priority) {
    case 'critical':
      return '#ef4444'; // Красный
    case 'high':
      return '#f59e0b'; // Оранжевый
    case 'medium':
      return '#3b82f6'; // Синий
    case 'low':
      return '#10b981'; // Зеленый
    default:
      return '#3b82f6';
  }
}

// Центрирование на подопечном
function centerOnWard(wardId: string, location: Location) {
  if (map.value) {
    map.value.setCenter([location.latitude, location.longitude], 15);
  }
}

// Обновление локаций
async function refreshLocations() {
  // Получаем все уникальные wardId из вызовов
  const wardIds = Array.from(new Set(callsStore.calls.map((call) => call.wardId)));
  if (wardIds.length > 0) {
    await locationStore.fetchWardsLocations(wardIds);
  }
}

// Переключение отслеживания
function toggleTracking() {
  if (isTrackingAll.value) {
    // Останавливаем отслеживание всех
    wardLocations.value.forEach((_, wardId) => {
      locationStore.stopTracking(wardId);
    });
    isTrackingAll.value = false;
  } else {
    // Начинаем отслеживание всех
    wardLocations.value.forEach((_, wardId) => {
      locationStore.startTracking(wardId, 10000); // Обновление каждые 10 секунд
    });
    isTrackingAll.value = true;
  }
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

// Отслеживание изменений локаций
watch(wardLocations, () => {
  updateMarkers();
}, { deep: true });

onMounted(async () => {
  await nextTick();
  await initMap();
  
  // Загружаем локации при монтировании
  await refreshLocations();
});

onUnmounted(() => {
  // Останавливаем отслеживание при размонтировании
  locationStore.stopAllTracking();
});
</script>

<style scoped>
.wards-location-map {
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

.map-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.map-controls {
  display: flex;
  gap: 0.5rem;
}

.map-container {
  flex: 1;
  min-height: 500px;
  width: 100%;
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

.wards-info {
  margin-top: 1.5rem;
  background: var(--card-bg, #fff);
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: var(--shadow, 0 2px 8px rgba(0, 0, 0, 0.1));
}

.wards-info h3 {
  font-size: 1.25rem;
  margin-bottom: 1rem;
}

.wards-list {
  display: grid;
  gap: 0.75rem;
  max-height: 300px;
  overflow-y: auto;
}

.ward-item {
  padding: 0.75rem;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.ward-item:hover {
  background-color: var(--bg-color, #f9fafb);
}

.ward-name {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.ward-location {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: var(--text-secondary, #666);
}

.location-time {
  flex: 1;
}

.location-accuracy {
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

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
}

.btn-primary {
  background-color: var(--primary-color, #3b82f6);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--primary-color-dark, #2563eb);
}

.btn-secondary {
  background-color: var(--secondary-color, #6b7280);
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--secondary-color-dark, #4b5563);
}

.btn-danger {
  background-color: var(--error-color, #ef4444);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background-color: var(--error-color-dark, #dc2626);
}
</style>
