import { Response } from 'express';
import { uploadSafetyCaseEvidence } from '../../../src/controllers/safety_case.controller';
import safetyCaseModel from '../../../src/models/safety_case.model';
import auditModel from '../../../src/models/audit.model';
import { AuthRequest } from '../../../src/middleware/auth.middleware';

jest.mock('../../../src/models/safety_case.model', () => ({
  findById: jest.fn(),
  addEvidence: jest.fn(),
}));

jest.mock('../../../src/models/audit.model', () => ({
  create: jest.fn(),
}));

describe('Safety Case Controller - uploadSafetyCaseEvidence', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockReq = {
      user: { userId: 'user-123', phone: '1234567890', role: 'participant' },
      params: { id: 'case-1' },
      body: { fileUrl: 'https://example.com/evidence.jpg' },
    };
    mockRes = {
      status: mockStatus,
      json: mockJson,
    };
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockReq.user = undefined;
    await uploadSafetyCaseEvidence(mockReq as AuthRequest, mockRes as Response);

    expect(mockStatus).toHaveBeenCalledWith(401);
    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
  });

  it('should return 400 if evidence payload is missing or empty', async () => {
    mockReq.body = {};
    await uploadSafetyCaseEvidence(mockReq as AuthRequest, mockRes as Response);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'MISSING_EVIDENCE',
        message: 'Evidence object is required in request body',
      },
    });
  });

  it('should return 404 if safety case is not found', async () => {
    (safetyCaseModel.findById as jest.Mock).mockResolvedValueOnce(null);

    await uploadSafetyCaseEvidence(mockReq as AuthRequest, mockRes as Response);

    expect(mockStatus).toHaveBeenCalledWith(404);
    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'SAFETY_CASE_NOT_FOUND',
        message: 'Safety case not found',
      },
    });
  });

  it('should return 403 if user is neither the reporter nor staff', async () => {
    (safetyCaseModel.findById as jest.Mock).mockResolvedValueOnce({
      id: 'case-1',
      reporter_id: 'other-user',
    });

    await uploadSafetyCaseEvidence(mockReq as AuthRequest, mockRes as Response);

    expect(mockStatus).toHaveBeenCalledWith(403);
    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to modify this safety case',
      },
    });
  });

  it('should successfully upload evidence if user is the reporter', async () => {
    const mockCase = { id: 'case-1', reporter_id: 'user-123' };
    const mockUpdatedCase = { ...mockCase, evidence: [mockReq.body] };

    (safetyCaseModel.findById as jest.Mock).mockResolvedValueOnce(mockCase);
    (safetyCaseModel.addEvidence as jest.Mock).mockResolvedValueOnce(mockUpdatedCase);

    await uploadSafetyCaseEvidence(mockReq as AuthRequest, mockRes as Response);

    expect(safetyCaseModel.addEvidence).toHaveBeenCalledWith('case-1', mockReq.body);
    expect(auditModel.create).toHaveBeenCalled();
    expect(mockJson).toHaveBeenCalledWith({
      success: true,
      data: { safetyCase: mockUpdatedCase },
      message: 'Evidence uploaded successfully',
    });
  });

  it('should successfully upload evidence if user is trust_safety staff', async () => {
    mockReq.user = { userId: 'staff-99', phone: '0000000000', role: 'trust_safety' };
    const mockCase = { id: 'case-1', reporter_id: 'other-user' };
    const mockUpdatedCase = { ...mockCase, evidence: [mockReq.body] };

    (safetyCaseModel.findById as jest.Mock).mockResolvedValueOnce(mockCase);
    (safetyCaseModel.addEvidence as jest.Mock).mockResolvedValueOnce(mockUpdatedCase);

    await uploadSafetyCaseEvidence(mockReq as AuthRequest, mockRes as Response);

    expect(safetyCaseModel.addEvidence).toHaveBeenCalledWith('case-1', mockReq.body);
    expect(mockJson).toHaveBeenCalledWith({
      success: true,
      data: { safetyCase: mockUpdatedCase },
      message: 'Evidence uploaded successfully',
    });
  });
});
