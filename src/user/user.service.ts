import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import bcrypt from 'bcrypt';
import { S3Service } from 'src/s3/s3.service';

@Injectable()
export class UserService
{
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly s3Service: S3Service,
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
      const element = createUserDtos[ i ];

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
          } catch {
            dev.profileImage = null;
          }
        }
        return dev;
      }),
    );

    return updatedDevelopers;
  }

  async findAllDeveloperCards(searchTerm?: string): Promise<User[]>
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
          } catch {
            dev.profileImage = null;
          }
        }
        return dev;
      }),
    );

    return updatedDevelopers;
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
      } catch {
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
}
