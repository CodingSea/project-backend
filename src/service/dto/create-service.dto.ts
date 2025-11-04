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
import { Issue } from 'src/issue/entities/issue.entity';

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

  // ✅ Each service must belong to a project
  @Type(() => Number)
  @IsInt()
  projectId: number;

  // ✅ Chief and manager are required
  @Type(() => Number)
  @IsInt()
  chiefId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  managerId?: number;

  // ✅ The array of resource IDs (consistent with frontend)
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  resources: number[];

  // ✅ Optional: existing files (for update/edit)
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => Object)
  files?: { name: string; url: string }[];

  @IsOptional()
  issue?: Issue
}
