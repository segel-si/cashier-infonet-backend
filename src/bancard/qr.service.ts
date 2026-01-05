import { Injectable, Logger, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import { ApiResponseDto } from '../common/dto/common.dto';
import { PaymentQRRequestDto, PaymentQRResponseDto, DisableQRResponseDto } from '../common/dto/qr.dto';

@Injectable()
export class QRService {
  private readonly logger = new Logger(QRService.name);
  private readonly baseUrl: string;
  private readonly publicKey: string;
  private readonly privateKey: string;

  constructor() {
    this.baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://comercios.bancard.com.py/epos-public-proxy/api'
      : 'https://desa.infonet.com.py/epos-public-proxy/api';

    this.publicKey = process.env.BANCARD_PUBLIC_KEY;
    this.privateKey = process.env.BANCARD_PRIVATE_KEY;

    if (!this.publicKey || !this.privateKey) {
      throw new Error('Las credenciales de Bancard no están configuradas en las variables de entorno');
    }
  }

  private getAuthHeaders() {
    const credentials = `${this.publicKey}:${this.privateKey}`;
    const base64Credentials = Buffer.from(credentials).toString('base64');

    return {
      'Authorization': `Basic ${base64Credentials}`,
      'Content-Type': 'application/json'
    };
  }

  private handleError(error: any) {
    this.logger.error('Error en llamada a API de QR', error.response?.data || error.message);

    if (error.response?.data) {
      const errorData = error.response.data;
      const statusCode = error.response.status;

      if (errorData.messages) {
        // Mapear errores específicos según documentación 5.10.1.c
        if (statusCode === 404) {
          throw new NotFoundException({
            status: 'error',
            messages: errorData.messages
          });
        }
        throw new BadRequestException({
          status: 'error',
          messages: errorData.messages
        });
      }
    }

    throw new InternalServerErrorException({
      status: 'error',
      messages: [{ level: 'error', key: 'InternalError', dsc: 'Error interno del servidor' }]
    });
  }

  /**
   * Genera un código QR para pago de servicios
   * Según documentación 5.10.1
   */
  async generatePaymentQR(
    serviceId: number,
    qrData: PaymentQRRequestDto
  ): Promise<ApiResponseDto<{ payment_qr: PaymentQRResponseDto }>> {
    try {
      const headers = this.getAuthHeaders();

      // Validar datos según las especificaciones 5.10.1.a
      this.validateQRRequest(qrData);

      // Preparar el payload según la documentación
      const payload = this.preparePayload(qrData);

      this.logger.debug(`Generando QR para servicio ${serviceId}`, payload);

      const response: AxiosResponse = await axios.post(
        `${this.baseUrl}/0.1/services/${serviceId}/payment-qr`,
        payload,
        { headers }
      );

      return {
        status: 'success',
        data: { payment_qr: response.data.payment_qr }
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Deshabilita un código QR para evitar su uso
   * Según documentación 5.10.3
   */
  async disablePaymentQR(
    hookAlias: string
  ): Promise<ApiResponseDto<{ payment_hook: any }>> {
    try {
      const headers = this.getAuthHeaders();

      this.logger.debug(`Deshabilitando QR con alias: ${hookAlias}`);

      const response: AxiosResponse = await axios.put(
        `${this.baseUrl}/0.1/payment-hooks/${hookAlias}/disable`,
        {},
        { headers }
      );

      return {
        status: 'success',
        data: { payment_hook: response.data.payment_hook }
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Prepara el payload para enviar a la API de Bancard
   * Asegura que los campos numéricos que empiezan con cero se envíen como string
   */
  private preparePayload(qrData: PaymentQRRequestDto): Record<string, any> {
    const payload: Record<string, any> = {
      amount: qrData.amount,
      user_pays_commission: qrData.user_pays_commission,
      currency: qrData.currency,
      commerce_id: qrData.commerce_id,
      commerce_branch_id: qrData.commerce_branch_id,
      customer_fields: this.normalizeFields(qrData.customer_fields)
    };

    // Campos opcionales
    if (qrData.product_id !== undefined) {
      payload.product_id = qrData.product_id;
    }

    if (qrData.user_pays_commission) {
      payload.commission_card_type = qrData.commission_card_type;
      payload.commission_amount = qrData.commission_amount;
    }

    if (qrData.customer_temporary_fields?.length) {
      payload.customer_temporary_fields = this.normalizeFields(qrData.customer_temporary_fields);
    }

    if (qrData.bill_identifier?.length) {
      payload.bill_identifier = this.normalizeFields(qrData.bill_identifier);
    }

    if (qrData.additional_data_fields?.length) {
      payload.additional_data_fields = this.normalizeFields(qrData.additional_data_fields);
    }

    if (qrData.bill_description) {
      payload.bill_description = qrData.bill_description;
    }

    // Campos del pagador (para comisiones)
    if (qrData.payer_name) {
      payload.payer_name = qrData.payer_name;
    }
    if (qrData.payer_ruc) {
      payload.payer_ruc = qrData.payer_ruc;
    }
    if (qrData.payer_email) {
      payload.payer_email = qrData.payer_email;
    }

    return payload;
  }

  /**
   * Normaliza los campos para asegurar que valores numéricos que empiezan con 0
   * se mantengan como strings (ej: 0981111111)
   */
  private normalizeFields(fields: (string | number)[]): (string | number)[] {
    return fields.map(field => {
      // Si es string que empieza con 0 y es numérico, mantener como string
      if (typeof field === 'string') {
        return field;
      }
      return field;
    });
  }

  /**
   * Valida el request según las especificaciones de la documentación 5.10.1.a
   */
  private validateQRRequest(qrData: PaymentQRRequestDto): void {
    // Validar currency (600 para Guaraníes)
    if (qrData.currency !== 600) {
      throw new BadRequestException({
        status: 'error',
        messages: [{ level: 'error', key: 'InvalidCurrency', dsc: 'Solo se acepta currency 600 (Guaraníes)' }]
      });
    }

    // Validar que customer_fields no esté vacío
    if (!qrData.customer_fields || qrData.customer_fields.length === 0) {
      throw new BadRequestException({
        status: 'error',
        messages: [{ level: 'error', key: 'MissingCustomerFields', dsc: 'customer_fields es requerido' }]
      });
    }

    // Validar amount sea positivo
    if (qrData.amount <= 0) {
      throw new BadRequestException({
        status: 'error',
        messages: [{ level: 'error', key: 'InvalidAmount', dsc: 'El monto debe ser mayor a 0' }]
      });
    }

    // Si user_pays_commission es true, validar campos de comisión
    if (qrData.user_pays_commission) {
      if (qrData.commission_card_type === undefined || qrData.commission_card_type === null) {
        throw new BadRequestException({
          status: 'error',
          messages: [{
            level: 'error',
            key: 'MissingCommissionCardType',
            dsc: 'commission_card_type es requerido cuando user_pays_commission es true'
          }]
        });
      }

      if (qrData.commission_amount === undefined || qrData.commission_amount === null) {
        throw new BadRequestException({
          status: 'error',
          messages: [{
            level: 'error',
            key: 'MissingCommissionAmount',
            dsc: 'commission_amount es requerido cuando user_pays_commission es true'
          }]
        });
      }

      // Validar tipos de tarjeta válidos: 1=TC, 2=TD, 4=Débito en cuenta, 5=Billeteras
      const validCardTypes = [1, 2, 4, 5];
      if (!validCardTypes.includes(qrData.commission_card_type)) {
        throw new BadRequestException({
          status: 'error',
          messages: [{
            level: 'error',
            key: 'InvalidCommissionCardType',
            dsc: 'commission_card_type debe ser 1 (Crédito), 2 (Débito), 4 (Débito en cuenta) o 5 (Billeteras)'
          }]
        });
      }

      // Validar que commission_amount sea positivo
      if (qrData.commission_amount <= 0) {
        throw new BadRequestException({
          status: 'error',
          messages: [{
            level: 'error',
            key: 'InvalidCommissionAmount',
            dsc: 'El monto de comisión debe ser mayor a 0'
          }]
        });
      }
    } else {
      // Si user_pays_commission es false, commission_amount y commission_card_type deben ser nulos o vacíos
      // Esto es para productos donde el usuario NO paga comisión
      // No es necesario validar, simplemente no se envían estos campos
    }
  }
}
