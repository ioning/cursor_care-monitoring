/**
 * Интерфейс для сервисов геокодинга
 */
export interface GeocodingService {
  /**
   * Обратный геокодинг: преобразование координат в адрес
   * @param lat - Широта
   * @param lon - Долгота
   * @returns Адрес или null если не найден
   */
  reverseGeocode(lat: number, lon: number): Promise<string | null>;

  /**
   * Прямой геокодинг: преобразование адреса в координаты
   * @param address - Адрес для поиска
   * @returns Координаты или null если адрес не найден
   */
  geocode(address: string): Promise<{ lat: number; lon: number } | null>;
}

