import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateCardDto } from 'src/card/dto/create-card.dto';
import { UpdateCardDto } from 'src/card/dto/update-card.dto';
import { Card } from 'src/card/entities/card.entity';
import { TaskBoard } from 'src/task-board/entities/task-board.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TasksService 
{
    constructor(
        @InjectRepository(TaskBoard)
        private taskBoardRepository: Repository<TaskBoard>,
        @InjectRepository(Card)
        private cardRepository: Repository<Card>,
    ) { }

    // Create TaskBoard
    async createTaskBoard(id: number): Promise<TaskBoard>
    {
        const taskBoard = this.taskBoardRepository.create({ id });
        return await this.taskBoardRepository.save(taskBoard);
    }

    // Get All TaskBoards
    async findAllTaskBoards(): Promise<TaskBoard[]>
    {
        return await this.taskBoardRepository.find({ relations: [ 'cards' ] });
    }

    // Get TaskBoard by ID
    async findTaskBoardById(id: number): Promise<TaskBoard | null>
    {
        return await this.taskBoardRepository.findOne({
            where: { id: id },
            relations: [ 'cards', 'service' ]
        });
    }

    // Update TaskBoard
    async updateTaskBoard(id: number, serviceID: number): Promise<TaskBoard | null>
    {
        await this.taskBoardRepository.update(id, { id });
        return this.findTaskBoardById(id);
    }

    // Delete TaskBoard
    async deleteTaskBoard(id: number): Promise<void>
    {
        await this.taskBoardRepository.delete(id);
    }

    // Create Card
    async createCard(taskBoardId: number, createCardDto: CreateCardDto): Promise<Card>
    {
        const { column, title, description, tags, order } = createCardDto; // Destructure from DTO

        const taskBoard = await this.taskBoardRepository.findOne({
            where: { id: taskBoardId },
            relations: [ 'service' ] // Fetch the associated service
        });

        if (!taskBoard)
        {
            throw new Error('TaskBoard not found or does not belong to the specified Service ID');
        }

        // Create the card using the DTO data
        const card = this.cardRepository.create({
            column,
            title,
            description,
            taskBoard,
            tags, // Assuming you want to include tags as well
            order // Include order if needed
        });

        return await this.cardRepository.save(card);
    }

    // Get All Cards for a TaskBoard
    async findAllCards(taskBoardId: number): Promise<Card[]>
    {
        return await this.cardRepository.find({ where: { taskBoard: { id: taskBoardId } } });
    }

    async getCardsFromTaskBoard(serviceId: number): Promise<Card[]>
    {
        const taskBoard = await this.taskBoardRepository.findOne({
            where: { service: { serviceID: serviceId } },
            relations: [ 'cards' ], // Ensure to load the relation
        });

        if (!taskBoard)
        {
            throw new NotFoundException(`Task board for service ID ${serviceId} not found`);
        }

        console.log(taskBoard.cards);

        return taskBoard.cards; // Return the cards from the found task board
    }

    async updateCard(taskBoardId: number, cardId: number, updateCardDto: UpdateCardDto): Promise<Card> {
        const taskBoard = await this.taskBoardRepository.findOne({where: {id: taskBoardId}});
        if (!taskBoard) {
            throw new Error('Task Board not found');
        }
    
        const card = await this.cardRepository.findOne({ where: { id: cardId, taskBoard: { id: taskBoardId } } });
        if (!card) {
            throw new Error('Card not found');
        }
    
        // Update only the fields that are provided in the DTO
        if (updateCardDto.column !== undefined) {
            card.column = updateCardDto.column;
        }
        if (updateCardDto.title !== undefined) {
            card.title = updateCardDto.title;
        }
        if (updateCardDto.description !== undefined) {
            card.description = updateCardDto.description;
        }
        if (updateCardDto.tags !== undefined) {
            card.tags = updateCardDto.tags;
        }
        if (updateCardDto.order !== undefined) {
            card.order = updateCardDto.order;
        }
    
        return await this.cardRepository.save(card);
    }

    // Create a card (if it doesn't exist)
    async createCardIfNotExists(taskBoardId: number, createCardDto: CreateCardDto): Promise<Card>
    {
        try
        {
            const { title, column, description, tags, order } = createCardDto;

            const taskBoard = await this.taskBoardRepository.findOne({ where: { id: taskBoardId } });
            if (!taskBoard)
            {
                throw new NotFoundException(`Task board with ID ${taskBoardId} not found`);
            }

            // Create and save the new card
            const newCard = this.cardRepository.create({ title, column, description, taskBoard, tags, order });
            return await this.cardRepository.save(newCard);
        } catch (error)
        {
            console.error('Error creating card:', error); // Log the error for debugging
            throw error; // Re-throw to maintain original error handling
        }
    }

    async deleteCard(cardId: number): Promise<void>
    {
        await this.cardRepository.delete(cardId);
    }
}
