import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal Server Error';
    let errorKey = 'InternalServerError';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const errorResponse = exception.getResponse();
      
      if (typeof errorResponse === 'object' && errorResponse !== null) {
        message = (errorResponse as any).message || message;
        
        // Si viene un array de mensajes de la API externa, los mantenemos
        if (Array.isArray((errorResponse as any).message)) {
          const messages = (errorResponse as any).message;
          return response.status(status).send({
            status: 'error',
            messages: messages.map(msg => ({
              level: 'error',
              key: msg.key || 'Error',
              dsc: msg.dsc || msg.description || msg
            }))
          });
        }
      } else {
        message = errorResponse as string;
      }
      
      // Mapeo de errores HTTP a errores de la API según especificaciones
      switch (status) {
        case HttpStatus.BAD_REQUEST:
          errorKey = 'MissingParametersError';
          break;
        case HttpStatus.UNAUTHORIZED:
          errorKey = 'UnauthorizedError';
          break;
        case HttpStatus.NOT_FOUND:
          errorKey = 'ServiceNotFound';
          break;
        case HttpStatus.CONFLICT:
          errorKey = 'DuplicatedTransactionId';
          break;
        default:
          errorKey = 'InternalServerError';
      }
    }

    this.logger.error(
      `HTTP ${status} Error: ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    // Formato de respuesta según especificaciones de la API
    response.status(status).send({
      status: 'error',
      messages: [{
        level: 'error',
        key: errorKey,
        dsc: message
      }]
    });
  }
}