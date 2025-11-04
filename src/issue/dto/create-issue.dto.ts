import { IsString, IsOptional, IsEnum, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Issue } from '../entities/issue.entity';

export class AttachmentDto
{
  @IsString()
  name: string;

  @IsString()
  url: string;
}

export class CreateIssueDto
{
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsEnum([ 'open', 'in-progress', 'resolved' ], {
    message: 'Status must be one of: open, in-progress, resolved',
  })
  status?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  codeSnippet?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: { name: string; url: string }[];

  @IsOptional()
  createdById?: number;
}
