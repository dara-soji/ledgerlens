import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getApiInfo() {
    return {
      name: 'LedgerLens API',
      description:
        'API for asynchronous bank statement parsing and AI-assisted structured extraction',
      version: '1.0.0',
      endpoints: [
        {
          path: '/api/parse-bank-statement',
          method: 'POST',
          description: 'Upload and parse a PDF bank statement',
        },
      ],
    };
  }
}
