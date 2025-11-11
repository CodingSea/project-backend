import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateCardDto } from 'src/card/dto/create-card.dto';
import { UpdateCardDto } from 'src/card/dto/update-card.dto';
import { Card } from 'src/card/entities/card.entity';
import { TaskBoard } from 'src/task-board/entities/task-board.entity';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { In } from 'typeorm';

@Injectable()
export class TasksService
{
  constructor(
    @InjectRepository(TaskBoard)
    private taskboardRepository: Repository<TaskBoard>,

    @InjectRepository(Card)
    private cardRepository: Repository<Card>,

    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) { }

  /* -------------------- Task Board CRUD -------------------- */

  async createTaskBoard(id: number): Promise<TaskBoard>
  {
    const taskBoard = this.taskboardRepository.create({ id });
    return await this.taskboardRepository.save(taskBoard);
  }

  async findAllTaskBoards(): Promise<TaskBoard[]>
  {
    return await this.taskboardRepository.find({ relations: [ 'cards' ] });
  }

  async findTaskBoardById(id: number): Promise<TaskBoard | null>
  {
    return await this.taskboardRepository.findOne({
      where: { id },
      relations: [ 'cards', 'service', 'service.chief', 'service.projectManager', 'service.project' ],
    });
  }

  async updateTaskBoard(id: number, serviceID: number): Promise<TaskBoard | null>
  {
    await this.taskboardRepository.update(id, { id });
    return this.findTaskBoardById(id);
  }

  async deleteTaskBoard(id: number): Promise<void>
  {
    await this.taskboardRepository.delete(id);
  }

  /* -------------------- Card CRUD -------------------- */

  // ✅ Create Card (with optional assigned user)
  async createCard(taskBoardId: number, createCardDto: CreateCardDto): Promise<Card>
  {
    let { column, title, description, tags, order, color, assignedUserId, users } = createCardDto;

    // Find the TaskBoard
    const taskBoard = await this.taskboardRepository.findOne({
      where: { id: taskBoardId },
      relations: [ 'service' ], // Adjust as necessary
    });
    if (!taskBoard)
    {
      throw new NotFoundException('TaskBoard not found');
    }

    // Create a new card
    const card = this.cardRepository.create({
      column,
      title,
      description,
      taskBoard,
      tags,
      order,
      color,
    });

    // Assign single user if provided
    if (assignedUserId)
    {
      const user = await this.userRepository.findOne({ where: { id: assignedUserId } });
      if (user)
      {
        card.assignedUser = user; // Assuming this relation exists
      }
    }

    // Assign multiple users if provided
    if (users && users.length > 0)
    {
      // Assuming users is an array of user IDs (number[])
      const userEntities = await this.userRepository.findBy({ id: In(users) });
      card.users = userEntities; // This will properly handle the many-to-many relationship
    }

    return await this.cardRepository.save(card); // Save card and also manage relationships
  }

  // ✅ Get all cards for a task board (with assigned user info)
  async findAllCards(taskBoardId: number): Promise<Card[]>
  {
    const cards = await this.cardRepository.find({
      where: { taskBoard: { id: taskBoardId } },
      relations: [ 'assignedUser' ],
    });

    // include assignedUserId directly in the response for frontend
    return cards.map(card => ({
      ...card,
      assignedUserId: card.assignedUser ? card.assignedUser.id : null,
    })) as any;
  }

  // ✅ Get cards by service
  async getCardsFromTaskBoard(serviceId: number): Promise<Card[]>
  {
    const taskboard = await this.taskboardRepository.findOne({
      where: { service: { serviceID: serviceId } },
      relations: [ 'cards', 'cards.assignedUser' ],
    });

    if (!taskboard) throw new NotFoundException(`Task board for service ID ${serviceId} not found`);

    // include assignedUserId for frontend
    return (taskboard.cards || []).map(card => ({
      ...card,
      assignedUserId: card.assignedUser ? card.assignedUser.id : null,
    })) as any;
  }

  // ✅ Update card (including assigned user)
  async updateCard(taskBoardId: number, cardId: number, updateCardDto: UpdateCardDto): Promise<Card>
  {
    const taskBoard = await this.taskboardRepository.findOne({ where: { id: taskBoardId } });
    if (!taskBoard) throw new NotFoundException('Task Board not found');

    const card = await this.cardRepository.findOne({
      where: { id: cardId, taskBoard: { id: taskBoardId } },
      relations: [ 'assignedUser' ],
    });
    if (!card) throw new NotFoundException('Card not found');

    // update fields
    if (updateCardDto.column !== undefined) card.column = updateCardDto.column;
    if (updateCardDto.title !== undefined) card.title = updateCardDto.title;
    if (updateCardDto.description !== undefined) card.description = updateCardDto.description;
    if (updateCardDto.tags !== undefined) card.tags = updateCardDto.tags;
    if (updateCardDto.order !== undefined) card.order = updateCardDto.order;
    if (updateCardDto.color !== undefined) card.color = updateCardDto.color;

    // update assigned user
    if (updateCardDto.assignedUserId !== undefined)
    {
      if (updateCardDto.assignedUserId === null)
      {
        card.assignedUser = undefined;
      } else
      {
        const user = await this.userRepository.findOne({ where: { id: updateCardDto.assignedUserId } });
        card.assignedUser = user || undefined;
      }
    }

    const saved = await this.cardRepository.save(card);

    // return with assignedUserId for consistency
    return {
      ...saved,
      assignedUserId: saved.assignedUser ? saved.assignedUser.id : null,
    } as any;
  }

  // ✅ Create if not exists
  async createCardIfNotExists(taskBoardId: number, createCardDto: CreateCardDto): Promise<Card>
  {
    try
    {
      const { title, column, description, tags, order, color, assignedUserId } = createCardDto;

      const taskBoard = await this.taskboardRepository.findOne({ where: { id: taskBoardId } });
      if (!taskBoard) throw new NotFoundException(`Task board with ID ${taskBoardId} not found`);

      const newCard = this.cardRepository.create({
        title,
        column,
        description,
        taskBoard,
        tags,
        order,
        color,
      });

      if (assignedUserId)
      {
        const user = await this.userRepository.findOne({ where: { id: assignedUserId } });
        if (user) newCard.assignedUser = user;
      }

      const saved = await this.cardRepository.save(newCard);

      return {
        ...saved,
        assignedUserId: saved.assignedUser ? saved.assignedUser.id : null,
      } as any;
    } catch (error)
    {
      console.error('Error creating card:', error);
      throw error;
    }
  }

  async deleteCard(cardId: number): Promise<void>
  {
    await this.cardRepository.delete(cardId);
  }
}
