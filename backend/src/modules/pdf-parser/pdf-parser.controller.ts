import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Logger,
  InternalServerErrorException,
  BadRequestException,
  HttpStatus,
  Response,
  NotFoundException,
} from '@nestjs/common';
import { FormDataRequest } from 'nestjs-form-data';
import { Queue } from 'bull';
import { ApiTags } from '@nestjs/swagger';
import { SingleFileDto } from './dto/parsed-statement.dto';
import * as fs from 'fs';
import { queues } from '../../common/constants';
import { InjectQueue } from '@nestjs/bull';
import {
  ApiPdfUpload,
  ApiPdfJobStatus,
} from '../../common/decorators/pdf-swagger.decorators';

@ApiTags('Bank Statement Parser')
@Controller('api/parse-bank-statement')
export class PdfParserController {
  private readonly logger = new Logger(PdfParserController.name);

  constructor(
    @InjectQueue(queues.PROCESS_PDF)
    private processPdfQueue: Queue,
  ) {}

  @Post()
  @ApiPdfUpload()
  @FormDataRequest()
  async parseStatementAsync(@Body() fileDto: SingleFileDto, @Response() res) {
    try {
      if (!fileDto.file) {
        throw new BadRequestException('No file provided');
      }

      const fileBuffer = fs.readFileSync(fileDto.file.path);
      const jobId = `pdf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      this.processPdfQueue.add(
        {
          fileBuffer,
          fileName: fileDto.file.originalName,
          jobId,
        },
        {
          jobId,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );

      this.logger.log(
        `Queued PDF parsing job ${jobId} for file: ${fileDto.file.originalName}`,
      );

      return res.status(HttpStatus.OK).json({
        message: 'File queued successfully for processing',
        jobId,
        fileName: fileDto.file.originalName,
        status: 'queued',
        queuedAt: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(
        `Failed to add job for ${fileDto.file.originalName}:`,
        error,
      );

      throw new InternalServerErrorException(
        `Failed to queue PDF parsing job: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  @Get('job/:jobId')
  @ApiPdfJobStatus()
  async getJobStatus(@Param('jobId') jobId: string) {
    try {
      const job = await this.processPdfQueue.getJob(jobId);

      if (!job) {
        throw new NotFoundException(`PDF parsing job ${jobId} not found`);
      }

      const jobState = await job.getState();
      const progress = job.progress();

      const response: any = {
        jobId: job.id,
        status: jobState,
        progress: progress,
        createdAt: new Date(job.timestamp).toISOString(),
        fileName: job.data.fileName,
        jobType: 'pdf-parsing',
      };

      if (job.processedOn) {
        response.processedAt = new Date(job.processedOn).toISOString();
      }
      if (job.finishedOn) {
        response.completedAt = new Date(job.finishedOn).toISOString();
        response.processingTime = job.finishedOn - job.processedOn;
      }

      if (jobState === 'completed') {
        response.result = job.returnvalue;
      }

      if (jobState === 'failed') {
        response.error = {
          message: job.failedReason,
          stack: job.stacktrace?.join('\n'),
        };
      }

      return response;
    } catch (error) {
      this.logger.error(`Error getting PDF parsing job status: ${error}`);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Failed to get PDF parsing job status: ${error}`,
      );
    }
  }
}
