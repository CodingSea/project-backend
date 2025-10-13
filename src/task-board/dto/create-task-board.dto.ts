import { IsArray, IsNotEmpty } from 'class-validator';
import { CreateCardDto } from 'src/card/dto/create-card.dto';

export class CreateTaskBoardDto
{
    @IsNotEmpty()
    serviceID: number; // The ID of the associated service

    @IsArray()
    cards: CreateCardDto[]; // The cards to be associated with the TaskBoard
}