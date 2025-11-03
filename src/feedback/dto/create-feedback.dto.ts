import { IsNotEmpty, IsNumber, IsOptional, IsArray } from 'class-validator';

export class CreateFeedbackDto {
  @IsNumber()
  issueId: number;

  @IsNumber()
  userId: number;

  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsArray()
  attachments?: { name: string; url: string }[];
}
