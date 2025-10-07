import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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
            where: { id: id }, // Adjust to match your primary key
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
    async createCard(taskBoardId: number, column: string, title: string, description: string): Promise<Card>
    {
        const card = this.cardRepository.create({ column, title, description });
        const taskBoard = await this.taskBoardRepository.findOneBy({id: taskBoardId});
        card.taskBoard = taskBoard!;
        return await this.cardRepository.save(card);
    }

    // Get All Cards for a TaskBoard
    async findAllCards(taskBoardId: number): Promise<Card[]>
    {
        return await this.cardRepository.find({ where: { taskBoard: { id: taskBoardId } } });
    }
}
