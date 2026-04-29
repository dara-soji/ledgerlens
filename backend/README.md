# PDF Parser Module

A NestJS module for parsing bank statement PDF files with background processing.

## Tech Stack

- **[NestJS](https://nestjs.com/)** - Node.js framework
- **[Bull.js](https://github.com/OptimalBits/bull)** - Queue management
- **[Redis](https://redis.io/)** - Queue storage
- **[PDF-Parse](https://www.npmjs.com/package/pdf-parse)** - PDF text extraction

## Documentation & Monitoring

- **[API Documentation (Swagger)](http://localhost:4000/v1/api)** - Interactive API documentation
- **[Bull Queue Dashboard](http://localhost:4000/v1/queues)** - Real-time queue monitoring and job management
- [NestJS Documentation](https://docs.nestjs.com/)
- [Bull.js Documentation](https://github.com/OptimalBits/bull/blob/develop/REFERENCE.md)
- [Redis Documentation](https://redis.io/docs/)

## Queue Management

The application uses Bull Queue for background processing of PDF parsing jobs. You can monitor and manage queues through the Bull Board dashboard:

### Bull Queue Dashboard Features:
- **Job Status Monitoring** - View active, completed, failed, and delayed jobs
- **Job Details** - Inspect job data, progress, and error logs
- **Queue Statistics** - Monitor throughput and performance metrics
- **Job Management** - Retry failed jobs or clean completed ones

**Access the dashboard at:** [http://localhost:4000/v1/queues](http://localhost:4000/v1/queues)

## Prerequisites

- Node.js 18+
- OpenAI API key

## Environment Variables

```bash
OPENAI_API_KEY=your_openai_api_key
REDIS_URL=redis://localhost:6379  # I provided a default
LLM_PROVIDER=openai               # Optional, defaults to openai
```

## How to Run
1. **Install dependencies:**
```bash
npm install
```

2. **Start the application:**
```bash
# Development
npm run start:dev

## How to Test

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run e2e tests
npm run test:e2e

# Test coverage
npm run test:cov
```