import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UserService
{
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) { }

  create(createUserDto: CreateUserDto)
  {
    return 'This action adds a new user';
  }

  findAll()
  {
    return `This action returns all user`;
  }

  findOne(id: number)
  {
    return this.userRepository.findOneBy({ id })
  }

  findByEmail(email: string)
  {
    return this.userRepository.findOne({ where: { email } });
  }

  update(id: number, updateUserDto: UpdateUserDto)
  {
    return `This action updates a #${id} user`;
  }

  remove(id: number)
  {
    return `This action removes a #${id} user`;
  }
}
