import { IsString, IsInt, IsBoolean, IsOptional, IsArray, IsDateString } from 'class-validator';

export class BrandDto {
  @IsInt()
  id: number;

  @IsString()
  name: string;

  @IsString()
  logo_resource_id: string;

  @IsArray()
  services: ServiceDto[];
}

export class ServiceDto {
  @IsInt()
  id: number;

  @IsString()
  name: string;

  @IsString()
  description: string;
}

export class ServiceDetailDto {
  @IsInt()
  id: number;

  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsBoolean()
  accepts_partial_payment: boolean;

  @IsOptional()
  @IsString()
  amount_hint?: string;

  @IsBoolean()
  queries_debt: boolean;

  @IsBoolean()
  temporary_identification: boolean;

  @IsOptional()
  @IsString()
  sample_bill?: string;

  @IsOptional()
  @IsString()
  tip?: string;

  @IsBoolean()
  manual_bills_entry: boolean;

  @IsArray()
  fields: FieldDto[];

  @IsArray()
  commission_bill_fields: CommissionFieldDto[];

  @IsOptional()
  @IsBoolean()
  is_cashout?: boolean;

  @IsOptional()
  @IsString()
  cashout_validation_type?: string;
}

export class FieldDto {
  @IsInt()
  id?: number;

  @IsString()
  name: string;

  @IsInt()
  field_type: number;

  @IsString()
  hint: string;

  @IsInt()
  notification_order: number;

  @IsInt()
  data_type: number;

  @IsOptional()
  @IsInt()
  min_length?: number;

  @IsOptional()
  @IsInt()
  max_length?: number;

  @IsBoolean()
  required: boolean;

  @IsBoolean()
  user_visible: boolean;

  @IsString()
  validation_regexp: string;

  @IsString()
  error_message: string;

  @IsOptional()
  @IsString()
  component_type?: string;

  @IsOptional()
  component_value?: any;
}

export class CommissionFieldDto {
  @IsString()
  name: string;

  @IsInt()
  max_length: number;

  @IsBoolean()
  required: boolean;

  @IsOptional()
  @IsString()
  validation_regexp?: string;
}

export class BillDto {
  @IsArray()
  customer_fields: string[];

  @IsArray()
  bill_identifier: string[];

  @IsOptional()
  @IsDateString()
  due_date?: string;

  @IsInt()
  amount: number;

  @IsInt()
  minimum_payment: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  additional_data: string[];
}

export class PaymentDto {
  @IsInt()
  ticket_number: number;

  @IsString()
  crc: string;

  @IsArray()
  additional_data: string[];

  @IsOptional()
  @IsString()
  commission_ticket_number?: string;

  @IsOptional()
  @IsInt()
  commission_amount?: number;

  @IsOptional()
  commission_bill?: any;
}

export class ApiResponseDto<T> {
  @IsString()
  status: 'success' | 'error';

  data?: T;
  
  @IsOptional()
  @IsArray()
  messages?: Array<{
    level: string;
    key: string;
    dsc: string;
  }>;
}