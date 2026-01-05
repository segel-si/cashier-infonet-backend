import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  UseGuards,
  Req,
  ParseIntPipe,
  ValidationPipe,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { BasicAuthGuard } from '../auth/auth.guard';
import { CashoutService } from './cashout.service';
import { 
  CashoutCreateDto, 
  CashoutInfoDto, 
  CashoutStatusDto, 
  CashoutReverseDto 
} from '../common/dto/cashout.dto';

@Controller('0.1')
@UseGuards(BasicAuthGuard)
export class CashoutController {
  constructor(private readonly cashoutService: CashoutService) {}

  @Post('cashouts')
  async createCashout(
    @Body(ValidationPipe) cashoutData: CashoutCreateDto,
    @Req() request: FastifyRequest
  ) {
    const { publicKey, privateKey } = this.extractCredentials(request);
    return await this.cashoutService.createCashout(cashoutData, publicKey, privateKey);
  }

  @Post('cashouts/info')
  async getCashoutInfo(
    @Body(ValidationPipe) infoData: CashoutInfoDto,
    @Req() request: FastifyRequest
  ) {
    const { publicKey, privateKey } = this.extractCredentials(request);
    return await this.cashoutService.getCashoutInfo(infoData, publicKey, privateKey);
  }

  @Post('cashouts/status')
  async getCashoutStatus(
    @Body(ValidationPipe) statusData: CashoutStatusDto,
    @Req() request: FastifyRequest
  ) {
    const { publicKey, privateKey } = this.extractCredentials(request);
    return await this.cashoutService.getCashoutStatus(statusData, publicKey, privateKey);
  }

  @Post('cashouts/:serviceId/reverse')
  async reverseCashout(
    @Param('serviceId', ParseIntPipe) serviceId: number,
    @Body(ValidationPipe) reverseData: CashoutReverseDto,
    @Req() request: FastifyRequest
  ) {
    const { publicKey, privateKey } = this.extractCredentials(request);
    return await this.cashoutService.reverseCashout(serviceId, reverseData, publicKey, privateKey);
  }

  private extractCredentials(request: FastifyRequest): { publicKey: string; privateKey: string } {
    const authHeader = request.headers.authorization;
    const base64Credentials = authHeader.slice(6);
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [publicKey, privateKey] = credentials.split(':');
    
    return { publicKey, privateKey };
  }
}