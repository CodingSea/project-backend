import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateCardDto } from 'src/card/dto/create-card.dto';
import { UpdateCardDto } from 'src/card/dto/update-card.dto';
import { Card } from 'src/card/entities/card.entity';
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
  ) {}

  /* -------------------- Task Board CRUD -------------------- */

  async createTaskBoard(id: number): Promise<TaskBoard> {
    const taskBoard = this.taskboardRepository.create({ id });
    return await this.taskboardRepository.save(taskBoard);
  }

  async findAllTaskBoards(): Promise<TaskBoard[]> {
    return await this.taskboardRepository.find({ relations: ['cards'] });
  }

  async findTaskBoardById(id: number): Promise<TaskBoard | null> {
    return await this.taskboardRepository.findOne({
      where: { id },
      relations: [
        'cards',
        'cards.assignedUsers',
        'service',
        'service.chief',
        'service.projectManager',
        'service.project',
      ],
    });
  }

  async updateTaskBoard(id: number, serviceID: number): Promise<TaskBoard | null> {
    await this.taskboardRepository.update(id, { id });
    return this.findTaskBoardById(id);
  }

  async deleteTaskBoard(id: number): Promise<void> {
    await this.taskboardRepository.delete(id);
  }

  /* -------------------- Card CRUD -------------------- */

  // ✅ Create Card (with optional multiple assigned users)
  async createCard(
    taskBoardId: number,
    createCardDto: CreateCardDto,
  ): Promise<Card> {
    const {
      column,
      title,
      description,
      tags,
      order,
      color,
      assignedUserIds,
    } = createCardDto;

    const taskBoard = await this.taskboardRepository.findOne({
      where: { id: taskBoardId },
      relations: ['service'],
    });
    if (!taskBoard) throw new NotFoundException('TaskBoard not found');

    const card = this.cardRepository.create({
      column,
      title,
      description,
      taskBoard,
      tags,
      order,
      color,
    });

    if (assignedUserIds && assignedUserIds.length) {
      const users = await this.userRepository.findBy({
        id: In(assignedUserIds),
      });
      card.assignedUsers = users;
    }

    const saved = await this.cardRepository.save(card);

    return {
      ...saved,
      assignedUserIds: saved.assignedUsers
        ? saved.assignedUsers.map((u) => u.id)
        : [],
    } as any;
  }

  // ✅ Get all cards for a task board (with assigned user info)
  async findAllCards(taskBoardId: number): Promise<Card[]> {
    const cards = await this.cardRepository.find({
      where: { taskBoard: { id: taskBoardId } },
      relations: ['assignedUsers'],
    });

    return cards.map((card) => ({
      ...card,
      assignedUserIds: card.assignedUsers
        ? card.assignedUsers.map((u) => u.id)
        : [],
    })) as any;
  }

  // ✅ Get cards by service
  async getCardsFromTaskBoard(serviceId: number): Promise<Card[]> {
    const taskboard = await this.taskboardRepository.findOne({
      where: { service: { serviceID: serviceId } },
      relations: ['cards', 'cards.assignedUsers'],
    });

    if (!taskboard)
      throw new NotFoundException(
        `Task board for service ID ${serviceId} not found`,
      );

    return (taskboard.cards || []).map((card) => ({
      ...card,
      assignedUserIds: card.assignedUsers
        ? card.assignedUsers.map((u) => u.id)
        : [],
    })) as any;
  }

  // ✅ Update card (including multiple assigned users)
  async updateCard(
    taskBoardId: number,
    cardId: number,
    updateCardDto: UpdateCardDto,
  ): Promise<Card> {
    const taskBoard = await this.taskboardRepository.findOne({
      where: { id: taskBoardId },
    });
    if (!taskBoard) throw new NotFoundException('Task Board not found');

    const card = await this.cardRepository.findOne({
      where: { id: cardId, taskBoard: { id: taskBoardId } },
      relations: ['assignedUsers'],
    });
    if (!card) throw new NotFoundException('Card not found');

    if (updateCardDto.column !== undefined) card.column = updateCardDto.column;
    if (updateCardDto.title !== undefined) card.title = updateCardDto.title;
    if (updateCardDto.description !== undefined)
      card.description = updateCardDto.description;
    if (updateCardDto.tags !== undefined) card.tags = updateCardDto.tags;
    if (updateCardDto.order !== undefined) card.order = updateCardDto.order;
    if (updateCardDto.color !== undefined) card.color = updateCardDto.color;

    // ✅ handle multi assigned users
    if (updateCardDto.assignedUserIds !== undefined) {
      if (
        !updateCardDto.assignedUserIds ||
        updateCardDto.assignedUserIds.length === 0
      ) {
        card.assignedUsers = [];
      } else {
        const users = await this.userRepository.findBy({
          id: In(updateCardDto.assignedUserIds),
        });
        card.assignedUsers = users;
      }
    }

    const saved = await this.cardRepository.save(card);

    return {
      ...saved,
      assignedUserIds: saved.assignedUsers
        ? saved.assignedUsers.map((u) => u.id)
        : [],
    } as any;
  }

  // ✅ Create if not exists (multi users)
  async createCardIfNotExists(
    taskBoardId: number,
    createCardDto: CreateCardDto,
  ): Promise<Card> {
    try {
      const {
        title,
        column,
        description,
        tags,
        order,
        color,
        assignedUserIds,
      } = createCardDto;

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

      if (assignedUserIds && assignedUserIds.length) {
        const users = await this.userRepository.findBy({
          id: In(assignedUserIds),
        });
        newCard.assignedUsers = users;
      }

      const saved = await this.cardRepository.save(newCard);

      return {
        ...saved,
        assignedUserIds: saved.assignedUsers
          ? saved.assignedUsers.map((u) => u.id)
          : [],
      } as any;
    } catch (error) {
      console.error('Error creating card:', error);
      throw error;
    }
  }

  async deleteCard(cardId: number): Promise<void> {
    await this.cardRepository.delete(cardId);
  }
}
