import { IsString, IsInt, IsArray, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaymentRequestDto {
  @ApiProperty({ description: 'Monto del pago', example: 10000 })
  @IsInt()
  amount: number;

  @ApiProperty({ description: 'ID de transacción único', example: 'TXN123456789' })
  @IsString()
  transaction_id: string;

  @ApiProperty({ description: 'Campos del cliente', example: ['12345678', 'Juan Perez'] })
  @IsArray()
  customer_fields: string[];

  @ApiProperty({ description: 'Campos temporales del cliente', example: [] })
  @IsArray()
  customer_temporary_fields: string[];

  @ApiProperty({ description: 'Campos de la factura', example: ['001-001-0000001'] })
  @IsArray()
  bill_fields: string[];

  @ApiProperty({ description: 'Campos de datos adicionales', example: [] })
  @IsArray()
  additional_data_fields: string[];

  @ApiProperty({ description: 'Medio de pago: 0=Efectivo, 1=TC, 2=TD, 3=Cheque', example: 0 })
  @IsInt()
  mean_of_payment: number;

  @ApiPropertyOptional({ description: 'Campos de factura de comisión', example: [] })
  @IsOptional()
  @IsArray()
  commission_bill_fields?: string[];

  @ApiPropertyOptional({ description: 'Código de comercio', example: 123 })
  @IsOptional()
  @IsInt()
  commerce_code?: number;

  @ApiPropertyOptional({ description: 'Código de sucursal', example: 1 })
  @IsOptional()
  @IsInt()
  commerce_branch_code?: number;
}

export class ReverseRequestDto {
  @ApiProperty({ description: 'ID de transacción a reversar', example: 'TXN123456789' })
  @IsString()
  transaction_id: string;

  @ApiProperty({ description: 'Monto a reversar', example: 10000 })
  @IsInt()
  amount: number;

  @ApiProperty({ description: 'Campos del cliente', example: ['12345678', 'Juan Perez'] })
  @IsArray()
  customer_fields: string[];

  @ApiProperty({ description: 'Campos temporales del cliente', example: [] })
  @IsArray()
  customer_temporary_fields: string[];

  @ApiProperty({ description: 'Campos de la factura', example: ['001-001-0000001'] })
  @IsArray()
  bill_fields: string[];

  @ApiProperty({ description: 'Campos de datos adicionales', example: [] })
  @IsArray()
  additional_data_fields: string[];

  @ApiProperty({ description: 'Medio de pago: 0=Efectivo, 1=TC, 2=TD, 3=Cheque', example: 0 })
  @IsInt()
  mean_of_payment: number;

  @ApiPropertyOptional({ description: 'Código de comercio', example: 123 })
  @IsOptional()
  @IsInt()
  commerce_code?: number;

  @ApiPropertyOptional({ description: 'Código de sucursal', example: 1 })
  @IsOptional()
  @IsInt()
  commerce_branch_code?: number;
}

export class InvoicesQueryDto {
  @ApiProperty({ description: 'ID del servicio', example: 1 })
  @IsInt()
  service_id: number;

  @ApiProperty({ description: 'Campos del cliente para consultar facturas', example: ['12345678'] })
  @IsArray()
  customer_fields: string[];
}

export class CommissionQueryDto {
  @ApiProperty({ description: 'Monto para calcular comisión', example: 10000 })
  @IsInt()
  amount: number;

  @ApiPropertyOptional({ description: 'Campos del cliente', example: ['12345678'] })
  @IsOptional()
  @IsArray()
  customer_fields?: string[];
}