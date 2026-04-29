import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bull';
import { PdfParserProcessor, ProcessPdfJobData } from './pdf-parser.consumer';
import { PdfParserService } from './pdf-parser.service';

describe('PdfParserProcessor', () => {
  let processor: PdfParserProcessor;
  let mockPdfParserService: jest.Mocked<PdfParserService>;
  let mockJob: jest.Mocked<Job<ProcessPdfJobData>>;

  const mockJobData: ProcessPdfJobData = {
    fileBuffer: Buffer.from('mock pdf content'),
    fileName: 'test-statement.pdf',
    jobId: 'test-job-123',
  };

  const mockParsedResult = {
    name: 'John Doe',
    address: '123 Main St',
    documentDate: '2024-01-01',
    startBalance: 1000.0,
    endBalance: 1300.0,
    transactions: [
      { date: '2024-01-02', description: 'Deposit', amount: 500.0 },
      { date: '2024-01-03', description: 'Withdrawal', amount: -200.0 },
    ],
    isReconciled: true,
  };

  beforeEach(async () => {
    mockPdfParserService = {
      parseBankStatement: jest.fn(),
      extractTextFromPdf: jest.fn(),
    } as any;

    mockJob = {
      id: 'test-job-123',
      data: mockJobData,
      progress: jest.fn().mockResolvedValue(undefined),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PdfParserProcessor,
        {
          provide: PdfParserService,
          useValue: mockPdfParserService,
        },
      ],
    }).compile();

    processor = module.get<PdfParserProcessor>(PdfParserProcessor);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('process', () => {
    it('should successfully process a PDF job', async () => {
      mockPdfParserService.parseBankStatement.mockResolvedValue(
        mockParsedResult,
      );

      const result = await processor.process(mockJob);

      expect(result).toEqual(mockParsedResult);
      expect(mockPdfParserService.parseBankStatement).toHaveBeenCalledWith(
        mockJobData.fileBuffer,
        expect.any(Function),
      );

      expect(mockJob.progress).toHaveBeenCalledWith(5);
      expect(mockJob.progress).toHaveBeenCalledWith(10);
      expect(mockJob.progress).toHaveBeenCalledWith(100);
    });

    it('should handle service errors gracefully', async () => {
      const error = new Error('PDF parsing failed');
      mockPdfParserService.parseBankStatement.mockRejectedValue(error);

      await expect(processor.process(mockJob)).rejects.toThrow(
        'PDF parsing failed',
      );
    });

    it('should handle result with no transactions', async () => {
      const resultWithNoTransactions = {
        ...mockParsedResult,
        transactions: [],
        isReconciled: true,
      };
      mockPdfParserService.parseBankStatement.mockResolvedValue(
        resultWithNoTransactions,
      );

      const result = await processor.process(mockJob);

      expect(result).toEqual(resultWithNoTransactions);
    });

    it('should handle result with undefined transactions', async () => {
      const resultWithUndefinedTransactions = {
        ...mockParsedResult,
        transactions: undefined as any,
        isReconciled: false,
      };
      mockPdfParserService.parseBankStatement.mockResolvedValue(
        resultWithUndefinedTransactions,
      );

      const result = await processor.process(mockJob);

      expect(result).toEqual(resultWithUndefinedTransactions);
    });
  });
});
