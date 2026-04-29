import {
  IsString,
  IsNumber,
  IsArray,
  IsBoolean,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { HasMimeType, MaxFileSize } from 'nestjs-form-data';
import { FileSystemStoredFile } from 'nestjs-form-data';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export class SingleFileDto {
  @MaxFileSize(MAX_FILE_SIZE)
  @HasMimeType(['application/pdf'])
  file: FileSystemStoredFile;
}

export class TransactionDto {
  @IsString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  amount: number;
}

export class ParsedStatementDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  documentDate: string;

  @IsNumber()
  startBalance: number;

  @IsNumber()
  endBalance: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransactionDto)
  transactions: TransactionDto[];

  @IsBoolean()
  isReconciled: boolean;
}
