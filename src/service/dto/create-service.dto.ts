import {
    IsArray,
    IsDateString,
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
  } from 'class-validator';
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
  
    // ✅ Each service must belong to a project
    @IsInt()
    projectId: number;
  
    // ✅ Chief and manager are required
    @IsInt()
    chiefId: number;
  
    @IsInt()
    @IsOptional()
    managerId: number;
  
    // ✅ The array of resource IDs (keep name consistent with frontend)
    @IsArray()
    @IsInt({ each: true })
    resources: number[];
  }
  