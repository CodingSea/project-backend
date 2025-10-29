import { IsString, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';

export class CreateIssueDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsEnum(['open', 'in-progress', 'resolved'], {
    message: 'Status must be one of: open, in-progress, resolved',
  })
  status?: string;

  @IsOptional()
  @IsString()
  categories?: string;

  @IsOptional()
  createdById?: number; // linked to User
}
