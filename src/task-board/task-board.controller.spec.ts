import { Test, TestingModule } from '@nestjs/testing';
import { TaskBoardController } from './task-board.controller';
import { TaskBoardService } from './task-board.service';

describe('TaskBoardController', () => {
  let controller: TaskBoardController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskBoardController],
      providers: [TaskBoardService],
    }).compile();

    controller = module.get<TaskBoardController>(TaskBoardController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
