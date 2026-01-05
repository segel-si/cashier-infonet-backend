import { IsString, IsInt, IsArray, IsOptional, IsBoolean } from 'class-validator';

export class CashoutCreateDto {
  @IsInt()
  service_id: number;

  @IsString()
  transaction_id: string;

  @IsString()
  amount: string;

  @IsBoolean()
  signature_flag: boolean;

  @IsArray()
  customer_fields: string[];

  @IsArray()
  bill_identifier: string[];

  @IsArray()
  additional_data_fields: string[];

  @IsOptional()
  @IsArray()
  customer_temporary_fields?: string[];

  @IsOptional()
  @IsArray()
  security_fields?: string[];
}

export class CashoutInfoDto {
  @IsString()
  service_id: string;

  @IsArray()
  customer_fields: string[];

  @IsOptional()
  @IsBoolean()
  signature_flag?: boolean;
}

export class CashoutStatusDto {
  @IsInt()
  service_id: number;

  @IsString()
  amount: string;

  @IsString()
  transaction_id: string;

  @IsArray()
  customer_fields: string[];

  @IsArray()
  bill_identifier: string[];

  @IsBoolean()
  signature_flag: boolean;

  @IsOptional()
  @IsArray()
  security_fields?: string[];

  @IsBoolean()
  repeat: boolean;
}

export class CashoutReverseDto {
  @IsInt()
  service_id: number;

  @IsString()
  amount: string;

  @IsString()
  transaction_id: string;

  @IsArray()
  customer_fields: string[];

  @IsArray()
  bill_identifier: string[];

  @IsArray()
  additional_data_fields: string[];

  @IsOptional()
  @IsArray()
  customer_temporary_fields?: string[];

  @IsOptional()
  @IsArray()
  security_fields?: string[];
}

export class CashoutResponseDto {
  @IsInt()
  id: number;

  @IsString()
  amount: string;

  @IsString()
  created_at: string;

  @IsInt()
  service_id: number;

  @IsString()
  transaction_id: string;

  @IsInt()
  ticket_number: number;

  @IsString()
  crc: string;

  @IsArray()
  customer_fields: string[];

  @IsArray()
  customer_temporary_fields: string[];

  @IsOptional()
  @IsString()
  bill_description?: string;

  @IsArray()
  bill_identifier: string[];

  @IsArray()
  additional_data: string[];

  @IsOptional()
  @IsString()
  marketing_message?: string;

  @IsInt()
  cmr_code: number;

  @IsInt()
  cmr_branch_code: number;

  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  error_key?: string;

  @IsOptional()
  @IsString()
  error_message?: string;

  @IsString()
  requires_signature: string;
}