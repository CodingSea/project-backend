import { IsArray, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { Comment } from "src/comment/entities/comment.entity";

export class CreateCardDto 
{
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
    tags: string[];

    @IsOptional() comments?: Comment[];
}
