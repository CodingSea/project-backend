import { Controller, Post, Get, Param, Body, Delete, Patch } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TaskBoard } from 'src/task-board/entities/task-board.entity';
import { Card } from 'src/card/entities/card.entity';
import { CreateCardDto } from 'src/card/dto/create-card.dto';

@Controller('tasks')
export class TasksController
{
    constructor(private readonly tasksService: TasksService) { }

    // Create a TaskBoard
    @Post('task-board')
    async createTaskBoard(@Body('id') id: number): Promise<TaskBoard>
    {
        return this.tasksService.createTaskBoard(id);
    }

    // Get All TaskBoards
    @Get('task-boards')
    async findAllTaskBoards(): Promise<TaskBoard[]>
    {
        return this.tasksService.findAllTaskBoards();
    }

    // Get TaskBoard by ID
    @Get('task-board/:id')
    async findTaskBoardById(@Param('id') id: number): Promise<TaskBoard | null>
    {
        return this.tasksService.findTaskBoardById(id);
    }

    // Update TaskBoard
    @Patch('task-board/:id')
    async updateTaskBoard(@Param('id') id: number, @Body('serviceID') serviceID: number): Promise<TaskBoard | null>
    {
        return this.tasksService.updateTaskBoard(id, serviceID);
    }

    // Delete TaskBoard
    @Delete('task-board/:id')
    async deleteTaskBoard(@Param('id') id: number): Promise<void>
    {
        return this.tasksService.deleteTaskBoard(id);
    }

    // Create a Card
    @Post(':taskBoardId/cards')
    async createCard(
        @Param('taskBoardId') taskBoardId: number,
        @Body() createCardDto: CreateCardDto // Accept the DTO directly
    ): Promise<Card> {
        return this.tasksService.createCard(taskBoardId, createCardDto);
    }

    // Get All Cards for a TaskBoard
    @Get('task-board/:taskBoardId/cards')
    async findAllCards(@Param('taskBoardId') taskBoardId: number): Promise<Card[]>
    {
        return this.tasksService.findAllCards(taskBoardId);
    }
}