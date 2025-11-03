import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateCommentDto {
  @IsNotEmpty()
  @IsString()
  content: string;

  @IsNotEmpty()
  @IsNumber()
  feedbackId: number;

  @IsNotEmpty()
  @IsNumber()
  userId: number;
}
