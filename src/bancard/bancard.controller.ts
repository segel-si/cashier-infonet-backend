import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  ParseIntPipe,
  ValidationPipe,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { BancardService } from './bancard.service';
import { PaymentRequestDto, ReverseRequestDto, InvoicesQueryDto, CommissionQueryDto } from '../common/dto/payment.dto';

@ApiTags('bancard')
@Controller('0.1')
export class BancardController {
  private readonly logger = new Logger(BancardController.name);

  constructor(private readonly bancardService: BancardService) {}

  @Get('brands')
  @ApiOperation({ summary: 'Obtener todas las marcas disponibles' })
  @ApiResponse({ status: 200, description: 'Lista de marcas obtenida exitosamente' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async getBrands() {
    return await this.bancardService.getBrands();
  }

  @Get('services/:serviceId')
  @ApiOperation({ summary: 'Obtener detalles de un servicio específico' })
  @ApiParam({ name: 'serviceId', description: 'ID del servicio', type: 'number' })
  @ApiQuery({ name: 'extra_response_attributes', description: 'Atributos adicionales de respuesta', required: false, type: 'string', isArray: true })
  @ApiResponse({ status: 200, description: 'Detalles del servicio obtenidos exitosamente' })
  @ApiResponse({ status: 400, description: 'Parámetros inválidos' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async getServiceDetails(
    @Param('serviceId', ParseIntPipe) serviceId: number,
    @Query('extra_response_attributes') extraAttributes: string | string[]
  ) {
    // Convertir extraAttributes a array si viene como string
    const attributesArray = extraAttributes 
      ? Array.isArray(extraAttributes) 
        ? extraAttributes 
        : [extraAttributes]
      : undefined;
    
    return await this.bancardService.getServiceDetails(serviceId, attributesArray);
  }

  @Get('invoices')
  @ApiOperation({ summary: 'Obtener facturas de un servicio' })
  @ApiQuery({ name: 'service_id', description: 'ID del servicio', type: 'number' })
  @ApiQuery({ name: 'customer_fields', description: 'Campos del cliente (usar customer_fields[]=valor)', type: 'string', isArray: true })
  @ApiResponse({ status: 200, description: 'Facturas obtenidas exitosamente' })
  @ApiResponse({ status: 400, description: 'Parámetros inválidos' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async getInvoices(
    @Query('service_id', ParseIntPipe) serviceId: number,
    @Query('customer_fields') customerFields: string | string[]
  ) {
    this.logger.debug(`getInvoices - service_id: ${serviceId}`);
    this.logger.debug(`getInvoices - customer_fields raw: ${JSON.stringify(customerFields)}`);

    // Validar que customer_fields no sea undefined o null
    if (!customerFields) {
      throw new BadRequestException({
        status: 'error',
        messages: [{
          level: 'error',
          key: 'MissingCustomerFields',
          dsc: 'El parámetro customer_fields[] es requerido. Ejemplo: ?service_id=803&customer_fields[]=100000'
        }]
      });
    }

    // Convertir customerFields a array y filtrar valores nulos/undefined
    let fieldsArray: string[];
    if (Array.isArray(customerFields)) {
      fieldsArray = customerFields.filter(f => f !== null && f !== undefined && f !== '');
    } else {
      fieldsArray = customerFields ? [customerFields] : [];
    }

    // Validar que el array no esté vacío después del filtro
    if (fieldsArray.length === 0) {
      throw new BadRequestException({
        status: 'error',
        messages: [{
          level: 'error',
          key: 'EmptyCustomerFields',
          dsc: 'customer_fields[] no puede estar vacío'
        }]
      });
    }

    this.logger.debug(`getInvoices - customer_fields parsed: ${JSON.stringify(fieldsArray)}`);

    const query: InvoicesQueryDto = {
      service_id: serviceId,
      customer_fields: fieldsArray
    };

    return await this.bancardService.getInvoices(query);
  }

  @Get('services/:serviceId/commissions')
  @ApiOperation({ summary: 'Obtener comisiones de un servicio' })
  @ApiParam({ name: 'serviceId', description: 'ID del servicio', type: 'number' })
  @ApiQuery({ name: 'amount', description: 'Monto para calcular comisión', type: 'number' })
  @ApiQuery({ name: 'customer_fields', description: 'Campos del cliente', required: false, type: 'string', isArray: true })
  @ApiResponse({ status: 200, description: 'Comisiones obtenidas exitosamente' })
  @ApiResponse({ status: 400, description: 'Parámetros inválidos' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async getCommissions(
    @Param('serviceId', ParseIntPipe) serviceId: number,
    @Query('amount', ParseIntPipe) amount: number,
    @Query('customer_fields') customerFields?: string | string[]
  ) {
    const fieldsArray = customerFields 
      ? Array.isArray(customerFields) 
        ? customerFields 
        : [customerFields]
      : undefined;
    
    const query: CommissionQueryDto = {
      amount,
      customer_fields: fieldsArray
    };
    
    return await this.bancardService.getCommissions(serviceId, query);
  }

  @Post('services/:serviceId/payment')
  @ApiOperation({ summary: 'Realizar un pago' })
  @ApiParam({ name: 'serviceId', description: 'ID del servicio', type: 'number' })
  @ApiBody({ type: PaymentRequestDto, description: 'Datos del pago' })
  @ApiResponse({ status: 201, description: 'Pago realizado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos de pago inválidos' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async makePayment(
    @Param('serviceId', ParseIntPipe) serviceId: number,
    @Body(ValidationPipe) paymentData: PaymentRequestDto
  ) {
    return await this.bancardService.makePayment(serviceId, paymentData);
  }

  @Post('services/:serviceId/payment/cards')
  @ApiOperation({ summary: 'Realizar un pago con tarjeta (sin confirmar)' })
  @ApiParam({ name: 'serviceId', description: 'ID del servicio', type: 'number' })
  @ApiBody({ type: PaymentRequestDto, description: 'Datos del pago con tarjeta' })
  @ApiResponse({ status: 201, description: 'Pago con tarjeta iniciado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos de pago inválidos' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async makeCardPayment(
    @Param('serviceId', ParseIntPipe) serviceId: number,
    @Body(ValidationPipe) paymentData: PaymentRequestDto
  ) {
    return await this.bancardService.makeCardPayment(serviceId, paymentData);
  }

  @Post('services/:serviceId/reverse')
  @ApiOperation({ summary: 'Reversar un pago' })
  @ApiParam({ name: 'serviceId', description: 'ID del servicio', type: 'number' })
  @ApiBody({ type: ReverseRequestDto, description: 'Datos para reversar el pago' })
  @ApiResponse({ status: 201, description: 'Pago reversado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos de reversión inválidos' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async reversePayment(
    @Param('serviceId', ParseIntPipe) serviceId: number,
    @Body(ValidationPipe) reverseData: ReverseRequestDto
  ) {
    return await this.bancardService.reversePayment(serviceId, reverseData);
  }

}