import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TaskBoardService } from './task-board.service';
import { CreateTaskBoardDto } from './dto/create-task-board.dto';
import { UpdateTaskBoardDto } from './dto/update-task-board.dto';

@Controller('task-board')
export class TaskBoardController {
  constructor(private readonly taskBoardService: TaskBoardService) {}

  @Post()
  create(@Body() createTaskBoardDto: CreateTaskBoardDto) {
    return this.taskBoardService.create(createTaskBoardDto);
  }

  @Get()
  findAll() {
    return this.taskBoardService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.taskBoardService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTaskBoardDto: UpdateTaskBoardDto) {
    return this.taskBoardService.update(+id, updateTaskBoardDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.taskBoardService.remove(+id);
  }
}
