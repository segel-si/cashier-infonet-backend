import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import { ApiResponseDto } from '../common/dto/common.dto';
import { 
  CashoutCreateDto, 
  CashoutInfoDto, 
  CashoutStatusDto, 
  CashoutReverseDto,
  CashoutResponseDto 
} from '../common/dto/cashout.dto';

@Injectable()
export class CashoutService {
  private readonly logger = new Logger(CashoutService.name);
  private readonly baseUrl: string;
  
  constructor() {
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://comercios.bancard.com.py/epos-public-proxy/api'
      : 'https://desa.infonet.com.py/epos-public-proxy/api';
  }

  private getAuthHeaders(publicKey: string, privateKey: string) {
    const credentials = `${publicKey}:${privateKey}`;
    const base64Credentials = Buffer.from(credentials).toString('base64');
    
    return {
      'Authorization': `Basic ${base64Credentials}`,
      'Content-Type': 'application/json'
    };
  }

  private handleError(error: any) {
    this.logger.error('Error en llamada a API de cashouts', error.response?.data || error.message);
    
    if (error.response?.data) {
      const errorData = error.response.data;
      if (errorData.messages) {
        throw new BadRequestException(errorData.messages);
      }
    }
    
    throw new InternalServerErrorException('Error interno del servidor');
  }

  async createCashout(
    cashoutData: CashoutCreateDto,
    publicKey: string,
    privateKey: string
  ): Promise<ApiResponseDto<{ cashout: CashoutResponseDto }>> {
    try {
      const headers = this.getAuthHeaders(publicKey, privateKey);
      
      const response: AxiosResponse = await axios.post(
        `${this.baseUrl}/0.1/cashouts`,
        cashoutData,
        { headers }
      );
      
      return {
        status: 'success',
        data: { cashout: response.data.cashout }
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async getCashoutInfo(
    infoData: CashoutInfoDto,
    publicKey: string,
    privateKey: string
  ): Promise<ApiResponseDto<any>> {
    try {
      const headers = this.getAuthHeaders(publicKey, privateKey);
      
      const response: AxiosResponse = await axios.post(
        `${this.baseUrl}/0.1/cashouts/info`,
        infoData,
        { headers }
      );
      
      return {
        status: 'success',
        data: response.data
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async getCashoutStatus(
    statusData: CashoutStatusDto,
    publicKey: string,
    privateKey: string
  ): Promise<ApiResponseDto<any>> {
    try {
      const headers = this.getAuthHeaders(publicKey, privateKey);
      
      const response: AxiosResponse = await axios.post(
        `${this.baseUrl}/0.1/cashouts/status`,
        statusData,
        { headers }
      );
      
      return {
        status: 'success',
        data: response.data
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async reverseCashout(
    serviceId: number,
    reverseData: CashoutReverseDto,
    publicKey: string,
    privateKey: string
  ): Promise<ApiResponseDto<{ cashout: CashoutResponseDto }>> {
    try {
      const headers = this.getAuthHeaders(publicKey, privateKey);
      
      const response: AxiosResponse = await axios.post(
        `${this.baseUrl}/0.1/cashouts/${serviceId}/reverse`,
        reverseData,
        { headers }
      );
      
      return {
        status: 'success',
        data: { cashout: response.data.cashout }
      };
    } catch (error) {
      this.handleError(error);
    }
  }
}