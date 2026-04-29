import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwaggerDocs(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('LedgerLens API')
    .setDescription('API for asynchronous bank statement parsing and AI-assisted extraction')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
}
