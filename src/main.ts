import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // reject requests with wrong or extra fields
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // swagger docs at /api
  const config = new DocumentBuilder()
    .setTitle('EchoGPT API')
    .setDescription('Backend REST API for the EchoGPT Chrome extension')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();