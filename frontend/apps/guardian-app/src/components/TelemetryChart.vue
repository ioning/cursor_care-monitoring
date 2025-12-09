<template>
  <div class="telemetry-chart">
    <header class="chart-toolbar">
      <div class="range-group">
        <button
          v-for="range in rangeOptions"
          :key="range.value"
          type="button"
          class="range-btn"
          :class="{ active: selectedRange === range.value }"
          @click="selectRange(range.value)"
        >
          {{ range.label }}
        </button>
      </div>
      <div class="toolbar-actions">
        <button type="button" class="ghost" @click="resetZoom" :disabled="!canResetZoom">
          Сбросить зум
        </button>
      </div>
    </header>

    <section v-if="availableMetrics.length" class="metric-filters">
      <span class="label">Метрики:</span>
      <button
        v-for="metric in availableMetrics"
        :key="metric"
        type="button"
        class="metric-chip"
        :class="{ selected: isMetricSelected(metric) }"
        @click="toggleMetric(metric)"
      >
        {{ getMetricLabel(metric) }}
      </button>
      <button type="button" class="reset-metrics" @click="resetMetrics" v-if="selectedMetrics.length">
        Показать все
      </button>
    </section>

    <div v-if="isLoading" class="state loading">Загрузка данных...</div>
    <div v-else-if="error" class="state error">{{ error }}</div>
    <canvas v-else ref="chartCanvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { Chart, registerables } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import 'chartjs-adapter-date-fns';
import { telemetryApi } from '../api/telemetry.api';

Chart.register(...registerables, zoomPlugin);

type MetricSeries = {
  time: string;
  value: number;
};

const props = defineProps<{
  wardId: string;
  metricType?: string;
}>();

const chartCanvas = ref<HTMLCanvasElement | null>(null);
const chartInstance = ref<Chart | null>(null);
const isLoading = ref(false);
const error = ref('');
const availableMetrics = ref<string[]>([]);
const selectedMetrics = ref<string[]>([]);
const metricsData = ref<Record<string, MetricSeries[]>>({});

const rangeOptions = [
  { label: '24 часа', value: '24h', hours: 24 },
  { label: '7 дней', value: '7d', hours: 24 * 7 },
  { label: '30 дней', value: '30d', hours: 24 * 30 },
];

const selectedRange = ref<(typeof rangeOptions)[number]['value']>('24h');

const timeUnit = computed(() => {
  switch (selectedRange.value) {
    case '24h':
      return 'hour';
    case '7d':
      return 'day';
    default:
      return 'day';
  }
});

const canResetZoom = computed(() => !!chartInstance.value);

const selectRange = (value: (typeof rangeOptions)[number]['value']) => {
  if (selectedRange.value !== value) {
    selectedRange.value = value;
  }
};

const toggleMetric = (metric: string) => {
  if (selectedMetrics.value.includes(metric)) {
    selectedMetrics.value = selectedMetrics.value.filter((m) => m !== metric);
  } else {
    selectedMetrics.value = [...selectedMetrics.value, metric];
  }
  updateChartDataset();
};

const resetMetrics = () => {
  selectedMetrics.value = [];
  updateChartDataset();
};

const isMetricSelected = (metric: string) => {
  return selectedMetrics.value.length === 0 || selectedMetrics.value.includes(metric);
};

const resetZoom = () => {
  chartInstance.value?.resetZoom();
};

const loadData = async () => {
  if (!chartCanvas.value) return;

  isLoading.value = true;
  error.value = '';

  try {
    const now = new Date();
    const hours = rangeOptions.find((item) => item.value === selectedRange.value)?.hours ?? 24;
    const from = new Date(now.getTime() - hours * 60 * 60 * 1000);

    const response = await telemetryApi.getWardTelemetry(props.wardId, {
      from: from.toISOString(),
      to: now.toISOString(),
      metricType: props.metricType,
      limit: 500,
    });

    const data = response.data;
    if (data.length === 0) {
      error.value = 'Нет данных за выбранный период';
      metricsData.value = {};
      availableMetrics.value = [];
      updateChartDataset();
      return;
    }

    const metricsMap: Record<string, MetricSeries[]> = {};
    data.forEach((item) => {
      Object.entries(item.metrics).forEach(([key, metric]) => {
        if (!metricsMap[key]) {
          metricsMap[key] = [];
        }
        metricsMap[key].push({
          time: item.timestamp,
          value: metric.value,
        });
      });
    });

    metricsData.value = metricsMap;
    availableMetrics.value = Object.keys(metricsMap);

    if (selectedMetrics.value.length === 0 || props.metricType) {
      selectedMetrics.value = props.metricType ? [props.metricType] : [...availableMetrics.value];
    }

    updateChartDataset(true);
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Ошибка загрузки данных';
  } finally {
    isLoading.value = false;
  }
};

