import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import * as qs from 'qs';

async function bootstrap() {
  // Configurar Fastify con query parser que soporte arrays con brackets (customer_fields[])
  const fastifyAdapter = new FastifyAdapter({
    querystringParser: (str) => qs.parse(str),
  });

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    fastifyAdapter,
  );
  
  // Configuración de validación global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Configuración de filtro de excepciones global
  app.useGlobalFilters(new HttpExceptionFilter());

  // Configuración de CORS si es necesario
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Authorization',
  });

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('RedPagos API')
    .setDescription('API para integración con servicios de pago de Bancard')
    .setVersion('1.0')
    .addTag('bancard', 'Endpoints de Bancard')
    .addTag('cashout', 'Endpoints de Cashout')
    .addTag('qr', 'Endpoints de QR')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  const host = process.env.HOST || '0.0.0.0';
  
  await app.listen(port, host);
  console.log(`🚀 API de Comercios Bancard ejecutándose en puerto ${port}`);
  console.log(`📖 Documentación Swagger disponible en: http://${host}:${port}/api`);
}

bootstrap();