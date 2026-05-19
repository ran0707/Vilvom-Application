import { IsString, IsNumber, IsOptional, IsEnum, IsDateString, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class LocationDto {
  @ApiProperty({ description: 'Location type', example: 'Point' })
  @IsString()
  type: string;

  @ApiProperty({ description: 'Coordinates [longitude, latitude]', example: [80.2707, 13.0827] })
  @IsNumber({}, { each: true })
  coordinates: [number, number];
}

export class CreateDroneRequestDto {
  @ApiProperty({ 
    description: 'Type of drone service requested',
    enum: ['pest_spraying', 'fertilizer_application', 'field_monitoring', 'crop_mapping', 'soil_analysis'],
    example: 'pest_spraying'
  })
  @IsEnum(['pest_spraying', 'fertilizer_application', 'field_monitoring', 'crop_mapping', 'soil_analysis'])
  serviceType: string;

  @ApiProperty({ description: 'Field area in acres', example: 2.5 })
  @IsNumber()
  fieldArea: number;

  @ApiProperty({ description: 'Field location', type: LocationDto })
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @ApiPropertyOptional({ description: 'Preferred service date', example: '2024-01-20T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @ApiProperty({ 
    description: 'Service urgency level',
    enum: ['low', 'medium', 'high'],
    example: 'medium'
  })
  @IsEnum(['low', 'medium', 'high'])
  urgency: string;

  @ApiPropertyOptional({ description: 'Additional notes or requirements' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Specific pest type (for pest spraying)' })
  @IsOptional()
  @IsString()
  pestType?: string;

  @ApiPropertyOptional({ description: 'Field conditions and accessibility' })
  @IsOptional()
  @IsString()
  fieldConditions?: string;

  @ApiPropertyOptional({ description: 'Contact information for service' })
  @IsOptional()
  @IsObject()
  contactInfo?: {
    name: string;
    phone: string;
    alternatePhone?: string;
  };
}

export class UpdateDroneRequestDto {
  @ApiPropertyOptional({ description: 'Updated service date' })
  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @ApiPropertyOptional({ description: 'Updated urgency level' })
  @IsOptional()
  @IsEnum(['low', 'medium', 'high'])
  urgency?: string;

  @ApiPropertyOptional({ description: 'Updated notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Request status' })
  @IsOptional()
  @IsEnum(['pending', 'accepted', 'in_progress', 'completed', 'cancelled'])
  status?: string;
}