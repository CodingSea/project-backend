import { IsNotEmpty, IsString, IsDateString, IsOptional } from 'class-validator';

export class CreateProjectDto 
{
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    description: string;

    @IsNotEmpty()
    @IsString()
    status: string;
}
