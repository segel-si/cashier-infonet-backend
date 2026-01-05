import {
  Controller,
  Post,
  Put,
  Param,
  Body,
  ParseIntPipe,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { QRService } from './qr.service';
import {
  PaymentQRRequestDto,
  PaymentQRResponseDto,
  QRConfirmationDto,
  QRConfirmationResponseDto,
  DisableQRResponseDto
} from '../common/dto/qr.dto';

@ApiTags('QR Pagos de Servicios')
@Controller('0.1')
export class QRController {
  private readonly logger = new Logger(QRController.name);

  constructor(private readonly qrService: QRService) {}

  @Post('services/:serviceId/payment-qr')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generar código QR para pago (5.10.1)',
    description: `Genera un código QR único a partir de los datos proporcionados por el cliente final.

**Criterios importantes:**
- Si el producto tiene commission_bill_fields = [], enviar user_pays_commission: false
- Si el producto tiene commission_bill_fields con contenido, se debe:
  1. Listar los medios de pago disponibles
  2. Llamar al servicio commission para obtener la comisión
  3. Enviar user_pays_commission: true con los datos de comisión

**Tipos de medio de pago (commission_card_type):**
- 1: Tarjeta de Crédito
- 2: Tarjeta de Débito
- 4: Débito en cuenta (caja de ahorro)
- 5: Billeteras (solo zimple)

**Nota:** Para campos numéricos que empiezan con cero (098, 099, 097), es mejor enviarlos como string.`
  })
  @ApiParam({
    name: 'serviceId',
    description: 'Identificador del servicio',
    type: 'number',
    example: 8
  })
  @ApiBody({
    type: PaymentQRRequestDto,
    description: 'Datos para generar el QR de pago',
    examples: {
      sinConsultaSinComision: {
        summary: 'Pago directo (sin consulta, sin comisión)',
        value: {
          amount: 10000,
          user_pays_commission: false,
          currency: 600,
          commerce_id: 10069,
          commerce_branch_id: 46761,
          product_id: 8,
          customer_fields: ['0981111111']
        }
      },
      conConsultaSinComision: {
        summary: 'Producto con consulta, sin comisión',
        value: {
          amount: 150000,
          user_pays_commission: false,
          currency: 600,
          commerce_id: 10069,
          commerce_branch_id: 46761,
          commission_card_type: 2,
          customer_fields: ['4179710'],
          bill_identifier: ['1-PGE140000020000-10'],
          additional_data_fields: ['Operacion 1-PGE140000020000 - PEREZ, JUAN'],
          bill_description: 'AIRE ACOND. JAM SPLIT 12.'
        }
      },
      conConsultaConComision: {
        summary: 'Producto con consulta y usuario paga comisión',
        value: {
          amount: 1000000,
          commission_amount: 2200,
          user_pays_commission: true,
          currency: 600,
          commerce_id: 10069,
          commerce_branch_id: 46761,
          commission_card_type: 2,
          product_id: 196,
          customer_fields: ['4179710'],
          bill_identifier: ['30630763513', '100000'],
          additional_data_fields: ['JUAN CARLOS, PEREZ'],
          bill_description: 'Pago de impuesto'
        }
      },
      sinConsultaConComision: {
        summary: 'Producto sin consulta y usuario paga comisión',
        value: {
          amount: 1000000,
          commission_amount: 1100,
          user_pays_commission: true,
          currency: 600,
          commerce_id: 10069,
          commerce_branch_id: 46761,
          commission_card_type: 5,
          customer_fields: ['GP1', 123654785, '1', '4111111', '2', 'Lucas Candia']
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'QR de pago generado exitosamente',
    schema: {
      example: {
        status: 'success',
        data: {
          payment_qr: {
            id: 3229,
            amount: '10000.0',
            commission_amount: null,
            user_pays_commission: false,
            currency: 600,
            expiration_datetime: '2025-07-10T13:18:08+00:00',
            available: true,
            hook_alias: 'IESBK80536',
            qr_url: 'https://desa.infonet.com.py:8035/s4/public/epos_qr_images/IESBK80536_1752067089.png',
            commerce_id: 10069,
            commerce_name: 'SUPERMERCADOS MARAVILLA',
            commerce_branch_id: 15043,
            commerce_branch_name: 'SUC SUP.MARAVILLA',
            created_at: '2025-07-09T13:18:08Z',
            updated_at: '2025-07-09T13:18:09Z',
            screen_time: 300,
            qr_data: '00020101021202051006951300014py.com.bancard0108BANCPYPA...'
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
    schema: {
      example: {
        status: 'error',
        messages: [{ level: 'error', key: 'InvalidMetadataValueError', dsc: 'El valor ingresado para el campo es inválido.' }]
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Comercio o sucursal no encontrado',
    schema: {
      example: {
        status: 'error',
        messages: [{ level: 'error', key: 'CommerceNotFoundError', dsc: 'No se ha encontrado el comercio' }]
      }
    }
  })
  async generatePaymentQR(
    @Param('serviceId', ParseIntPipe) serviceId: number,
    @Body(ValidationPipe) qrData: PaymentQRRequestDto
  ) {
    this.logger.log(`Generando QR para servicio ${serviceId}`);
    return await this.qrService.generatePaymentQR(serviceId, qrData);
  }

  @Put('payment-hooks/:hookAlias/disable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Deshabilitar QR de pago (5.10.3)',
    description: `Deshabilita un código QR para evitar su uso.

**Criterios para llamar a este servicio (opcionales):**
- Cuando el cliente (cajero) le da al botón salir o atrás a la pantalla de QR
- Cuando haya pasado el tiempo de espera de confirmación de la lectura de un QR (screen_time)`
  })
  @ApiParam({
    name: 'hookAlias',
    description: 'Alias del QR generado (hook_alias)',
    type: 'string',
    example: 'ISJKZ35281'
  })
  @ApiResponse({
    status: 200,
    description: 'QR deshabilitado exitosamente',
    schema: {
      example: {
        status: 'success',
        data: {
          payment_hook: {
            id: 3237,
            amount: '1000000.0',
            commission_amount: '2200.0',
            user_pays_commission: true,
            currency: 600,
            expiration_datetime: '2025-07-10T14:54:09Z',
            available: false,
            hook_alias: 'ISJKZ35281',
            qr_url: 'https://desa.infonet.com.py:8035/s4/public/epos_qr_images/ISJKZ35281_1752072849.png',
            commerce_id: 10069,
            commerce_name: 'SUPERMERCADOS MARAVILLA',
            commerce_branch_id: 15043,
            commerce_branch_name: 'SUC SUP.MARAVILLA',
            created_at: '2025-07-09T14:54:09Z',
            updated_at: '2025-07-09T14:54:22Z'
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'QR no encontrado',
    schema: {
      example: {
        status: 'error',
        messages: [{ level: 'error', key: 'PaymentHookNotFoundError', dsc: 'Payment hook not found.' }]
      }
    }
  })
  async disablePaymentQR(@Param('hookAlias') hookAlias: string) {
    this.logger.log(`Deshabilitando QR: ${hookAlias}`);
    return await this.qrService.disablePaymentQR(hookAlias);
  }

  @Post('payment-confirmation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Recibir confirmación de pago QR (5.10.2)',
    description: `**Endpoint de ejemplo** para recibir confirmaciones de pago desde Bancard.

**IMPORTANTE:** Este endpoint debe ser implementado por el comercio y la URL debe ser proporcionada a Bancard para su configuración.

**Consideraciones:**
- El tiempo promedio de respuesta esperado por Bancard es de 10 segundos
- Si no se recibe respuesta, el pago quedará anulado indicando al cliente final que hubo un error
- El payment_alias corresponde al hook_alias del QR generado`
  })
  @ApiBody({
    type: QRConfirmationDto,
    description: 'Datos de confirmación del pago enviados por Bancard',
    examples: {
      confirmacionExitosa: {
        summary: 'Confirmación de pago exitoso',
        value: {
          status: 'success',
          payment_alias: 'IBEQC93618',
          payment: {
            ticket_number: 269304581,
            crc: 'a58a6a03279454698cde7c0f606a8ad0',
            additional_data: ['ESTE ES SU COMPROBANTE, CONSERVELO...'],
            commission_ticket_number: '269304582',
            commission_amount: 3300,
            commission_bill: {
              commerce_name: 'BANCARD S.A.',
              commerce_address: 'AV. BRASILIA 765 E/ SIRIA Y FRAY LUIS DE LEÓN',
              commerce_telephone: '416 1000',
              commerce_ruc: '80013884-8',
              legal_stamp: '12022114',
              effective_date: '01/03/2017',
              due_date: '31/03/2018',
              bill_number: '001-010-0001616',
              bill_date: '10/11/2017',
              client_name: 'Victor Alarcon',
              client_ruc: '4179710-8',
              commission_description: 'SERVICIO COBRANZA',
              number_of_commissions_charged: '1',
              commission_total_amount: 9350,
              total_to_pay: 9350,
              total_exempt: 0,
              subtotal_5_percent: 0,
              subtotal_10_percent: 9350,
              total_iva_5_percent: 0,
              total_iva_10_percent: 850
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Confirmación procesada exitosamente',
    type: QRConfirmationResponseDto,
    examples: {
      exitoso: {
        summary: 'Respuesta exitosa',
        value: {
          status: 'success',
          message: [{ level: 'info', key: 'success', description: 'Pago recibido con éxito' }]
        }
      },
      error: {
        summary: 'Respuesta con error',
        value: {
          status: 'error',
          message: [{ level: 'error', key: 'error', description: 'Error al confirmar el pago' }]
        }
      }
    }
  })
  async receivePaymentConfirmation(
    @Body(ValidationPipe) confirmationData: QRConfirmationDto
  ): Promise<QRConfirmationResponseDto> {
    try {
      // Aquí el comercio procesaría la confirmación del pago
      // Por ejemplo: actualizar base de datos, generar recibo, etc.
      this.logger.log(`Confirmación de pago recibida: ${confirmationData.payment_alias}`);
      this.logger.debug('Datos de confirmación:', confirmationData);

      // TODO: Implementar lógica de negocio del comercio
      // - Validar que el payment_alias corresponda a un QR generado
      // - Actualizar estado del pago en base de datos
      // - Generar comprobante para el cliente
      // - Notificar al sistema de caja

      return {
        status: 'success',
        message: [{
          level: 'info',
          key: 'success',
          description: 'Pago recibido con éxito'
        }]
      };
    } catch (error) {
      this.logger.error('Error al procesar confirmación de pago:', error);
      return {
        status: 'error',
        message: [{
          level: 'error',
          key: 'error',
          description: 'Error al confirmar el pago'
        }]
      };
    }
  }
}
