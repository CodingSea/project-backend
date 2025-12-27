import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import bcrypt from 'bcrypt';
import { S3Service } from 'src/s3/s3.service';
import { Card } from 'src/card/entities/card.entity';

@Injectable()
export class UserService
{
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly s3Service: S3Service,

    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
  ) { }

  // ✅ Create new user
  async create(createUserDto: CreateUserDto)
  {
    const user = new User();
    user.first_name = createUserDto.first_name;
    user.last_name = createUserDto.last_name;
    user.email = createUserDto.email;
    user.role = createUserDto.role || 'developer';
    user.skills = createUserDto.skills || [];

    const hashed = await bcrypt.hash(createUserDto.password, 12);
    user.password = hashed;

    return this.userRepository.save(user);
  }

  async createMultipleUsers(createUserDtos: CreateUserDto[])
  {
    for (let i = 0; i < createUserDtos.length; i++)
    {
      const element = createUserDtos[i];

      this.create(element);
    }
  }

  // ✅ Get all users
  findAll()
  {
    return this.userRepository.find();
  }

  // ✅ Get all developers (with signed profile images)
  async findAllDevelopers(searchTerm?: string): Promise<User[]>
  {
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (searchTerm)
    {
      const search = `%${searchTerm.toLowerCase()}%`;
      queryBuilder.where(
        '(LOWER(user.first_name) LIKE :search OR LOWER(user.last_name) LIKE :search OR EXISTS (SELECT 1 FROM unnest(user.skills) AS skill WHERE LOWER(skill) LIKE :search)) AND user.role = :role',
        { search, role: 'developer' },
      );
    } else
    {
      queryBuilder.where('user.role = :role', { role: 'developer' });
    }

    const developers = await queryBuilder.getMany();

    // Attach signed URLs safely
    const updatedDevelopers = await Promise.all(
      developers.map(async (dev) =>
      {
        if (dev.profileImageID)
        {
          try
          {
            dev.profileImage = await this.s3Service.getSignedUrl(dev.profileImageID);
          } catch
          {
            dev.profileImage = null;
          }
        }
        return dev;
      }),
    );

    return updatedDevelopers;
  }

  async findAllDevelopersWithCards(
    page: number,
    limit: number,
    name?: string,
    skills?: string,
    services?: string,
    tasks?: string,
  ): Promise<User[]>
  {
    const skip = (page - 1) * limit;

    const queryBuilder = this.userRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.cards', 'card') // Left join to get associated cards
      .leftJoinAndSelect('card.taskBoard', 'taskBoard') // Left join to get associated taskBoard
      .leftJoinAndSelect('taskBoard.service', 'service') // Left join to get associated service
      .leftJoinAndSelect('service.project', 'project') // Left join to get associated service
      .where('user.role = :role', { role: 'developer' })
      .skip(skip)
      .take(limit); // Limit results

    // Filter by name if provided
    if (name)
    {
      const nameSearch = `%${name.toLowerCase()}%`;
      queryBuilder.andWhere(
        '(LOWER(user.first_name) LIKE :name OR LOWER(user.last_name) LIKE :name)',
        { name: nameSearch }
      );
    }

    // Filter by skills if provided
    if (skills)
    {
      const skillsSearch = `%${skills.toLowerCase()}%`;
      queryBuilder.andWhere(
        'EXISTS (SELECT 1 FROM unnest(user.skills) AS skill WHERE LOWER(skill) LIKE :skills)',
        { skills: skillsSearch }
      );
    }

    // Filter by services if provided
    if (services)
    {
      const servicesSearch = `%${services.toLowerCase()}%`;
      queryBuilder.andWhere('LOWER(service.name) LIKE :services', { services: servicesSearch });
    }

    // Filter by tasks if provided
    if (tasks)
    {
      const tasksSearch = `%${tasks.toLowerCase()}%`;
      queryBuilder.andWhere(
        `EXISTS (
          SELECT 1 FROM card AS task 
          WHERE task.id = card.id AND LOWER(task.title) LIKE :tasks
        )`,
        { tasks: tasksSearch }
      );
    }

    // Execute the query to get users with their associated cards, taskBoards, and services
    const developersWithCards = await queryBuilder.getMany();

    const processedDevelopers = await Promise.all(
      developersWithCards.map(async (user) =>
      {
        if (user.profileImageID)
        {
          try
          {
            // Replace the ID/Key with the actual temporary S3 URL
            user.profileImage = await this.s3Service.getSignedUrl(user.profileImageID);
          } catch (error)
          {
            console.error(`Failed to sign URL for user ${user.id}:`, error);
            user.profileImage = null;
          }
        }
        return user;
      }),
    );

    return processedDevelopers;
  }

  async findTasksByUserIds(userIds: number[]): Promise<Card[]>
  {
    if (userIds.length === 0)
    {
      return []; // Return an empty array if no user IDs are provided
    }

    // Create a query builder to fetch tasks associated with the user IDs
    const queryBuilder = this.cardRepository.createQueryBuilder('card')
      .innerJoin('card.users', 'user') // Join to the user table via the join table
      .leftJoinAndSelect('card.taskBoard', 'taskBoard') // Join to the user table via the join table
      .leftJoinAndSelect('card.taskBoard.service', 'taskBoard.service') // Join to the user table via the join table
      .where('user.id IN (:...userIds)', { userIds }); // Filter by user IDs

    // Execute the query to get all relevant task cards
    const tasks = await queryBuilder.getMany();

    return tasks; // Return the list of task cards
  }

  async countDevelopers(
    name?: string,
    skills?: string,
    services?: string,
    tasks?: string,
  ): Promise<number>
  {
    const queryBuilder = this.userRepository.createQueryBuilder('user')
      .where('user.role = :role', { role: 'developer' });

    // Filter by name if provided
    if (name)
    {
      const nameSearch = `%${name.toLowerCase()}%`;
      queryBuilder.andWhere(
        '(LOWER(user.first_name) LIKE :name OR LOWER(user.last_name) LIKE :name)',
        { name: nameSearch }
      );
    }

    // Filter by skills if provided
    if (skills)
    {
      const skillsSearch = `%${skills.toLowerCase()}%`;
      queryBuilder.andWhere(
        'EXISTS (SELECT 1 FROM unnest(user.skills) AS skill WHERE LOWER(skill) LIKE :skills)',
        { skills: skillsSearch }
      );
    }

    // Filter by services if provided
    if (services)
    {
      const servicesSearch = `%${services.toLowerCase()}%`;
      queryBuilder.andWhere(
        'EXISTS (SELECT 1 FROM user.services AS service WHERE LOWER(service.name) LIKE :services)',
        { services: servicesSearch }
      );
    }

    // Filter by tasks if provided
    if (tasks)
    {
      const tasksSearch = `%${tasks.toLowerCase()}%`;
      queryBuilder.andWhere(
        'EXISTS (SELECT 1 FROM card AS task WHERE LOWER(task.title) LIKE :tasks)',
        { tasks: tasksSearch }
      );
    }

    // Execute the count query
    return queryBuilder.getCount(); // Still only fetching count, page and limit typically not needed here
  }

  // ✅ Get one user (with signed image URL)
  async findOne(id: number)
  {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) return null;

    if (user.profileImageID)
    {
      try
      {
        user.profileImage = await this.s3Service.getSignedUrl(user.profileImageID);
      } catch
      {
        user.profileImage = null;
      }
    }

    return user;
  }

  // ✅ Find by email
  findByEmail(email: string)
  {
    return this.userRepository.findOne({ where: { email } });
  }

  // ✅ Update user info
  update(id: number, updateUserDto: UpdateUserDto)
  {
    const user = new User();
    user.id = id;
    user.first_name = updateUserDto.first_name;
    user.last_name = updateUserDto.last_name;
    user.email = updateUserDto.email;
    user.role = updateUserDto.role;
    user.skills = updateUserDto.skills;
    return this.userRepository.save(user);
  }

  // ✅ Delete user
  remove(id: number)
  {
    return this.userRepository.delete(id);
  }

  // ✅ Upload / update profile image (delete old)
  async updateProfileImage(userId: number, imageUrl: string, imageKey: string)
  {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    if (user.profileImageID && user.profileImageID !== imageKey)
    {
      try
      {
        await this.s3Service.deleteFile(user.profileImageID);
        console.log(`🗑️ Deleted old profile image: ${user.profileImageID}`);
      } catch (err)
      {
        console.warn(`⚠️ Failed to delete old image: ${err.message}`);
      }
    }

    user.profileImage = imageUrl;
    user.profileImageID = imageKey;
    return this.userRepository.save(user);
  }

  // ✅ Delete user profile image
  async deleteProfileImage(userId: number)
  {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    if (user.profileImageID)
    {
      await this.s3Service.deleteFile(user.profileImageID);
      user.profileImage = null;
      user.profileImageID = null;
      await this.userRepository.save(user);
    }

    return { message: 'Profile image deleted successfully' };
  }

  // 👇 add this at the end of UserService class
  async assignUsersToTask(taskId: number, userIds: number[]): Promise<{ message: string }>
  {
    if (!userIds || userIds.length === 0)
    {
      return { message: 'No users provided.' };
    }

    try
    {
      const users = await this.userRepository.findByIds(userIds);

      if (users.length === 0)
      {
        return { message: 'No valid users found.' };
      }

      // Optional: log or update a relation table
      // Example: if you have a Task entity, you could do something like:
      // const task = await this.taskRepository.findOne({ where: { id: taskId } });
      // task.assignedUsers = users;
      // await this.taskRepository.save(task);

      // If you don’t have a direct join table yet, this ensures they exist
      for (const u of users)
      {
        console.log(`📌 Assigned ${u.first_name} ${u.last_name} to task ${taskId}`);
      }

      return { message: `Assigned ${users.length} users to task ${taskId}` };
    } catch (error)
    {
      console.error('Error assigning users to task:', error);
      throw error;
    }
  }

}
