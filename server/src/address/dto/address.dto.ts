import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'

export class AddressDto {
  @IsString() @IsNotEmpty() @MaxLength(50) receiverName!: string
  @IsString() @IsNotEmpty() @MaxLength(20) receiverPhone!: string
  @IsString() @IsOptional() @MaxLength(50) province?: string
  @IsString() @IsOptional() @MaxLength(50) city?: string
  @IsString() @IsOptional() @MaxLength(50) district?: string
  @IsString() @IsNotEmpty() @MaxLength(200) detail!: string
  @IsOptional() isDefault?: number
}
