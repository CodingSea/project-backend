import { IsNotEmpty } from "class-validator";
import { Comment } from "src/comment/entities/comment.entity";

export class CreateCardDto 
{
    @IsNotEmpty()
    column: string;

    @IsNotEmpty()
    title: string;

    @IsNotEmpty()
    description: string;

    comments: Comment[];
}