const updateChartDataset = (recreate = false) => {
  const metricsToRender =
    selectedMetrics.value.length === 0 ? availableMetrics.value : selectedMetrics.value;

  const colors = ['#667eea', '#ef4444', '#10b981', '#f59e0b', '#3b82f6', '#ec4899'];

  const datasets = metricsToRender
    .filter((metric) => metricsData.value[metric])
    .map((metric, index) => ({
      label: getMetricLabel(metric),
      data: metricsData.value[metric].map((point) => ({ x: point.time, y: point.value })),
      borderColor: colors[index % colors.length],
      backgroundColor: colors[index % colors.length] + '33',
      tension: 0.3,
      fill: true,
    }));

  if (chartInstance.value && !recreate) {
    chartInstance.value.data.datasets = datasets;
    chartInstance.value.options.scales = {
      ...(chartInstance.value.options.scales ?? {}),
      x: {
        ...(chartInstance.value.options.scales?.x ?? {}),
        type: 'time',
        time: {
          unit: timeUnit.value,
          tooltipFormat: 'dd MMM HH:mm',
        },
      },
    };
    chartInstance.value.update();
  } else if (chartCanvas.value) {
    if (chartInstance.value) {
      chartInstance.value.destroy();
    }

    chartInstance.value = new Chart(chartCanvas.value, {
      type: 'line',
      data: {
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'nearest',
          intersect: false,
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: timeUnit.value,
              tooltipFormat: 'dd MMM HH:mm',
            },
            ticks: {
              maxRotation: 0,
            },
          },
          y: {
            beginAtZero: false,
            grace: '5%',
          },
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          },
          zoom: {
            limits: {
              x: { min: 'original', max: 'original' },
            },
            pan: {
              enabled: true,
              mode: 'x',
            },
            zoom: {
              wheel: {
                enabled: true,
              },
              pinch: {
                enabled: true,
              },
              drag: {
                enabled: true,
              },
              mode: 'x',
            },
          },
        },
      },
    });
  }
};

const getMetricLabel = (key: string) => {
  const labels: Record<string, string> = {
    heart_rate: 'Пульс (уд/мин)',
    activity: 'Активность',
    temperature: 'Температура (°C)',
    blood_pressure: 'Давление (мм рт.ст.)',
    spo2: 'SpO₂ (%)',
    respiration_rate: 'Дыхание (вдох/мин)',
  };
  return labels[key] || key;
};

watch(
  () => [props.wardId, props.metricType, selectedRange.value],
  () => {
    loadData();
  },
);

onMounted(() => {
  loadData();
});

onUnmounted(() => {
  if (chartInstance.value) {
    chartInstance.value.destroy();
  }
});
</script>

<style scoped>
.telemetry-chart {
  position: relative;
  width: 100%;
  min-height: 320px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.chart-toolbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.5rem;
  align-items: center;
}

.range-group {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.range-btn {
  border: 1px solid var(--gray-200);
  border-radius: 999px;
  padding: 0.35rem 0.9rem;
  background: white;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.range-btn.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
  box-shadow: var(--shadow-sm);
}

.toolbar-actions {
  display: flex;
  gap: 0.5rem;
}

.ghost {
  border: 1px solid var(--gray-200);
  border-radius: 10px;
  padding: 0.35rem 0.8rem;
  background: white;
  cursor: pointer;
}

.ghost:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.metric-filters {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.metric-chip {
  border: 1px solid var(--gray-200);
  border-radius: 999px;
  padding: 0.25rem 0.75rem;
  background: white;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.metric-chip.selected {
  background: rgba(102, 126, 234, 0.15);
  border-color: #667eea;
  color: #3730a3;
}

.reset-metrics {
  border: none;
  background: transparent;
  color: var(--primary);
  cursor: pointer;
  font-size: 0.85rem;
}

.label {
  font-size: 0.85rem;
  color: var(--gray-600);
  margin-right: 0.25rem;
}

.state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 280px;
  border: 1px dashed var(--gray-200);
  border-radius: var(--radius-lg);
  color: var(--gray-600);
}

.state.error {
  border-color: rgba(239, 68, 68, 0.4);
  color: #b91c1c;
}

canvas {
  width: 100%;
  min-height: 320px;
}
</style>

