import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';

@Injectable()
export class BasicAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      throw new UnauthorizedException('Basic authentication required');
    }

    try {
      const base64Credentials = authHeader.slice(6);
      const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
      console.log("credentials", credentials);
      const [publicKey, privateKey] = credentials.split(':');

      // Validar que las credenciales tengan el formato correcto
      if (!publicKey.startsWith('apps/') || !privateKey) {
        throw new UnauthorizedException('Invalid credential format');
      }

      // Validar contra las credenciales configuradas en el .env
      const validPublicKey = process.env.BANCARD_PUBLIC_KEY;
      const validPrivateKey = process.env.BANCARD_PRIVATE_KEY;

      if (publicKey !== validPublicKey || privateKey !== validPrivateKey) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Agregar información del comercio al request
      (request as any).commerce = {
        publicKey,
        id: 'example-commerce-id'
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid authentication');
    }
  }
}