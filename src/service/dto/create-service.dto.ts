import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceStatus } from '../entities/service.entity';

export class CreateServiceDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  deadline: string;

  @IsOptional()
  @IsEnum(ServiceStatus)
  status?: ServiceStatus;

  @Type(() => Number)
  @IsInt()
  projectId: number;

  @Type(() => Number)
  @IsInt()
  chiefId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  managerId?: number;

  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  resources: number[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => Object)
  files?: { name: string; url: string }[];
}
