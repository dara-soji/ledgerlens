import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Queue } from 'bull';
import { Response } from 'express';
import { PdfParserController } from './pdf-parser.controller';
import { SingleFileDto } from './dto/parsed-statement.dto';
import * as fs from 'fs';

jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('PdfParserController (Unit Tests)', () => {
  let controller: PdfParserController;
  let mockQueue: jest.Mocked<Queue>;
  let mockResponse: jest.Mocked<Response>;

  const mockFileDto: SingleFileDto = {
    file: {
      path: '/tmp/test-file.pdf',
      originalName: 'bank-statement.pdf',
      size: 1024,
      mimetype: 'application/pdf',
    } as any,
  };

  const mockFileBuffer = Buffer.from('mock pdf content');

  beforeEach(async () => {
    mockQueue = {
      add: jest.fn(),
      getJob: jest.fn(),
    } as any;

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as any;

    controller = new PdfParserController(mockQueue);

    mockFs.readFileSync.mockReturnValue(mockFileBuffer);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('parseStatementAsync', () => {
    it('should successfully queue a PDF file for processing', async () => {
      const mockJob = { id: 'bull-job-123' };
      mockQueue.add.mockResolvedValue(mockJob as any);

      await controller.parseStatementAsync(mockFileDto, mockResponse);

      expect(mockFs.readFileSync).toHaveBeenCalledWith('/tmp/test-file.pdf');
      expect(mockQueue.add).toHaveBeenCalledWith(
        {
          fileBuffer: mockFileBuffer,
          fileName: 'bank-statement.pdf',
          jobId: expect.stringMatching(/^pdf-\d+-[a-z0-9]+$/),
        },
        {
          jobId: expect.stringMatching(/^pdf-\d+-[a-z0-9]+$/),
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'File queued successfully for processing',
        jobId: expect.stringMatching(/^pdf-\d+-[a-z0-9]+$/),
        fileName: 'bank-statement.pdf',
        status: 'queued',
        queuedAt: expect.any(String),
      });
    });

    it('should throw BadRequestException when no file is provided', async () => {
      const emptyFileDto = { file: null } as any;

      await expect(
        controller.parseStatementAsync(emptyFileDto, mockResponse),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.parseStatementAsync(emptyFileDto, mockResponse),
      ).rejects.toThrow('No file provided');
    });

    it('should handle file reading errors', async () => {
      const error = new Error('File not found');
      mockFs.readFileSync.mockImplementation(() => {
        throw error;
      });

      await expect(
        controller.parseStatementAsync(mockFileDto, mockResponse),
      ).rejects.toThrow(InternalServerErrorException);
      await expect(
        controller.parseStatementAsync(mockFileDto, mockResponse),
      ).rejects.toThrow('Failed to queue PDF parsing job: File not found');
    });

    it('should handle queue errors', async () => {
      const error = new Error('Queue connection failed');
      mockQueue.add.mockRejectedValue(error);

      await expect(
        controller.parseStatementAsync(mockFileDto, mockResponse),
      ).rejects.toThrow(InternalServerErrorException);
      await expect(
        controller.parseStatementAsync(mockFileDto, mockResponse),
      ).rejects.toThrow(
        'Failed to queue PDF parsing job: Queue connection failed',
      );
    });

    it('should generate unique job IDs', async () => {
      const mockJob = { id: 'bull-job-123' };
      mockQueue.add.mockResolvedValue(mockJob as any);

      await controller.parseStatementAsync(mockFileDto, mockResponse);
      await controller.parseStatementAsync(mockFileDto, mockResponse);

      const calls = mockQueue.add.mock.calls;
      const jobData1 = calls[0][0] as any;
      const jobData2 = calls[1][0] as any;
      const jobId1 = jobData1.jobId;
      const jobId2 = jobData2.jobId;

      expect(jobId1).not.toBe(jobId2);
      expect(jobId1).toMatch(/^pdf-\d+-[a-z0-9]+$/);
      expect(jobId2).toMatch(/^pdf-\d+-[a-z0-9]+$/);
    });
  });

  describe('getJobStatus', () => {
    const mockJobId = 'test-job-123';

    it('should return job status for queued job', async () => {
      const mockJob = {
        id: mockJobId,
        timestamp: Date.now(),
        data: { fileName: 'test.pdf' },
        getState: jest.fn().mockResolvedValue('waiting'),
        progress: jest.fn().mockReturnValue(0),
        processedOn: null,
        finishedOn: null,
      };

      mockQueue.getJob.mockResolvedValue(mockJob as any);

      const result = await controller.getJobStatus(mockJobId);

      expect(mockQueue.getJob).toHaveBeenCalledWith(mockJobId);
      expect(result).toEqual({
        jobId: mockJobId,
        status: 'waiting',
        progress: 0,
        createdAt: expect.any(String),
        fileName: 'test.pdf',
        jobType: 'pdf-parsing',
      });
    });

    it('should return job status for completed job', async () => {
      const mockResult = {
        name: 'John Doe',
        transactions: [{ amount: 100 }],
        isReconciled: true,
      };

      const mockJob = {
        id: mockJobId,
        timestamp: Date.now(),
        data: { fileName: 'test.pdf' },
        getState: jest.fn().mockResolvedValue('completed'),
        progress: jest.fn().mockReturnValue(100),
        processedOn: Date.now() - 5000,
        finishedOn: Date.now(),
        returnvalue: mockResult,
      };

      mockQueue.getJob.mockResolvedValue(mockJob as any);

      const result = await controller.getJobStatus(mockJobId);

      expect(result).toEqual({
        jobId: mockJobId,
        status: 'completed',
        progress: 100,
        createdAt: expect.any(String),
        processedAt: expect.any(String),
        completedAt: expect.any(String),
        processingTime: 5000,
        fileName: 'test.pdf',
        jobType: 'pdf-parsing',
        result: mockResult,
      });
    });

    it('should return job status for failed job', async () => {
      const mockJob = {
        id: mockJobId,
        timestamp: Date.now(),
        data: { fileName: 'test.pdf' },
        getState: jest.fn().mockResolvedValue('failed'),
        progress: jest.fn().mockReturnValue(25),
        processedOn: Date.now() - 5000,
        finishedOn: Date.now(),
        failedReason: 'PDF parsing failed',
        stacktrace: ['Error: PDF parsing failed', '  at line 1'],
      };

      mockQueue.getJob.mockResolvedValue(mockJob as any);

      const result = await controller.getJobStatus(mockJobId);

      expect(result).toEqual({
        jobId: mockJobId,
        status: 'failed',
        progress: 25,
        createdAt: expect.any(String),
        processedAt: expect.any(String),
        completedAt: expect.any(String),
        processingTime: 5000,
        fileName: 'test.pdf',
        jobType: 'pdf-parsing',
        error: {
          message: 'PDF parsing failed',
          stack: 'Error: PDF parsing failed\n  at line 1',
        },
      });
    });

    it('should throw NotFoundException when job does not exist', async () => {
      mockQueue.getJob.mockResolvedValue(null);

      await expect(controller.getJobStatus(mockJobId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.getJobStatus(mockJobId)).rejects.toThrow(
        'PDF parsing job test-job-123 not found',
      );
    });

    it('should handle queue errors when getting job status', async () => {
      const error = new Error('Queue connection failed');
      mockQueue.getJob.mockRejectedValue(error);

      await expect(controller.getJobStatus(mockJobId)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(controller.getJobStatus(mockJobId)).rejects.toThrow(
        'Failed to get PDF parsing job status: Error: Queue connection failed',
      );
    });
  });
});
