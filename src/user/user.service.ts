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
    const user: User = new User();

    user.first_name = createUserDto.first_name;
    user.last_name = createUserDto.last_name;
    user.email = createUserDto.email;
    user.password = createUserDto.password;

    return this.userRepository.save(user);
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
