import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { Comment } from "src/comment/entities/comment.entity";
import { User } from "src/user/entities/user.entity";

export class CreateCardDto {
  @IsNotEmpty()
  @IsString()
  column: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  comments?: Comment[];

  @IsNotEmpty()
  @IsNumber()
  order: number;

  @IsOptional()
  @IsString()
  color?: string;

  // ✅ Single assigned user (as in fahad-8)
  @IsOptional()
  @IsNumber()
  assignedUserId?: number;

  // ✅ Support multiple user objects for future flexibility
  @IsOptional()
  @IsArray()
  users?: User[];
}
