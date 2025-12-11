import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { GeocodingService } from './geocoding.service';
import { createLogger } from '../../../../../shared/libs/logger';

interface YandexGeocodeResponse {
  response: {
    GeoObjectCollection: {
      featureMember: Array<{
        GeoObject: {
          metaDataProperty: {
            GeocoderMetaData: {
              text: string;
              precision: string;
            };
          };
          Point: {
            pos: string; // "lon lat"
          };
        };
      }>;
    };
  };
}

interface YandexReverseGeocodeResponse {
  response: {
    GeoObjectCollection: {
      featureMember: Array<{
        GeoObject: {
          metaDataProperty: {
            GeocoderMetaData: {
              text: string;
              Address: {
                formatted: string;
              };
            };
          };
        };
      }>;
    };
  };
}

@Injectable()
export class YandexGeocoderService implements GeocodingService {
  private readonly logger = createLogger({ serviceName: 'location-service' });
  private readonly client: AxiosInstance;
  private readonly apiKey: string;
  private readonly baseUrl = 'https://geocode-maps.yandex.ru/1.x';

  constructor() {
    this.apiKey = process.env.YANDEX_GEOCODER_API_KEY || '';
    
    if (!this.apiKey) {
      this.logger.warn('Yandex Geocoder API key not configured. Geocoding will be disabled.');
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      params: {
        apikey: this.apiKey,
        format: 'json',
      },
    });
  }

  /**
   * Обратный геокодинг: координаты → адрес
   */
  async reverseGeocode(lat: number, lon: number): Promise<string | null> {
    if (!this.apiKey) {
      this.logger.warn('Geocoding disabled: API key not configured');
      return null;
    }

    try {
      const response = await this.client.get<YandexReverseGeocodeResponse>('', {
        params: {
          geocode: `${lon},${lat}`, // Yandex использует формат "lon,lat"
          kind: 'house', // Приоритет адресу с номером дома
        },
      });

      const featureMember = response.data?.response?.GeoObjectCollection?.featureMember;
      if (!featureMember || featureMember.length === 0) {
        this.logger.warn('No address found for coordinates', { lat, lon });
        return null;
      }

      const address =
        featureMember[0].GeoObject.metaDataProperty.GeocoderMetaData.Address?.formatted ||
        featureMember[0].GeoObject.metaDataProperty.GeocoderMetaData.text;

      this.logger.debug('Reverse geocode successful', { lat, lon, address });
      return address;
    } catch (error: any) {
      this.logger.error('Failed to reverse geocode', {
        lat,
        lon,
        error: error.message,
        status: error.response?.status,
      });
      return null;
    }
  }

  /**
   * Прямой геокодинг: адрес → координаты
   */
  async geocode(address: string): Promise<{ lat: number; lon: number } | null> {
    if (!this.apiKey) {
      this.logger.warn('Geocoding disabled: API key not configured');
      return null;
    }

    try {
      const response = await this.client.get<YandexGeocodeResponse>('', {
        params: {
          geocode: address,
        },
      });

      const featureMember = response.data?.response?.GeoObjectCollection?.featureMember;
      if (!featureMember || featureMember.length === 0) {
        this.logger.warn('No coordinates found for address', { address });
        return null;
      }

      const pos = featureMember[0].GeoObject.Point.pos;
      const [lon, lat] = pos.split(' ').map(parseFloat);

      if (isNaN(lat) || isNaN(lon)) {
        this.logger.warn('Invalid coordinates from geocoding', { address, pos });
        return null;
      }

      this.logger.debug('Geocode successful', { address, lat, lon });
      return { lat, lon };
    } catch (error: any) {
      this.logger.error('Failed to geocode address', {
        address,
        error: error.message,
        status: error.response?.status,
      });
      return null;
    }
  }
}

