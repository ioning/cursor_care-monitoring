import { Test, TestingModule } from '@nestjs/testing';
import { DispatcherController } from '../dispatcher.controller';
import { DispatcherService } from '../../application/services/dispatcher.service';

describe('DispatcherController', () => {
  let controller: DispatcherController;
  let dispatcherService: any;

  beforeEach(async () => {
    dispatcherService = {
      getCalls: jest.fn(),
      getCall: jest.fn(),
      assignCall: jest.fn(),
      updateCallStatus: jest.fn(),
      getStats: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DispatcherController],
      providers: [
        {
          provide: DispatcherService,
          useValue: dispatcherService,
        },
      ],
    }).compile();

    controller = module.get<DispatcherController>(DispatcherController);
  });

  describe('getCalls', () => {
    it('should get emergency calls', async () => {
      const query = { status: 'active', page: 1, limit: 10 };
      const expectedResult = {
        success: true,
        data: [
          {
            id: 'call-1',
            status: 'active',
            wardId: 'ward-1',
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
        },
      };

      dispatcherService.getCalls.mockResolvedValue(expectedResult);

      const result = await controller.getCalls(query);

      expect(result).toEqual(expectedResult);
      expect(dispatcherService.getCalls).toHaveBeenCalledWith(query);
    });
  });

  describe('getCall', () => {
    it('should get call by ID', async () => {
      const callId = 'call-1';
      const expectedResult = {
        success: true,
        data: {
          id: callId,
          status: 'active',
          wardId: 'ward-1',
        },
      };

      dispatcherService.getCall.mockResolvedValue(expectedResult);

      const result = await controller.getCall(callId);

      expect(result).toEqual(expectedResult);
      expect(dispatcherService.getCall).toHaveBeenCalledWith(callId);
    });
  });

  describe('assignCall', () => {
    it('should assign call to dispatcher', async () => {
      const callId = 'call-1';
      const userId = 'user-1';
      const expectedResult = {
        success: true,
        data: {
          id: callId,
          assignedDispatcherId: userId,
          status: 'assigned',
        },
      };

      dispatcherService.assignCall.mockResolvedValue(expectedResult);

      const result = await controller.assignCall({ user: { id: userId } } as any, callId);

      expect(result).toEqual(expectedResult);
      expect(dispatcherService.assignCall).toHaveBeenCalledWith(callId, userId);
    });
  });

  describe('updateStatus', () => {
    it('should update call status', async () => {
      const callId = 'call-1';
      const body = {
        status: 'resolved',
        notes: 'Issue resolved',
      };
      const expectedResult = {
        success: true,
        data: {
          id: callId,
          status: body.status,
          notes: body.notes,
        },
      };

      dispatcherService.updateCallStatus.mockResolvedValue(expectedResult);

      const result = await controller.updateStatus(callId, body);

      expect(result).toEqual(expectedResult);
      expect(dispatcherService.updateCallStatus).toHaveBeenCalledWith(
        callId,
        body.status,
        body.notes,
      );
    });

    it('should update call status without notes', async () => {
      const callId = 'call-1';
      const body = {
        status: 'resolved',
      };
      const expectedResult = {
        success: true,
        data: {
          id: callId,
          status: body.status,
        },
      };

      dispatcherService.updateCallStatus.mockResolvedValue(expectedResult);

      const result = await controller.updateStatus(callId, body);

      expect(result).toEqual(expectedResult);
      expect(dispatcherService.updateCallStatus).toHaveBeenCalledWith(callId, body.status, undefined);
    });
  });

  describe('getStats', () => {
    it('should get dispatcher statistics', async () => {
      const expectedResult = {
        success: true,
        data: {
          totalCalls: 100,
          activeCalls: 5,
          resolvedCalls: 90,
          averageResponseTime: 120,
        },
      };

      dispatcherService.getStats.mockResolvedValue(expectedResult);

      const result = await controller.getStats();

      expect(result).toEqual(expectedResult);
      expect(dispatcherService.getStats).toHaveBeenCalled();
    });
  });
});

