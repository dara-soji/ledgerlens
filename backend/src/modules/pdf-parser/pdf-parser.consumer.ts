import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { PdfParserService, ProgressCallback } from './pdf-parser.service';
import { queues } from '../../common/constants';

export interface ProcessPdfJobData {
  fileBuffer: Buffer;
  fileName: string;
  jobId?: string;
}

@Processor(queues.PROCESS_PDF)
export class PdfParserProcessor {
  private readonly logger = new Logger(PdfParserProcessor.name);

  constructor(private readonly pdfParserService: PdfParserService) {}

  @Process()
  async process(job: Job<ProcessPdfJobData>) {
    this.logger.log(
      `Processing PDF job: ${job.id} for file: ${job.data.fileName}`,
    );

    try {
      const { fileBuffer, fileName } = job.data;

      // Create progress callback that updates job progress and logs
      const progressCallback: ProgressCallback = async (
        progress: number,
        message?: string,
      ) => {
        await job.progress(progress);
        if (message) {
          this.logger.log(`Job ${job.id}: ${message}`);
        }
      };

      await progressCallback(5, `Initializing processing for ${fileName}`);

      await progressCallback(
        10,
        `Validating file buffer (${fileBuffer.length} bytes)`,
      );

      // The service will handle detailed progress from here (15% - 95%)
      const result = await this.pdfParserService.parseBankStatement(
        fileBuffer,
        progressCallback,
      );

      await progressCallback(
        100,
        `Successfully processed PDF: ${fileName} - ${result.transactions?.length || 0} transactions extracted, reconciled: ${result.isReconciled}`,
      );

      return result;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}
