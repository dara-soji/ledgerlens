import { Test, TestingModule } from '@nestjs/testing';
import { PdfParserService, ProgressCallback } from './pdf-parser.service';
import { LLMServiceInterface, LLM_SERVICE } from '../llm/llm.interface';

jest.mock('pdf-parse', () => {
  return jest.fn();
});

describe('PdfParserService', () => {
  let service: PdfParserService;
  let mockLLMService: jest.Mocked<LLMServiceInterface>;
  let mockProgressCallback: jest.MockedFunction<ProgressCallback>;
  let mockPdfParse: jest.MockedFunction<any>;

  const mockPdfBuffer = Buffer.from('mock pdf content');
  const mockPdfText =
    'Bank Statement\nJohn Doe\n123 Main St\nStarting Balance: $1000.00\nDeposit: $500.00\nWithdrawal: $200.00\nEnding Balance: $1300.00';

  const mockLLMResponse = JSON.stringify({
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
  });

  beforeEach(async () => {
    mockPdfParse = require('pdf-parse');

    mockLLMService = {
      createResponse: jest.fn(),
    };

    mockProgressCallback = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PdfParserService,
        {
          provide: LLM_SERVICE,
          useValue: mockLLMService,
        },
      ],
    }).compile();

    service = module.get<PdfParserService>(PdfParserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('extractTextFromPdf', () => {
    it('should successfully extract text from PDF buffer', async () => {
      mockPdfParse.mockResolvedValue({ text: mockPdfText });

      const result = await service.extractTextFromPdf(
        mockPdfBuffer,
        mockProgressCallback,
      );

      expect(result).toBe(mockPdfText);
      expect(mockPdfParse).toHaveBeenCalledWith(mockPdfBuffer);
      expect(mockProgressCallback).toHaveBeenCalledWith(
        25,
        'Starting PDF text extraction',
      );
      expect(mockProgressCallback).toHaveBeenCalledWith(
        35,
        `PDF parsing completed: ${mockPdfText.length} characters extracted`,
      );
    });

    it('should handle PDF parsing errors', async () => {
      const error = new Error('PDF parsing failed');
      mockPdfParse.mockRejectedValue(error);

      await expect(
        service.extractTextFromPdf(mockPdfBuffer, mockProgressCallback),
      ).rejects.toThrow('Failed to parse PDF file');
    });

    it('should work without progress callback', async () => {
      mockPdfParse.mockResolvedValue({ text: mockPdfText });

      const result = await service.extractTextFromPdf(mockPdfBuffer);

      expect(result).toBe(mockPdfText);
      expect(mockPdfParse).toHaveBeenCalledWith(mockPdfBuffer);
    });
  });

  describe('parseBankStatement', () => {
    beforeEach(() => {
      mockPdfParse.mockResolvedValue({ text: mockPdfText });
      mockLLMService.createResponse.mockResolvedValue(mockLLMResponse);
    });

    it('should successfully parse bank statement', async () => {
      const result = await service.parseBankStatement(
        mockPdfBuffer,
        mockProgressCallback,
      );

      expect(result).toEqual({
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
      });

      expect(mockLLMService.createResponse).toHaveBeenCalledWith(
        'You are a financial document parser that extracts structured data from bank statements.',
        expect.stringContaining(mockPdfText),
      );

      expect(mockProgressCallback).toHaveBeenCalledWith(
        15,
        'Starting bank statement parsing',
      );
      expect(mockProgressCallback).toHaveBeenCalledWith(
        45,
        'Preparing LLM analysis prompt',
      );
      expect(mockProgressCallback).toHaveBeenCalledWith(
        55,
        'Sending data to LLM for analysis',
      );
      expect(mockProgressCallback).toHaveBeenCalledWith(
        70,
        'Processing LLM response',
      );
      expect(mockProgressCallback).toHaveBeenCalledWith(
        75,
        'Validating extracted data structure',
      );
      expect(mockProgressCallback).toHaveBeenCalledWith(
        85,
        'Performing reconciliation calculations',
      );
      expect(mockProgressCallback).toHaveBeenCalledWith(
        95,
        'Processing complete: 2 transactions extracted',
      );
    });

    it('should handle LLM service errors', async () => {
      const error = new Error('LLM service failed');
      mockLLMService.createResponse.mockRejectedValue(error);

      await expect(
        service.parseBankStatement(mockPdfBuffer, mockProgressCallback),
      ).rejects.toThrow('Failed to parse bank statement');
    });

    it('should handle invalid JSON response from LLM', async () => {
      mockLLMService.createResponse.mockResolvedValue('invalid json');

      await expect(
        service.parseBankStatement(mockPdfBuffer, mockProgressCallback),
      ).rejects.toThrow('Failed to parse bank statement');
    });

    it('should handle validation errors', async () => {
      const invalidResponse = JSON.stringify({
        name: '', // Invalid: empty name
        address: '123 Main St',
        documentDate: '2024-01-01',
        startBalance: 1000.0,
        endBalance: 1300.0,
        transactions: [],
        isReconciled: true,
      });

      mockLLMService.createResponse.mockResolvedValue(invalidResponse);

      await expect(
        service.parseBankStatement(mockPdfBuffer, mockProgressCallback),
      ).rejects.toThrow('Failed to parse bank statement');
    });
  });

  describe('reconciliation logic', () => {
    it('should mark statement as reconciled when transactions balance correctly', async () => {
      const reconciledResponse = JSON.stringify({
        name: 'John Doe',
        address: '123 Main St',
        documentDate: '2024-01-01',
        startBalance: 1000.0,
        endBalance: 1300.0,
        transactions: [
          { date: '2024-01-02', description: 'Deposit', amount: 500.0 },
          { date: '2024-01-03', description: 'Withdrawal', amount: -200.0 },
        ],
        isReconciled: false, // Will be recalculated
      });

      mockLLMService.createResponse.mockResolvedValue(reconciledResponse);

      const result = await service.parseBankStatement(
        mockPdfBuffer,
        mockProgressCallback,
      );

      // 1000 + 500 - 200 = 1300 ✓
      expect(result.isReconciled).toBe(true);
    });

    it('should mark statement as not reconciled when transactions do not balance', async () => {
      const unReconciledResponse = JSON.stringify({
        name: 'John Doe',
        address: '123 Main St',
        documentDate: '2024-01-01',
        startBalance: 1000.0,
        endBalance: 1400.0, // Incorrect ending balance
        transactions: [
          { date: '2024-01-02', description: 'Deposit', amount: 500.0 },
          { date: '2024-01-03', description: 'Withdrawal', amount: -200.0 },
        ],
        isReconciled: false,
      });

      mockLLMService.createResponse.mockResolvedValue(unReconciledResponse);

      const result = await service.parseBankStatement(
        mockPdfBuffer,
        mockProgressCallback,
      );

      // 1000 + 500 - 200 = 1300, but endBalance is 1400 ✗
      expect(result.isReconciled).toBe(false);
    });

    it('should handle small rounding errors (less than 1 cent)', async () => {
      const roundingResponse = JSON.stringify({
        name: 'John Doe',
        address: '123 Main St',
        documentDate: '2024-01-01',
        startBalance: 1000.0,
        endBalance: 1300.005, // Small rounding error
        transactions: [
          { date: '2024-01-02', description: 'Deposit', amount: 500.0 },
          { date: '2024-01-03', description: 'Withdrawal', amount: -200.0 },
        ],
        isReconciled: false,
      });

      mockLLMService.createResponse.mockResolvedValue(roundingResponse);

      const result = await service.parseBankStatement(
        mockPdfBuffer,
        mockProgressCallback,
      );

      // Difference is 0.005, which is < 0.01, so should be reconciled
      expect(result.isReconciled).toBe(true);
    });

    it('should handle empty transactions array', async () => {
      const emptyTransactionsResponse = JSON.stringify({
        name: 'John Doe',
        address: '123 Main St',
        documentDate: '2024-01-01',
        startBalance: 1000.0,
        endBalance: 1000.0,
        transactions: [],
        isReconciled: false,
      });

      mockLLMService.createResponse.mockResolvedValue(
        emptyTransactionsResponse,
      );

      const result = await service.parseBankStatement(
        mockPdfBuffer,
        mockProgressCallback,
      );

      // No transactions, so start balance should equal end balance
      expect(result.isReconciled).toBe(true);
      expect(result.transactions).toHaveLength(0);
    });
  });
});
