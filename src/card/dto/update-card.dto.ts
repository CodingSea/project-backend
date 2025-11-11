import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Comment } from 'src/comment/entities/comment.entity';

export class UpdateCardDto {
  @IsOptional()
  @IsString()
  column?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  comments?: Comment[];

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsString()
  color?: string;

  // ✅ Multiple assigned users (optional; empty array = unassign all)
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  assignedUserIds?: number[];
}
