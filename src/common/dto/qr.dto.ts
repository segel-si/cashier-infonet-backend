import { IsString, IsInt, IsArray, IsOptional, IsBoolean, IsEmail, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PaymentQRRequestDto {
  @ApiProperty({ description: 'Monto que se desea pagar (solo la deuda, sin comisión)', example: 1000000 })
  @IsInt()
  amount: number;

  @ApiProperty({
    description: 'true si el usuario paga la comisión, false en caso contrario',
    example: false
  })
  @IsBoolean()
  user_pays_commission: boolean;

  @ApiProperty({ description: 'Código de moneda (600 para Guaraníes)', example: 600 })
  @IsInt()
  currency: number;

  @ApiProperty({ description: 'ID del comercio', example: 10069 })
  @IsInt()
  commerce_id: number;

  @ApiProperty({ description: 'ID de la sucursal del comercio', example: 46761 })
  @IsInt()
  commerce_branch_id: number;

  @ApiPropertyOptional({ description: 'ID del producto/servicio', example: 8 })
  @IsOptional()
  @IsInt()
  product_id?: number;

  @ApiPropertyOptional({
    description: 'Tipo de medio de pago para comisión: 1=Crédito, 2=Débito, 4=Débito en cuenta, 5=Billeteras. Requerido cuando user_pays_commission=true',
    example: 2,
    enum: [1, 2, 4, 5]
  })
  @IsOptional()
  @IsInt()
  commission_card_type?: number;

  @ApiPropertyOptional({
    description: 'Monto de la comisión calculada según el medio de pago. Requerido cuando user_pays_commission=true',
    example: 2200
  })
  @IsOptional()
  @IsInt()
  commission_amount?: number;

  @ApiProperty({
    description: 'Identificador de abonado (field_type: 0). Para campos numéricos que empiezan con cero (098, 099), enviar como string',
    example: ['0981111111'],
    type: [String]
  })
  @IsArray()
  customer_fields: (string | number)[];

  @ApiPropertyOptional({
    description: 'Identificador temporal de abonado (field_type: 3)',
    example: [],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  customer_temporary_fields?: (string | number)[];

  @ApiPropertyOptional({
    description: 'Identificador de la factura (field_type: 1). Usado en productos con consulta',
    example: ['1-PGE140000020000-10'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  bill_identifier?: (string | number)[];

  @ApiPropertyOptional({
    description: 'Datos adicionales (field_type: 2)',
    example: ['Operacion 1-PGE140000020000 - PEREZ, JUAN'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  additional_data_fields?: (string | number)[];

  @ApiPropertyOptional({ description: 'Descripción de la factura', example: 'Pago de impuesto' })
  @IsOptional()
  @IsString()
  bill_description?: string;

  @ApiPropertyOptional({ description: 'Nombre del pagador (en caso de pagar comisión)', example: 'Juan Perez' })
  @IsOptional()
  @IsString()
  payer_name?: string;

  @ApiPropertyOptional({ description: 'RUC del pagador (en caso de pagar comisión)', example: '12345678-9' })
  @IsOptional()
  @IsString()
  payer_ruc?: string;

  @ApiPropertyOptional({ description: 'Correo electrónico del pagador (en caso de pagar comisión)', example: 'juan@email.com' })
  @IsOptional()
  @IsEmail()
  payer_email?: string;
}

export class PaymentQRResponseDto {
  @ApiProperty({ description: 'Identificador del QR', example: 3229 })
  @IsInt()
  id: number;

  @ApiProperty({ description: 'Monto del pago', example: '10000.0' })
  @IsString()
  amount: string;

  @ApiPropertyOptional({ description: 'Monto de la comisión para el usuario final', example: '2200.0' })
  @IsOptional()
  @IsString()
  commission_amount?: string;

  @ApiProperty({ description: 'Si es usuario paga comisión', example: false })
  @IsBoolean()
  user_pays_commission: boolean;

  @ApiProperty({ description: 'Moneda del monto (600 es GS)', example: 600 })
  @IsInt()
  currency: number;

  @ApiProperty({ description: 'Tiempo de vida útil del QR', example: '2025-07-10T13:18:08+00:00' })
  @IsString()
  expiration_datetime: string;

  @ApiProperty({ description: 'Si el QR está habilitado', example: true })
  @IsBoolean()
  available: boolean;

  @ApiProperty({ description: 'Alias del QR comercio. Identifica la transacción del pago QR', example: 'IESBK80536' })
  @IsString()
  hook_alias: string;

  @ApiProperty({ description: 'URL de la imagen del QR', example: 'https://desa.infonet.com.py:8035/s4/public/epos_qr_images/IESBK80536_1752067089.png' })
  @IsString()
  qr_url: string;

  @ApiProperty({ description: 'ID del comercio', example: 10069 })
  @IsInt()
  commerce_id: number;

  @ApiProperty({ description: 'Nombre del comercio', example: 'SUPERMERCADOS MARAVILLA' })
  @IsString()
  commerce_name: string;

  @ApiProperty({ description: 'ID de la sucursal', example: 15043 })
  @IsInt()
  commerce_branch_id: number;

  @ApiProperty({ description: 'Nombre de la sucursal', example: 'SUC SUP.MARAVILLA' })
  @IsString()
  commerce_branch_name: string;

  @ApiProperty({ description: 'Fecha de creación', example: '2025-07-09T13:18:08Z' })
  @IsString()
  created_at: string;

  @ApiProperty({ description: 'Fecha de actualización', example: '2025-07-09T13:18:09Z' })
  @IsString()
  updated_at: string;

  @ApiProperty({ description: 'Tiempo máximo en pantalla del QR (segundos)', example: 300 })
  @IsInt()
  screen_time: number;

  @ApiProperty({ description: 'Cadena de texto conteniendo el QR en formato EMVCo', example: '00020101021202051006951300014py.com.bancard...' })
  @IsString()
  qr_data: string;
}

// DTOs para confirmación de pago (webhook que Bancard llama al comercio)

export class CommissionBillDto {
  @ApiProperty({ description: 'Nombre del comercio', example: 'BANCARD S.A.' })
  @IsString()
  commerce_name: string;

  @ApiProperty({ description: 'Dirección del comercio', example: 'AV. BRASILIA 765 E/ SIRIA Y FRAY LUIS DE LEÓN' })
  @IsString()
  commerce_address: string;

  @ApiProperty({ description: 'Teléfono del comercio', example: '416 1000' })
  @IsString()
  commerce_telephone: string;

  @ApiProperty({ description: 'RUC del comercio', example: '80013884-8' })
  @IsString()
  commerce_ruc: string;

  @ApiProperty({ description: 'Timbrado legal', example: '12022114' })
  @IsString()
  legal_stamp: string;

  @ApiProperty({ description: 'Fecha de vigencia', example: '01/03/2017' })
  @IsString()
  effective_date: string;

  @ApiProperty({ description: 'Fecha de vencimiento', example: '31/03/2018' })
  @IsString()
  due_date: string;

  @ApiProperty({ description: 'Número de factura', example: '001-010-0001616' })
  @IsString()
  bill_number: string;

  @ApiProperty({ description: 'Fecha de factura', example: '10/11/2017' })
  @IsString()
  bill_date: string;

  @ApiProperty({ description: 'Nombre del cliente', example: 'Victor Alarcon' })
  @IsString()
  client_name: string;

  @ApiProperty({ description: 'RUC del cliente', example: '4179710-8' })
  @IsString()
  client_ruc: string;

  @ApiProperty({ description: 'Descripción de la comisión', example: 'SERVICIO COBRANZA' })
  @IsString()
  commission_description: string;

  @ApiProperty({ description: 'Número de comisiones cobradas', example: '1' })
  @IsString()
  number_of_commissions_charged: string;

  @ApiProperty({ description: 'Monto total de comisión', example: 9350 })
  @IsInt()
  commission_total_amount: number;

  @ApiProperty({ description: 'Total a pagar', example: 9350 })
  @IsInt()
  total_to_pay: number;

  @ApiProperty({ description: 'Total exento', example: 0 })
  @IsInt()
  total_exempt: number;

  @ApiProperty({ description: 'Subtotal 5%', example: 0 })
  @IsInt()
  subtotal_5_percent: number;

  @ApiProperty({ description: 'Subtotal 10%', example: 9350 })
  @IsInt()
  subtotal_10_percent: number;

  @ApiProperty({ description: 'Total IVA 5%', example: 0 })
  @IsInt()
  total_iva_5_percent: number;

  @ApiProperty({ description: 'Total IVA 10%', example: 850 })
  @IsInt()
  total_iva_10_percent: number;
}

export class PaymentDetailsDto {
  @ApiProperty({ description: 'Número de ticket', example: 269304581 })
  @IsInt()
  ticket_number: number;

  @ApiProperty({ description: 'CRC de verificación', example: 'a58a6a03279454698cde7c0f606a8ad0' })
  @IsString()
  crc: string;

  @ApiProperty({ description: 'Datos adicionales del comprobante', example: ['ESTE ES SU COMPROBANTE, CONSERVELO...'] })
  @IsArray()
  additional_data: string[];

  @ApiPropertyOptional({ description: 'Número de ticket de comisión', example: '269304582' })
  @IsOptional()
  @IsString()
  commission_ticket_number?: string;

  @ApiPropertyOptional({ description: 'Monto de comisión', example: 3300 })
  @IsOptional()
  @IsInt()
  commission_amount?: number;

  @ApiPropertyOptional({ description: 'Datos de factura de comisión', type: CommissionBillDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CommissionBillDto)
  commission_bill?: CommissionBillDto;
}

export class QRConfirmationDto {
  @ApiProperty({ description: 'Estado de la confirmación', example: 'success' })
  @IsString()
  status: string;

  @ApiProperty({ description: 'Alias del pago (hook_alias del QR generado)', example: 'IBEQC93618' })
  @IsString()
  payment_alias: string;

  @ApiProperty({ description: 'Detalles del pago', type: PaymentDetailsDto })
  @ValidateNested()
  @Type(() => PaymentDetailsDto)
  payment: PaymentDetailsDto;
}

export class QRConfirmationMessageDto {
  @ApiProperty({ description: 'Nivel del mensaje: info, error, warning', example: 'info' })
  @IsString()
  level: string;

  @ApiProperty({ description: 'Clave del mensaje', example: 'success' })
  @IsString()
  key: string;

  @ApiProperty({ description: 'Descripción del mensaje', example: 'Pago recibido con éxito' })
  @IsString()
  description: string;
}

export class QRConfirmationResponseDto {
  @ApiProperty({ description: 'Estado de la respuesta: success o error', example: 'success' })
  @IsString()
  status: 'success' | 'error';

  @ApiProperty({
    description: 'Mensajes de respuesta',
    type: [QRConfirmationMessageDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QRConfirmationMessageDto)
  message: QRConfirmationMessageDto[];
}

// DTO para respuesta de deshabilitar QR
export class DisableQRResponseDto {
  @ApiProperty({ description: 'Estado de la operación', example: 'success' })
  @IsString()
  status: string;

  @ApiProperty({ description: 'Datos del QR deshabilitado', type: PaymentQRResponseDto })
  @ValidateNested()
  @Type(() => PaymentQRResponseDto)
  payment_hook: PaymentQRResponseDto;
}
