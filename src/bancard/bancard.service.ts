import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import { BrandDto, ServiceDetailDto, BillDto, PaymentDto, ApiResponseDto } from '../common/dto/common.dto';
import { PaymentRequestDto, ReverseRequestDto, InvoicesQueryDto, CommissionQueryDto } from '../common/dto/payment.dto';

@Injectable()
export class BancardService {
  private readonly logger = new Logger(BancardService.name);
  private readonly baseUrl: string;
  private readonly publicKey: string;
  private readonly privateKey: string;
  
  constructor() {
    // URLs según el ambiente
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://comercios.bancard.com.py/epos-public-proxy/api'
      : 'https://desa.infonet.com.py/epos-public-proxy/api';
    
    // Credenciales desde variables de entorno
    this.publicKey = process.env.BANCARD_PUBLIC_KEY;
    this.privateKey = process.env.BANCARD_PRIVATE_KEY;
    
    if (!this.publicKey || !this.privateKey) {
      throw new Error('Las credenciales de Bancard no están configuradas en las variables de entorno');
    }
  }

  private getAuthHeaders() {
    const credentials = `${this.publicKey}:${this.privateKey}`;
    const base64Credentials = Buffer.from(credentials).toString('base64');
    console.log("base64Credentials", base64Credentials);
    return {
      'Authorization': `Basic ${base64Credentials}`,
      'Content-Type': 'application/json'
    };
  }

  private handleError(error: any) {
    this.logger.error('Error en llamada a API externa', error.response?.data || error.message);
    console.log("error", error);
    if (error.response?.data) {
      const errorData = error.response.data;
      if (errorData.messages) {
        throw new BadRequestException(errorData.messages);
      }
    }
    
    throw new InternalServerErrorException('Error interno del servidor');
  }

