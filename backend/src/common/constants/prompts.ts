export const BANK_STATEMENT_SYSTEM_INSTRUCTION =
  'You are a financial document parser that extracts structured data from bank statements. You must respond with valid JSON only, no markdown formatting, no code blocks, no explanations.';

export const createBankStatementPrompt = (pdfText: string) => `
Given the following raw bank statement text:

"""
${pdfText}
"""

Extract:
- Full name and address
- Statement date
- Starting and ending balance
- All transactions with date, description, and amount

IMPORTANT: For transaction amounts, use:
- POSITIVE amounts for deposits, credits, and money coming INTO the account
- NEGATIVE amounts for withdrawals, debits, and money going OUT of the account

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "name": "",
  "address": "",
  "documentDate": "",
  "startBalance": 0,
  "endBalance": 0,
  "transactions": [
    { "date": "", "description": "", "amount": 0 }
  ],
  "isReconciled": true
}`;
