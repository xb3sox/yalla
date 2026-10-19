import { Request, Response } from 'express';
import { createFeedback, getExperienceFeedbacks } from '../../src/controllers/feedback.controller';
import feedbackModel from '../../src/models/feedback.model';
import reservationModel from '../../src/models/reservation.model';
import { AuthRequest } from '../../src/middleware/auth.middleware';

// Mock dependencies
jest.mock('../../src/models/feedback.model', () => ({
  __esModule: true,
  default: {
    createFeedback: jest.fn(),
    getFeedbacksByExperience: jest.fn(),
    getFeedbackByReservation: jest.fn(),
  },
}));

jest.mock('../../src/models/reservation.model', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
  },
}));

jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

describe('Feedback Controller', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
    jest.clearAllMocks();
  });

  describe('createFeedback', () => {
    const validFeedbackData = {
      reservation_id: 'res-123',
      worth_time: 4,
      description_accurate: true,
      comfortable_organized: true,
      comment: 'Great experience!',
    };

    beforeEach(() => {
      mockRequest = {
        user: { userId: 'user-123', phone: '123456789', role: 'participant' },
        body: { ...validFeedbackData },
      };
    });

    it('should return 401 if user is not authenticated', async () => {
      mockRequest.user = undefined;

      await createFeedback(mockRequest as AuthRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({ code: 'UNAUTHORIZED' }),
      });
    });

    it('should return 400 if required fields are missing', async () => {
      mockRequest.body = { worth_time: 4 }; // Missing others

      await createFeedback(mockRequest as AuthRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({ code: 'VALIDATION_ERROR' }),
      });
    });

    it('should return 400 if worth_time is invalid', async () => {
      mockRequest.body = { ...validFeedbackData, worth_time: 6 };

      await createFeedback(mockRequest as AuthRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({ code: 'VALIDATION_ERROR' }),
      });
    });

    it('should return 404 if reservation not found', async () => {
      (reservationModel.findById as jest.Mock).mockResolvedValueOnce(null);

      await createFeedback(mockRequest as AuthRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({ code: 'NOT_FOUND' }),
      });
    });

    it('should return 403 if user does not own reservation', async () => {
      (reservationModel.findById as jest.Mock).mockResolvedValueOnce({
        participant_id: 'other-user',
        state: 'completed',
      });

      await createFeedback(mockRequest as AuthRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({ code: 'FORBIDDEN' }),
      });
    });

    it('should return 400 if reservation state is invalid', async () => {
      (reservationModel.findById as jest.Mock).mockResolvedValueOnce({
        participant_id: 'user-123',
        state: 'initiated', // Invalid state for feedback
      });

      await createFeedback(mockRequest as AuthRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({ code: 'INVALID_STATE' }),
      });
    });

    it('should return 409 if feedback already exists', async () => {
      (reservationModel.findById as jest.Mock).mockResolvedValueOnce({
        participant_id: 'user-123',
        state: 'completed',
        experience_id: 'exp-123',
      });
      (feedbackModel.getFeedbackByReservation as jest.Mock).mockResolvedValueOnce({
        id: 'existing-feedback',
      });

      await createFeedback(mockRequest as AuthRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({ code: 'CONFLICT' }),
      });
    });

    it('should return 201 and create feedback on success', async () => {
      const reservation = {
        participant_id: 'user-123',
        state: 'completed',
        experience_id: 'exp-123',
      };
      
      const createdFeedback = { id: 'new-feedback', ...validFeedbackData };

      (reservationModel.findById as jest.Mock).mockResolvedValueOnce(reservation);
      (feedbackModel.getFeedbackByReservation as jest.Mock).mockResolvedValueOnce(null);
      (feedbackModel.createFeedback as jest.Mock).mockResolvedValueOnce(createdFeedback);

      await createFeedback(mockRequest as AuthRequest, mockResponse as Response);

      expect(feedbackModel.createFeedback).toHaveBeenCalledWith(
        'res-123',
        'user-123',
        'exp-123',
        4,
        true,
        true,
        'Great experience!'
      );
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: createdFeedback,
      });
    });
  });

  describe('getExperienceFeedbacks', () => {
    beforeEach(() => {
      mockRequest = {
        params: { experienceId: 'exp-123' },
      };
    });

    it('should return 400 if experienceId is missing', async () => {
      mockRequest.params = {};

      await getExperienceFeedbacks(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({ code: 'VALIDATION_ERROR' }),
      });
    });

    it('should return 200 with list of feedbacks on success', async () => {
      const mockFeedbacks = [{ id: 'f1' }, { id: 'f2' }];
      (feedbackModel.getFeedbacksByExperience as jest.Mock).mockResolvedValueOnce(mockFeedbacks);

      await getExperienceFeedbacks(mockRequest as Request, mockResponse as Response);

      expect(feedbackModel.getFeedbacksByExperience).toHaveBeenCalledWith('exp-123');
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockFeedbacks,
        count: 2,
      });
    });

    it('should return 500 on internal error', async () => {
      (feedbackModel.getFeedbacksByExperience as jest.Mock).mockRejectedValueOnce(new Error('DB Error'));

      await getExperienceFeedbacks(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({ code: 'INTERNAL_SERVER_ERROR' }),
      });
    });
  });
});
