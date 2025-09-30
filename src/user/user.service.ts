import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import bcrypt from 'bcrypt';

@Injectable()
export class UserService
{
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
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

  findAllDevelopers()
  {
    return this.userRepository.findBy({role: "developer"});
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
