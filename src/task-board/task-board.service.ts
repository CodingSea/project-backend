import { Injectable } from '@nestjs/common';
import { CreateTaskBoardDto } from './dto/create-task-board.dto';
import { UpdateTaskBoardDto } from './dto/update-task-board.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskBoard } from './entities/task-board.entity';
import { Card } from 'src/card/entities/card.entity';
import { Service } from 'src/service/entities/service.entity';

@Injectable()
export class TaskBoardService
{
  constructor(
    @InjectRepository(TaskBoard)
    private readonly taskBoardRepo: Repository<TaskBoard>,
    @InjectRepository(Card)
    private readonly cardRepo: Repository<Card>,
  ) { }

  async create(createTaskBoardDto: CreateTaskBoardDto): Promise<TaskBoard>
  {
    // Create a new TaskBoard instance
    const taskBoard = this.taskBoardRepo.create({
      service: { serviceID: createTaskBoardDto.serviceID } as Service, // Associate with the service
      cards: createTaskBoardDto.cards.map(cardDto => this.cardRepo.create(cardDto)), // Create Card instances from DTOs
    });

    // Save the TaskBoard to the database
    return await this.taskBoardRepo.save(taskBoard);
  }

  findAll()
  {
    return `This action returns all taskBoard`;
  }

  findOne(id: number)
  {
    return `This action returns a #${id} taskBoard`;
  }

  update(id: number, updateTaskBoardDto: UpdateTaskBoardDto)
  {
    return `This action updates a #${id} taskBoard`;
  }

  remove(id: number)
  {
    return `This action removes a #${id} taskBoard`;
  }
}
