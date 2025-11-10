import
  {
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
  } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthService } from 'src/auth/auth.service';
import { S3Service } from 'src/s3/s3.service';
import { User } from './entities/user.entity';

@Controller('user')
export class UserController
{
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly s3Service: S3Service,
  ) { }

  //  Create User
  @Post()
  create(@Body() createUserDto: CreateUserDto)
  {
    return this.userService.create(createUserDto);
  }

  @Post("import")
  createMultiple(@Body() createUserDtos: CreateUserDto[])
  {
    return this.userService.createMultipleUsers(createUserDtos);
  }

  // Get All Users
  @Get()
  findAll()
  {
    return this.userService.findAll();
  }

  // Get All Developers (with signed profile images)
  @Get('developers')
  async getDevelopers(@Query('search') search: string): Promise<User[]>
  {
    return this.userService.findAllDevelopers(search);
  }

  //  Get Single User (with signed profile image)
  @Get(':id')
  findOne(@Param('id') id: string)
  {
    return this.userService.findOne(+id);
  }

  //  Update User Info
  @Put(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto)
  {
    return this.userService.update(+id, updateUserDto);
  }

  //  Delete User
  @Delete(':id')
  remove(@Param('id') id: string)
  {
    return this.userService.remove(+id);
  }

  //  Upload Profile Image to S3
  @Post(':id/profile-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfileImage(
    @Param('id') id: number,
    @UploadedFile() file: Express.Multer.File,
  )
  {
    if (!file) throw new Error('No file provided');

    const key = `profile-images/${Date.now()}-${file.originalname}`;
    await this.s3Service.uploadBuffer(file.buffer, key, file.mimetype);

    await this.userService.updateProfileImage(id, key, key);
    const signedUrl = await this.s3Service.getSignedUrl(key);

    return { imageUrl: signedUrl };
  }

  //  Delete Profile Image
  @Delete(':id/profile-image')
  async deleteProfileImage(@Param('id') id: number)
  {
    return this.userService.deleteProfileImage(id);
  }
}
