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
    private readonly s3Service: S3Service // ✅ second argument
  ) { }


  async create(createUserDto: CreateUserDto)
  {
    const user: User = new User();
    user.first_name = createUserDto.first_name;
    user.last_name = createUserDto.last_name;
    user.email = createUserDto.email;

    const pwd = await bcrypt.hash(createUserDto.password, 12);
    user.password = pwd;

    return this.userRepository.save(user);
  }

  findAll()
  {
    return this.userRepository.find();
  }

  async findAllDevelopers(searchTerm?: string): Promise<User[]>
  {
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (searchTerm)
    {
      const search = `%${searchTerm.toLowerCase()}%`;
      queryBuilder.where(
        '(LOWER(user.first_name) LIKE :search OR LOWER(user.last_name) LIKE :search OR EXISTS (SELECT 1 FROM unnest(user.skills) AS skill WHERE LOWER(skill) LIKE :search)) AND user.role = :role',
        { search, role: 'developer' }
      );
    } else
    {
      queryBuilder.where('user.role = :role', { role: 'developer' });
    }

    const developers = await queryBuilder.getMany();

    // Loop through each developer and set the profile image URL
    for (const user of developers)
    {
      if (user.profileImageID)
      {
        user.profileImage = await this.s3Service.getSignedUrl(user.profileImageID);
      }
    }

    return developers;
  }

  // ✅ Fetch user and attach signed URL if profile image exists
  async findOne(id: number)
  {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) return null;

    if (user.profileImageID)
    {
      const signedUrl = await this.s3Service.getSignedUrl(user.profileImageID);
      user.profileImage = signedUrl;
    }

    return user;
  }

  findByEmail(email: string)
  {
    return this.userRepository.findOne({ where: { email } });
  }

  update(id: number, updateUserDto: UpdateUserDto)
  {
    const user: User = new User();
    user.first_name = updateUserDto.first_name;
    user.last_name = updateUserDto.last_name;
    user.email = updateUserDto.email;
    user.role = updateUserDto.role;
    user.skills = updateUserDto.skills;
    user.id = id;

    return this.userRepository.save(user);
  }

  remove(id: number)
  {
    return this.userRepository.delete(id);
  }

  // ✅ Save profile image and its S3 key
  async updateProfileImage(userId: number, imageUrl: string, imageKey: string)
  {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    user.profileImage = imageUrl;
    user.profileImageID = imageKey;
    return await this.userRepository.save(user);
  }
}
