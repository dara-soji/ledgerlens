import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { ParsedStatementDto } from '../../modules/pdf-parser/dto/parsed-statement.dto';

/**
 * Validates and transforms raw data into a ParsedStatementDto
 * @param data Raw data to validate and transform
 * @returns Validated ParsedStatementDto
 * @throws Error if validation fails
 */
export function validateAndTransformResult(data: any): ParsedStatementDto {
  const transformed = plainToInstance(ParsedStatementDto, data);
  const errors = validateSync(transformed);

  if (errors.length > 0) {
    throw new Error(
      `Invalid statement data structure: ${errors.map((e) => Object.values(e.constraints || {}).join(', ')).join('; ')}`,
    );
  }

  return transformed;
}

/**
 * Validates if the statement transactions reconcile with start and end balances
 * Updates the isReconciled property on the result object
 * @param result ParsedStatementDto to validate reconciliation for
 */
export function validateReconciliation(result: ParsedStatementDto): void {
  const transactionSum = result.transactions.reduce(
    (sum, transaction) => sum + transaction.amount,
    0,
  );

  // Allow for small rounding errors (less than 1 cent)
  result.isReconciled =
    Math.abs(result.startBalance + transactionSum - result.endBalance) < 0.01;
}
