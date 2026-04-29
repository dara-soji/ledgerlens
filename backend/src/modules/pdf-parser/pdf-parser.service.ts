import { Inject, Injectable, Logger } from '@nestjs/common';
import pdfParse from 'pdf-parse';
import { ParsedStatementDto } from './dto/parsed-statement.dto';
import { LLM_SERVICE, LLMServiceInterface } from '../llm/llm.interface';
import {
  BANK_STATEMENT_SYSTEM_INSTRUCTION,
  createBankStatementPrompt,
} from '../../common/constants/prompts';
import {
  validateAndTransformResult,
  validateReconciliation,
} from '../../common/utils';

export type ProgressCallback = (
  progress: number,
  message: string,
) => Promise<void>;

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function getErrorStack(error: unknown): string | undefined {
  return error instanceof Error ? error.stack : undefined;
}

/**
 * Utility function to clean JSON response from LLM
 * Removes markdown code blocks and extracts pure JSON
 */
function cleanJsonResponse(response: string): string {
  if (!response) {
    throw new Error('Empty response from LLM');
  }

  let cleaned = response.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '');
  cleaned = cleaned.replace(/\n?\s*```\s*$/i, '');
  cleaned = cleaned.trim();

  if (!cleaned.startsWith('{') || !cleaned.endsWith('}')) {
    throw new Error(
      `Invalid JSON format in LLM response. Expected JSON object, got: ${cleaned.substring(0, 100)}...`,
    );
  }

  return cleaned;
}

@Injectable()
export class PdfParserService {
  private readonly logger = new Logger(PdfParserService.name);

  constructor(
    @Inject(LLM_SERVICE) private readonly llmService: LLMServiceInterface,
  ) {}

  async extractTextFromPdf(
    pdfBuffer: Buffer,
    progressCallback?: ProgressCallback,
  ): Promise<string> {
    await progressCallback?.(25, 'Starting PDF text extraction');

    this.logger.log(`Starting PDF text extraction (${pdfBuffer.length} bytes)`);

    try {
      const data = await pdfParse(pdfBuffer);
      const text = data.text;

      if (!text || text.trim().length === 0) {
        this.logger.warn(
          `PDF text extraction completed with no text content (${pdfBuffer.length} bytes)`,
        );
        throw new Error('No text content found in PDF');
      }

      this.logger.log(
        `PDF text extraction completed: ${text.length} characters extracted`,
      );
      await progressCallback?.(
        35,
        `PDF parsing completed: ${text.length} characters extracted`,
      );
      return text;
    } catch (error) {
      const errorMessage = getErrorMessage(error);

      this.logger.error(
        `Failed to parse PDF file (${pdfBuffer.length} bytes): ${errorMessage}`,
        getErrorStack(error),
      );

      throw new Error(`Failed to parse PDF file: ${errorMessage}`);
    }
  }

  async parseBankStatement(
    pdfBuffer: Buffer,
    progressCallback: ProgressCallback,
  ): Promise<ParsedStatementDto> {
    try {
      await progressCallback(15, 'Starting bank statement parsing');

      const pdfText = await this.extractTextFromPdf(
        pdfBuffer,
        progressCallback,
      );
      this.logger.debug('PDF text extracted successfully');

      await progressCallback(45, 'Preparing LLM analysis prompt');

      await progressCallback(55, 'Sending data to LLM for analysis');

      const response = await this.llmService.createResponse(
        BANK_STATEMENT_SYSTEM_INSTRUCTION,
        createBankStatementPrompt(pdfText),
      );

      this.logger.debug('Raw LLM response:', response);
      await progressCallback(70, 'Processing LLM response');

      // Clean the JSON response to remove markdown code blocks, specifically for newer models
      const cleanedResponse = cleanJsonResponse(response);

      const parsedResult = JSON.parse(cleanedResponse);

      await progressCallback(75, 'Validating extracted data structure');

      const validatedResult = validateAndTransformResult(parsedResult);

      await progressCallback(85, 'Performing reconciliation calculations');

      validateReconciliation(validatedResult);

      await progressCallback(
        95,
        `Processing complete: ${validatedResult.transactions?.length || 0} transactions extracted`,
      );

      return validatedResult;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(
        `Error parsing bank statement: ${errorMessage}`,
        getErrorStack(error),
      );

      if (errorMessage.includes('Invalid JSON format')) {
        throw new Error(`LLM returned invalid JSON format: ${errorMessage}`);
      } else if (errorMessage.includes('Unexpected token')) {
        throw new Error(
          `Failed to parse LLM response as JSON: ${errorMessage}`,
        );
      }

      throw new Error(`Failed to parse bank statement: ${errorMessage}`);
    }
  }
}