  async getBrands(): Promise<ApiResponseDto<{ brands: BrandDto[] }>> {
    try {
      const headers = this.getAuthHeaders();
      const response: AxiosResponse = await axios.get(`${this.baseUrl}/0.1/brands`, { headers });
      
      return {
        status: 'success',
        data: { brands: response.data.brands }
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async getServiceDetails(
    serviceId: number,
    extraAttributes?: string[]
  ): Promise<ApiResponseDto<{ service: ServiceDetailDto }>> {
    try {
      const headers = this.getAuthHeaders();
      let url = `${this.baseUrl}/0.1/services/${serviceId}`;
      
      if (extraAttributes?.length) {
        const params = extraAttributes.map(attr => `extra_response_attributes[]=${attr}`).join('&');
        url += `?${params}`;
      }
      
      const response: AxiosResponse = await axios.get(url, { headers });
      
      return {
        status: 'success',
        data: { service: response.data.service }
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async getInvoices(
    query: InvoicesQueryDto
  ): Promise<ApiResponseDto<{ bills: BillDto[] }>> {
    try {
      const headers = this.getAuthHeaders();
      const params = new URLSearchParams();
      params.append('service_id', query.service_id.toString());

      // IMPORTANTE: Bancard espera customer_fields[] (sin índice), no customer_fields[0]
      query.customer_fields.forEach((field) => {
        params.append('customer_fields[]', field);
      });

      const fullUrl = `${this.baseUrl}/0.1/invoices?${params.toString()}`;
      this.logger.debug(`Consultando facturas: ${fullUrl}`);
      this.logger.debug(`customer_fields enviados: ${JSON.stringify(query.customer_fields)}`);

      const response: AxiosResponse = await axios.get(fullUrl, { headers });

      return {
        status: 'success',
        data: { bills: response.data.bills }
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async getCommissions(
    serviceId: number,
    query: CommissionQueryDto
  ): Promise<ApiResponseDto<any>> {
    try {
      const headers = this.getAuthHeaders();
      const params = new URLSearchParams();
      params.append('amount', query.amount.toString());

      // IMPORTANTE: Bancard espera customer_fields[] (sin índice)
      query.customer_fields?.forEach((field) => {
        params.append('customer_fields[]', field);
      });

      const fullUrl = `${this.baseUrl}/0.1/services/${serviceId}/commissions?${params.toString()}`;
      this.logger.debug(`Consultando comisiones: ${fullUrl}`);

      const response: AxiosResponse = await axios.get(fullUrl, { headers });

      return {
        status: 'success',
        data: response.data
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async makePayment(
    serviceId: number,
    paymentData: PaymentRequestDto
  ): Promise<ApiResponseDto<{ payment: PaymentDto }>> {
    try {
      const headers = this.getAuthHeaders();

      // Transformar snake_case a camelCase para Bancard
      const bancardPayload = this.transformPaymentToCamelCase(paymentData);

      this.logger.debug(`Enviando pago a Bancard: ${JSON.stringify(bancardPayload)}`);

      const response: AxiosResponse = await axios.post(
        `${this.baseUrl}/0.1/services/${serviceId}/payment`,
        bancardPayload,
        { headers }
      );

      return {
        status: 'success',
        data: { payment: response.data.payment }
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Transforma el payload de pago de snake_case a camelCase según la API de Bancard
   */
  private transformPaymentToCamelCase(paymentData: PaymentRequestDto): Record<string, any> {
    const payload: Record<string, any> = {
      amount: paymentData.amount,
      transactionId: paymentData.transaction_id,
      customerFields: paymentData.customer_fields,
      customerTemporaryFields: paymentData.customer_temporary_fields,
      billFields: paymentData.bill_fields,
      additionalDataFields: paymentData.additional_data_fields,
      meanOfPayment: paymentData.mean_of_payment
    };

    // Campos opcionales
    if (paymentData.commission_bill_fields?.length) {
      payload.commissionBillFields = paymentData.commission_bill_fields;
    }
    if (paymentData.commerce_code !== undefined) {
      payload.commerceCode = paymentData.commerce_code;
    }
    if (paymentData.commerce_branch_code !== undefined) {
      payload.commerceBranchCode = paymentData.commerce_branch_code;
    }

    return payload;
  }

  async reversePayment(
    serviceId: number,
    reverseData: ReverseRequestDto
  ): Promise<ApiResponseDto<any>> {
    try {
      const headers = this.getAuthHeaders();

      // Transformar snake_case a camelCase para Bancard
      const bancardPayload = this.transformReverseToCamelCase(reverseData);

      this.logger.debug(`Enviando reverso a Bancard: ${JSON.stringify(bancardPayload)}`);

      const response: AxiosResponse = await axios.post(
        `${this.baseUrl}/0.1/services/${serviceId}/reverse`,
        bancardPayload,
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

  /**
   * Transforma el payload de reverso de snake_case a camelCase según la API de Bancard
   */
  private transformReverseToCamelCase(reverseData: ReverseRequestDto): Record<string, any> {
    const payload: Record<string, any> = {
      transactionId: reverseData.transaction_id,
      amount: reverseData.amount,
      customerFields: reverseData.customer_fields,
      customerTemporaryFields: reverseData.customer_temporary_fields,
      billFields: reverseData.bill_fields,
      additionalDataFields: reverseData.additional_data_fields,
      meanOfPayment: reverseData.mean_of_payment
    };

    if (reverseData.commerce_code !== undefined) {
      payload.commerceCode = reverseData.commerce_code;
    }
    if (reverseData.commerce_branch_code !== undefined) {
      payload.commerceBranchCode = reverseData.commerce_branch_code;
    }

    return payload;
  }

  // Método para pagos con tarjeta (sin confirmar)
  async makeCardPayment(
    serviceId: number,
    paymentData: PaymentRequestDto
  ): Promise<ApiResponseDto<{ service_code: string }>> {
    try {
      const headers = this.getAuthHeaders();

      // Transformar snake_case a camelCase para Bancard
      const bancardPayload = this.transformPaymentToCamelCase(paymentData);

      this.logger.debug(`Enviando pago con tarjeta a Bancard: ${JSON.stringify(bancardPayload)}`);

      const response: AxiosResponse = await axios.post(
        `${this.baseUrl}/0.1/services/${serviceId}/payment/cards`,
        bancardPayload,
        { headers }
      );

      return {
        status: 'success',
        data: { service_code: response.data.service_code }
      };
    } catch (error) {
      this.handleError(error);
    }
  }
}