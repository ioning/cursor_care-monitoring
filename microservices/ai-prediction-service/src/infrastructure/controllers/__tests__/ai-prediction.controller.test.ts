import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AIPredictionController } from '../ai-prediction.controller';
import { AIPredictionService } from '../../application/services/ai-prediction.service';

describe('AIPredictionController', () => {
  let controller: AIPredictionController;
  let aiService: any;

  beforeEach(async () => {
    aiService = {
      getPredictionsForWard: jest.fn(),
      getPredictionStats: jest.fn(),
      getPredictionById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AIPredictionController],
      providers: [
        {
          provide: AIPredictionService,
          useValue: aiService,
        },
      ],
    }).compile();

    controller = module.get<AIPredictionController>(AIPredictionController);
  });

  describe('getPredictions', () => {
    it('should get predictions for ward', async () => {
      const wardId = 'ward-1';
      const type = 'health_risk';
      const from = '2024-01-01T00:00:00Z';
      const to = '2024-01-31T23:59:59Z';
      const limit = 50;

      const predictions = [
        {
          id: 'pred-1',
          wardId,
          type,
          riskLevel: 'high',
        },
      ];

      aiService.getPredictionsForWard.mockResolvedValue(predictions);

      const result = await controller.getPredictions(wardId, type, from, to, limit);

      expect(result).toEqual({
        success: true,
        data: predictions,
        count: predictions.length,
        message: 'Predictions retrieved successfully',
      });
      expect(aiService.getPredictionsForWard).toHaveBeenCalledWith(wardId, {
        type,
        from: new Date(from),
        to: new Date(to),
        limit,
      });
    });

    it('should throw BadRequestException if wardId is missing', async () => {
      await expect(controller.getPredictions('', undefined, undefined, undefined, undefined)).rejects.toThrow(
        BadRequestException,
      );
      expect(aiService.getPredictionsForWard).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid from date', async () => {
      const wardId = 'ward-1';
      const from = 'invalid-date';

      await expect(controller.getPredictions(wardId, undefined, from, undefined, undefined)).rejects.toThrow(
        BadRequestException,
      );
      expect(aiService.getPredictionsForWard).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid to date', async () => {
      const wardId = 'ward-1';
      const to = 'invalid-date';

      await expect(controller.getPredictions(wardId, undefined, undefined, to, undefined)).rejects.toThrow(
        BadRequestException,
      );
      expect(aiService.getPredictionsForWard).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if from date is after to date', async () => {
      const wardId = 'ward-1';
      const from = '2024-01-31T00:00:00Z';
      const to = '2024-01-01T00:00:00Z';

      await expect(controller.getPredictions(wardId, undefined, from, to, undefined)).rejects.toThrow(
        BadRequestException,
      );
      expect(aiService.getPredictionsForWard).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if limit is out of range', async () => {
      const wardId = 'ward-1';
      const limit = 2000;

      await expect(controller.getPredictions(wardId, undefined, undefined, undefined, limit)).rejects.toThrow(
        BadRequestException,
      );
      expect(aiService.getPredictionsForWard).not.toHaveBeenCalled();
    });

    it('should use default limit if not provided', async () => {
      const wardId = 'ward-1';
      const predictions = [];

      aiService.getPredictionsForWard.mockResolvedValue(predictions);

      await controller.getPredictions(wardId, undefined, undefined, undefined, 100);

      expect(aiService.getPredictionsForWard).toHaveBeenCalledWith(wardId, {
        type: undefined,
        from: undefined,
        to: undefined,
        limit: 100,
      });
    });
  });

  describe('getPredictionStats', () => {
    it('should get prediction statistics for ward', async () => {
      const wardId = 'ward-1';
      const days = 30;
      const expectedResult = {
        totalPredictions: 100,
        highRiskCount: 10,
        mediumRiskCount: 30,
        lowRiskCount: 60,
      };

      aiService.getPredictionStats.mockResolvedValue(expectedResult);

      const result = await controller.getPredictionStats(wardId, days);

      expect(result).toEqual({
        success: true,
        data: expectedResult,
        message: 'Statistics retrieved successfully',
      });
      expect(aiService.getPredictionStats).toHaveBeenCalledWith(wardId, days);
    });

    it('should throw BadRequestException if wardId is missing', async () => {
      await expect(controller.getPredictionStats('', undefined)).rejects.toThrow(BadRequestException);
      expect(aiService.getPredictionStats).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if days is out of range', async () => {
      const wardId = 'ward-1';
      const days = 500;

      await expect(controller.getPredictionStats(wardId, days)).rejects.toThrow(BadRequestException);
      expect(aiService.getPredictionStats).not.toHaveBeenCalled();
    });

    it('should use default days if not provided', async () => {
      const wardId = 'ward-1';
      const expectedResult = {};

      aiService.getPredictionStats.mockResolvedValue(expectedResult);

      await controller.getPredictionStats(wardId, 7);

      expect(aiService.getPredictionStats).toHaveBeenCalledWith(wardId, 7);
    });
  });

  describe('getPredictionById', () => {
    it('should get prediction by ID', async () => {
      const predictionId = 'pred-1';
      const expectedResult = {
        id: predictionId,
        wardId: 'ward-1',
        type: 'health_risk',
        riskLevel: 'high',
      };

      aiService.getPredictionById.mockResolvedValue(expectedResult);

      const result = await controller.getPredictionById(predictionId);

      expect(result).toEqual({
        success: true,
        data: expectedResult,
        message: 'Prediction retrieved successfully',
      });
      expect(aiService.getPredictionById).toHaveBeenCalledWith(predictionId);
    });

    it('should throw BadRequestException if predictionId is missing', async () => {
      await expect(controller.getPredictionById('')).rejects.toThrow(BadRequestException);
      expect(aiService.getPredictionById).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if prediction not found', async () => {
      const predictionId = 'pred-1';

      aiService.getPredictionById.mockResolvedValue(null);

      await expect(controller.getPredictionById(predictionId)).rejects.toThrow(BadRequestException);
      expect(aiService.getPredictionById).toHaveBeenCalledWith(predictionId);
    });
  });
});

