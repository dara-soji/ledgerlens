import { Module } from '@nestjs/common';
import { PdfParserService } from './pdf-parser.service';
import { PdfParserController } from './pdf-parser.controller';
import { PdfParserProcessor } from './pdf-parser.consumer';

import { NestjsFormDataModule, FileSystemStoredFile } from 'nestjs-form-data';
import { BullModule } from '@nestjs/bull';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullAdapter } from '@bull-board/api/bullAdapter';

import { queues } from '../../common/constants';

@Module({
  imports: [
    NestjsFormDataModule.config({
      storage: FileSystemStoredFile,
      cleanupAfterSuccessHandle: true,
      cleanupAfterFailedHandle: true,
      isGlobal: true,
    }),
    BullModule.registerQueue({
      name: queues.PROCESS_PDF,
    }),
    BullBoardModule.forFeature({
      name: queues.PROCESS_PDF,
      adapter: BullAdapter,
    }),
  ],

  controllers: [PdfParserController],
  providers: [PdfParserService, PdfParserProcessor],
  exports: [PdfParserService],
})
export class PdfParserModule {}
