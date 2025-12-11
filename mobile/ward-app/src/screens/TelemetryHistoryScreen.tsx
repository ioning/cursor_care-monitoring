import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Share,
  Alert,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LineChart } from 'react-native-chart-kit';
import { TelemetryHistoryService, TelemetryChartData } from '../services/TelemetryHistoryService';
import { colors, spacing, typography, radii } from '../theme/designSystem';

const screenWidth = Dimensions.get('window').width;

interface TelemetryHistoryScreenProps {
  route: {
    params: {
      wardId: string;
      metricType: string;
    };
  };
}

const PERIODS: Array<{ key: '1h' | '6h' | '24h' | '7d' | '30d'; label: string }> = [
  { key: '1h', label: '1 ч' },
  { key: '6h', label: '6 ч' },
  { key: '24h', label: '24 ч' },
  { key: '7d', label: '7 д' },
  { key: '30d', label: '30 д' },
];

const TelemetryHistoryScreen: React.FC<TelemetryHistoryScreenProps> = ({ route }) => {
  const { wardId, metricType } = route.params;
  const [chartData, setChartData] = useState<TelemetryChartData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'1h' | '6h' | '24h' | '7d' | '30d'>('24h');
  const [isLoading, setIsLoading] = useState(true);
  const [statistics, setStatistics] = useState<{
    min: number;
    max: number;
    avg: number;
    latest: number;
  } | null>(null);

  useEffect(() => {
    loadHistory();
  }, [wardId, metricType, selectedPeriod]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const data = await TelemetryHistoryService.getChartData(wardId, metricType, selectedPeriod);
      setChartData(data);

      // Загружаем статистику
      const history = await TelemetryHistoryService.getHistory(wardId, metricType, undefined, undefined, 1000);
      if (history) {
        setStatistics({
          min: history.min,
          max: history.max,
          avg: history.avg,
          latest: history.latest,
        });
      }
    } catch (error) {
      console.error('Failed to load history:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить историю телеметрии');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const csv = await TelemetryHistoryService.exportToCSV(wardId, metricType);
      
      if (Platform.OS === 'android') {
        await Share.share({
          message: csv,
          title: `Экспорт ${metricType}`,
        });
      } else {
        await Share.share({
          message: csv,
        });
      }
    } catch (error) {
      console.error('Failed to export:', error);
      Alert.alert('Ошибка', 'Не удалось экспортировать данные');
    }
  };

  const getMetricLabel = (type: string): string => {
    const labels: Record<string, string> = {
      heart_rate: 'Пульс',
      temperature: 'Температура',
      spo2: 'SpO2',
      steps: 'Шаги',
      blood_pressure: 'Давление',
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Загрузка данных...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>{getMetricLabel(metricType)}</Text>
        <TouchableOpacity onPress={handleExport} style={styles.exportButton}>
          <Icon name="download" size={20} color={colors.primary} />
          <Text style={styles.exportText}>Экспорт</Text>
        </TouchableOpacity>
      </View>

      {/* Период */}
      <View style={styles.periodSelector}>
        {PERIODS.map((period) => (
          <TouchableOpacity
            key={period.key}
            style={[
              styles.periodButton,
              selectedPeriod === period.key && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod(period.key)}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === period.key && styles.periodButtonTextActive,
              ]}
            >
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* График */}
      <View style={styles.chartContainer}>
        {chartData && chartData.labels.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <LineChart
              data={{
                labels: chartData.labels,
                datasets: chartData.datasets,
              }}
              width={Math.max(screenWidth - spacing.md * 2, chartData.labels.length * 50)}
              height={220}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: colors.surface,
                backgroundGradientFrom: colors.surface,
                backgroundGradientTo: colors.surface,
                decimalPlaces: 1,
                color: (opacity = 1) => chartData.datasets[0].color || colors.primary,
                labelColor: (opacity = 1) => colors.textMuted,
                style: {
                  borderRadius: radii.md,
                },
                propsForDots: {
                  r: '4',
                  strokeWidth: '2',
                  stroke: chartData.datasets[0].color || colors.primary,
                },
                propsForBackgroundLines: {
                  strokeDasharray: '',
                  stroke: colors.divider,
                  strokeWidth: 1,
                },
              }}
              bezier
              style={styles.chart}
              withVerticalLabels={true}
              withHorizontalLabels={true}
              withInnerLines={true}
              withOuterLines={true}
              withDots={chartData.labels.length <= 20}
              withShadow={false}
            />
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <Icon name="info-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>Нет данных за выбранный период</Text>
          </View>
        )}
      </View>

      {/* Статистика */}
      {statistics && (
        <View style={styles.statistics}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Текущее</Text>
            <Text style={styles.statValue}>{statistics.latest.toFixed(1)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Среднее</Text>
            <Text style={styles.statValue}>{statistics.avg.toFixed(1)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Макс</Text>
            <Text style={[styles.statValue, styles.statValueMax]}>
              {statistics.max.toFixed(1)}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Мин</Text>
            <Text style={[styles.statValue, styles.statValueMin]}>
              {statistics.min.toFixed(1)}
            </Text>
          </View>
        </View>
      )}

      {/* Информация о метрике */}
      {chartData && statistics && (
        <View style={styles.metricInfo}>
          <Text style={styles.metricInfoTitle}>
            {getMetricLabel(metricType)} ({statistics.unit || 'ед'})
          </Text>
          <Text style={styles.metricInfoText}>
            Период: {PERIODS.find(p => p.key === selectedPeriod)?.label || selectedPeriod}
          </Text>
          <Text style={styles.metricInfoText}>
            Точок данных: {chartData.labels.length}
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
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
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  exportText: {
    color: colors.primary,
    fontWeight: '600',
  },
  periodSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  periodButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.divider,
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  periodButtonText: {
    color: colors.text,
    fontWeight: '600',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  chartContainer: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    minHeight: 250,
  },
  chart: {
    marginVertical: spacing.sm,
    borderRadius: radii.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: typography.body,
    color: colors.textMuted,
  },
  statistics: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.text,
  },
  statValueMax: {
    color: colors.danger,
  },
  statValueMin: {
    color: colors.success,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.body,
    color: colors.textMuted,
  },
  metricInfo: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  metricInfoTitle: {
    fontSize: typography.subtitle,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  metricInfoText: {
    fontSize: typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs / 2,
  },
});

export default TelemetryHistoryScreen;

