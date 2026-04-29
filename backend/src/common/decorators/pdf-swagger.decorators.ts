import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';

export function ApiPdfUpload() {
  return applyDecorators(
    ApiOperation({
      summary:
        'Queue a single bank statement PDF file for asynchronous parsing',
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description: 'PDF file containing bank statement (max 5MB)',
          },
        },
        required: ['file'],
      },
    }),
    ApiResponse({
      status: 201,
      description: 'File queued successfully for processing',
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - No file provided',
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
    }),
  );
}

export function ApiPdfJobStatus() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get PDF parsing job status and result',
    }),
    ApiParam({
      name: 'jobId',
      description: 'The ID of the PDF parsing job to check',
      type: 'string',
    }),
    ApiResponse({
      status: 200,
      description: 'Job status retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          jobId: { type: 'string' },
          status: {
            type: 'string',
            enum: ['waiting', 'active', 'completed', 'failed', 'delayed'],
          },
          progress: { type: 'number' },
          createdAt: { type: 'string' },
          fileName: { type: 'string' },
          jobType: { type: 'string' },
          processedAt: { type: 'string', nullable: true },
          completedAt: { type: 'string', nullable: true },
          processingTime: { type: 'number', nullable: true },
          result: { type: 'object', nullable: true },
          error: { type: 'object', nullable: true },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Job not found',
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
    }),
  );
}
