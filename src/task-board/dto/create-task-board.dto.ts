import { IsArray, IsNotEmpty } from "class-validator";
import { CreateCardDto } from "src/card/dto/create-card.dto";

export class CreateTaskBoardDto 
{
    @IsNotEmpty()
    serviceID: number;

    @IsArray()
    cards: CreateCardDto[];
}
