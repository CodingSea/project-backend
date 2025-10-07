import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthService } from 'src/auth/auth.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { User } from './entities/user.entity';

@Controller('user')
export class UserController
{
  constructor(private readonly userService: UserService, private authService: AuthService) { }

  // @UseGuards(AuthGuard)
  @Post()
  create(@Body() createUserDto: CreateUserDto)
  {
    return this.userService.create(createUserDto);
  }

  @Get()
  findAll()
  {
    return this.userService.findAll();
  }

  @Get("developers")
  async getDevelopers(@Query('search') search: string): Promise<User[]> {
    return this.userService.findAllDevelopers(search);
  }

  @Get(':id')
  findOne(@Param('id') id: string)
  {
    return this.userService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto)
  {
    return this.userService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string)
  {
    return this.userService.remove(+id);
  }
}
