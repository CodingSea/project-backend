import {
  ConflictException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateCardDto } from 'src/card/dto/create-card.dto';
import { UpdateCardDto } from 'src/card/dto/update-card.dto';
import { Card } from 'src/card/entities/card.entity';
import { Service } from 'src/service/entities/service.entity';
import { TaskBoard } from 'src/task-board/entities/task-board.entity';
import { User } from 'src/user/entities/user.entity';
import { In, Repository } from 'typeorm';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(TaskBoard)
    private taskboardRepository: Repository<TaskBoard>,

    @InjectRepository(Card)
    private cardRepository: Repository<Card>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
  ) { }

  /* -------------------- Task Board CRUD -------------------- */

  async createTaskBoard(serviceId: number): Promise<TaskBoard>
  {
    // 1. Find the service
    const service = await this.serviceRepository.findOne({ where: { serviceID: serviceId } });
    if (!service)
    {
      throw new NotFoundException(`Service with id ${serviceId} not found`);
    }

    // 2. Create a new task board and link it to the service
    const taskBoard = this.taskboardRepository.create({ service });

    // 3. Save and return
    return await this.taskboardRepository.save(taskBoard);
  }


  async findAllTaskBoards(): Promise<TaskBoard[]>
  {
    return await this.taskboardRepository.find({ relations: [ 'cards' ] });
  }

  async findTaskBoardById(id: number): Promise<TaskBoard | null> {
    return await this.taskboardRepository.findOne({
      where: { id },
      relations: [
        'cards',
        'cards.users',
        'cards.assignedUser',
        'service',
        'service.chief',
        'service.projectManager',
        'service.project',
      ],
    });
  }

  async updateTaskBoard(
    id: number,
    serviceID: number,
  ): Promise<TaskBoard | null> {
    await this.taskboardRepository.update(id, { id });
    return this.findTaskBoardById(id);
  }

  async deleteTaskBoard(id: number): Promise<void> {
    await this.taskboardRepository.delete(id);
  }

  /* -------------------- Card CRUD -------------------- */

  // ✅ Create Card (supports role restriction)
  async createCard(
    taskBoardId: number,
    createCardDto: CreateCardDto,
    user: any,
  ): Promise<Card> {
    const { column, title, description, tags, order, color, assignedUserId, users } =
      createCardDto;

    // Find TaskBoard & related service
    const taskBoard = await this.taskboardRepository.findOne({
      where: { id: taskBoardId },
      relations: ['service', 'service.chief', 'service.projectManager'],
    });
    if (!taskBoard) throw new NotFoundException('TaskBoard not found');

    // ✅ Role restriction: only admin, chief, or project manager can create
    const isAuthorized =
      user.role === 'admin' ||
      taskBoard.service?.chief?.id === user.id ||
      taskBoard.service?.projectManager?.id === user.id;

    if (!isAuthorized)
      throw new ForbiddenException(
        'You are not authorized to create or assign tasks for this service',
      );

    // Create card
    const card = this.cardRepository.create({
      column,
      title,
      description,
      taskBoard,
      tags,
      order,
      color,
    });

    // Single assigned user
    if (assignedUserId) {
      const userEntity = await this.userRepository.findOne({
        where: { id: assignedUserId },
      });
      if (userEntity) card.assignedUser = userEntity;
    }

    // Multiple assigned users (many-to-many)
    if (users && users.length > 0) {
      const userEntities = await this.userRepository.findBy({ id: In(users) });
      card.users = userEntities;
    }

    return await this.cardRepository.save(card);
  }

  // ✅ Get all cards for a task board (with assigned user info)
  async findAllCards(taskBoardId: number): Promise<Card[]> {
    const cards = await this.cardRepository.find({
      where: { taskBoard: { id: taskBoardId } },
      relations: ['assignedUser', 'users'],
    });
    return cards;
  }

  // ✅ Get cards by service
  async getCardsFromTaskBoard(serviceId: number): Promise<Card[]> {
    const taskboard = await this.taskboardRepository.findOne({
      where: { service: { serviceID: serviceId } },
      relations: ['cards', 'cards.assignedUser', 'cards.users'],
    });

    if (!taskboard)
      throw new NotFoundException(
        `Task board for service ID ${serviceId} not found`,
      );

    return taskboard.cards || [];
  }

  // ✅ Update card (handles add/remove users + restrict access)
  async updateCard(
    taskBoardId: number,
    cardId: number,
    updateCardDto: UpdateCardDto,
    user?: any,
  ): Promise<Card> {
    const taskBoard = await this.taskboardRepository.findOne({
      where: { id: taskBoardId },
      relations: ['service', 'service.chief', 'service.projectManager'],
    });
    if (!taskBoard) throw new NotFoundException('Task Board not found');

    // ✅ Role restriction
    if (user) {
      const isAuthorized =
        user.role === 'admin' ||
        taskBoard.service?.chief?.id === user.id ||
        taskBoard.service?.projectManager?.id === user.id;

      if (!isAuthorized)
        throw new ForbiddenException(
          'You are not authorized to edit tasks for this service',
        );
    }

    const card = await this.cardRepository.findOne({
      where: { id: cardId, taskBoard: { id: taskBoardId } },
      relations: ['assignedUser', 'users'],
    });
    if (!card) throw new NotFoundException('Card not found');

    if (updateCardDto.column !== undefined) card.column = updateCardDto.column;
    if (updateCardDto.title !== undefined) card.title = updateCardDto.title;
    if (updateCardDto.description !== undefined)
      card.description = updateCardDto.description;
    if (updateCardDto.tags !== undefined) card.tags = updateCardDto.tags;
    if (updateCardDto.order !== undefined) card.order = updateCardDto.order;
    if (updateCardDto.color !== undefined) card.color = updateCardDto.color;

    // Update single assigned user
    if (updateCardDto.assignedUserId !== undefined) {
      if (updateCardDto.assignedUserId === null) {
        card.assignedUser = undefined;
      } else {
        const userEntity = await this.userRepository.findOne({
          where: { id: updateCardDto.assignedUserId },
        });
        card.assignedUser = userEntity || undefined;
      }
    }

    // ✅ Update or clear multiple users
    if (updateCardDto.users !== undefined) {
      if (updateCardDto.users.length === 0) {
        card.users = [];
      } else {
        const userEntities = await this.userRepository.findBy({
          id: In(updateCardDto.users),
        });
        card.users = userEntities;
      }
    }

    return await this.cardRepository.save(card);
  }

  // ✅ Create card if not exists
  async createCardIfNotExists(
    taskBoardId: number,
    createCardDto: CreateCardDto,
  ): Promise<Card> {
    try {
      const { title, column, description, tags, order, color, assignedUserId, users } =
        createCardDto;

      const taskBoard = await this.taskboardRepository.findOne({
        where: { id: taskBoardId },
      });
      if (!taskBoard)
        throw new NotFoundException(
          `Task board with ID ${taskBoardId} not found`,
        );

      const newCard = this.cardRepository.create({
        title,
        column,
        description,
        taskBoard,
        tags,
        order,
        color,
      });

      if (assignedUserId) {
        const userEntity = await this.userRepository.findOne({
          where: { id: assignedUserId },
        });
        if (userEntity) newCard.assignedUser = userEntity;
      }

      if (users && users.length > 0) {
        const userEntities = await this.userRepository.findBy({ id: In(users) });
        newCard.users = userEntities;
      }

      return await this.cardRepository.save(newCard);
    } catch (error) {
      console.error('Error creating card:', error);
      throw error;
    }
  }

  async deleteCard(cardId: number): Promise<void> {
    await this.cardRepository.delete(cardId);
  }
}
