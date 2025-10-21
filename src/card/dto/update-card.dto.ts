import { PartialType } from '@nestjs/mapped-types';
import { CreateCardDto } from './create-card.dto';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Comment } from "src/comment/entities/comment.entity";

export class UpdateCardDto
{

    @IsNotEmpty()
    @IsString()
    column: string;

    @IsNotEmpty()
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags: string[];

    comments: Comment[];

    @IsNotEmpty()
    @IsNumber()
    order: number;

    @IsOptional()
    @IsString()
    color: string;
}
