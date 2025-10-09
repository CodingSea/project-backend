import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateCardDto } from 'src/card/dto/create-card.dto';
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
            relations: [ 'cards' ]
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
    async createCard(taskBoardId: number, serviceId: number, column: string, title: string, description: string): Promise<Card>
    {
        const taskBoard = await this.taskBoardRepository.findOne({
            where: { id: taskBoardId },
            relations: [ 'service' ] // Fetch the associated service
        });

        if (!taskBoard || taskBoard.service?.serviceID !== serviceId)
        {
            throw new Error('TaskBoard not found or does not belong to the specified Service ID');
        }

        const card = this.cardRepository.create({ column, title, description, taskBoard });
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

        return taskBoard.cards; // Return the cards from the found task board
    }

    async updateCard(id: number, updateData: Partial<Card>): Promise<Card>
    {
        const card = await this.cardRepository.findOne({ where: { id } });
        if (!card)
        {
            throw new NotFoundException(`Card with ID ${id} not found`);
        }

        // Update the card fields
        Object.assign(card, updateData);
        return await this.cardRepository.save(card);
    }

    // Create a card (if it doesn't exist)
    async createCardIfNotExists(taskBoardId: number, createCardDto: CreateCardDto): Promise<Card>
    {
        const { title, column, description, tags } = createCardDto;

        const existingCard = await this.cardRepository.findOne({ where: { title, taskBoard: { id: taskBoardId } } });
        if (existingCard)
        {
            throw new ConflictException(`Card with title "${title}" already exists in this task board`);
        }

        const taskBoard = await this.taskBoardRepository.findOne({ where: { id: taskBoardId } });
        if (!taskBoard)
        {
            throw new NotFoundException(`Task board with ID ${taskBoardId} not found`);
        }

        const newCard = this.cardRepository.create({ title, column, description, taskBoard, tags });
        return await this.cardRepository.save(newCard);
    }

    async deleteCard(cardId: number): Promise<void>
    {
        await this.cardRepository.delete(cardId);
    }
}
