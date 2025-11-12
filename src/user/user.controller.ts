/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UploadedFile,
  UseInterceptors,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthService } from 'src/auth/auth.service';
import { S3Service } from 'src/s3/s3.service';
import { User } from './entities/user.entity';
import { AuthGuard } from 'src/auth/auth.guard';
import { Card } from 'src/card/entities/card.entity';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly s3Service: S3Service,
  ) {}

  // ✅ Create single user
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  // ✅ Create multiple users
  @Post('import')
  createMultiple(@Body() createUserDtos: CreateUserDto[]) {
    return this.userService.createMultipleUsers(createUserDtos);
  }

  // ✅ Get all users
  @Get()
  findAll() {
    return this.userService.findAll();
  }

  // ✅ Get all developers (with signed profile images)
  @Get('developers')
  async getDevelopers(@Query('search') search: string): Promise<User[]> {
    return this.userService.findAllDevelopers(search);
  }

  // ✅ Developer search with pagination & filters (from Fahad)
  @Get('developers-card')
  async findAllDevelopers(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('name') name?: string,
    @Query('skills') skills?: string,
    @Query('services') services?: string,
    @Query('tasks') tasks?: string,
  ): Promise<User[]> {
    return this.userService.findAllDevelopersWithCards(
      page,
      limit,
      name,
      skills,
      services,
      tasks,
    );
  }

  // ✅ Developer tasks by IDs (from Fahad)
  @Post('developers-task')
  async getDevelopersTasks(@Body() developerIds: number[]): Promise<Card[]> {
    return this.userService.findTasksByUserIds(developerIds);
  }

  // ✅ Count developers (from Fahad)
  @Get('developers-count')
  async countDevelopers(
    @Query('name') name?: string,
    @Query('skills') skills?: string,
    @Query('services') services?: string,
    @Query('tasks') tasks?: string,
  ): Promise<number> {
    return this.userService.countDevelopers(name, skills, services, tasks);
  }

  // ✅ Get single user (with signed profile image)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  // ✅ Update user
  @Put(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(+id, updateUserDto);
  }

  // ✅ Delete user
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }

  // ✅ Upload profile image to S3
  @Post(':id/profile-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfileImage(
    @Param('id') id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new Error('No file provided');

    const key = `profile-images/${Date.now()}-${file.originalname}`;
    await this.s3Service.uploadBuffer(file.buffer, key, file.mimetype);

    await this.userService.updateProfileImage(id, key, key);
    const signedUrl = await this.s3Service.getSignedUrl(key);

    return { imageUrl: signedUrl };
  }

  // ✅ Delete profile image
  @Delete(':id/profile-image')
  async deleteProfileImage(@Param('id') id: number) {
    return this.userService.deleteProfileImage(id);
  }

  // ✅ Assign users to task
  @Post('assign-task/:taskId')
  async assignUsersToTask(
    @Param('taskId') taskId: number,
    @Body('userIds') userIds: number[],
  ) {
    return this.userService.assignUsersToTask(taskId, userIds);
  }

  // ✅ Get current user (JWT-based)
  @UseGuards(AuthGuard)
  @Get('me')
  async getCurrentUser(@Req() req) {
    return req.user;
  }
}
