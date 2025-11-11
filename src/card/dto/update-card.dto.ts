import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Comment } from 'src/comment/entities/comment.entity';
import { User } from 'src/user/entities/user.entity';

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

  // ✅ Single assigned user (like CreateCardDto)
  @IsOptional()
  @IsNumber()
  assignedUserId?: number;

  // ✅ Optional multiple users (many-to-many)
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  users?: number[];
}
