import
{
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UploadedFiles,
  UseInterceptors,
  Query,
  Res,
  BadRequestException
} from '@nestjs/common';
import { IssueService } from './issue.service';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { S3Service } from 'src/s3/s3.service';
import { Express } from 'express';

@Controller('issue')
export class IssueController
{
  constructor(
    private readonly issueService: IssueService,
    private readonly s3Service: S3Service,
  ) { }

  @Get('count')
  async countFilteredIssues(
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('search') searchQuery?: string,
    @Query('userId') userId?: number
  ): Promise<number>
  {
    return this.issueService.countIssues(status, category, searchQuery, userId);
  }

  @Post()
  @UseInterceptors(FilesInterceptor('attachments'))
  async create(@UploadedFiles() files: Express.Multer.File[], @Body() body: any)
  {
    const uploadedFiles: { name: string; url: string; key: string }[] = [];

    if (files?.length)
    {
      for (const file of files)
      {
        const key = `issues/${Date.now()}-${file.originalname}`;
        await this.s3Service.uploadBuffer(file.buffer, key, file.mimetype);

        uploadedFiles.push({
          name: file.originalname,
          url: key,
          key
        });
      }
    }

    const dto: CreateIssueDto = {
      title: body.title,
      description: body.description,
      category: body.category,
      codeSnippet: body.codeSnippet,
      attachments: uploadedFiles,
      createdById: Number(body.createdById),
    };

    return this.issueService.create(dto);
  }

  @Get('file/download')
  async downloadIssueFile(@Query('key') key: string, @Res() res: any)
  {
    const fileStream = await this.s3Service.getFileStream(key);
    const fileName = key.split('/').pop();

    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });

    fileStream.pipe(res);
  }

@Get()
async findAll(
  @Query('page') page = 1,
  @Query('limit') limit = 10,
  @Query('status') status?: string,
  @Query('category') category?: string,
  @Query('search') search?: string,
  @Query('userId') userId?: number
) {
  return this.issueService.getIssues(page, limit, status, category, search, userId);
}


  @Get(':id')
  async findOne(@Param('id') id: number)
  {
    if (isNaN(id))
    {
      throw new BadRequestException('Invalid issue ID');
    }
    return this.issueService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() dto: UpdateIssueDto)
  {
    return this.issueService.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: number)
  {
    return this.issueService.remove(+id);
  }

  @Patch(':id/status')
async updateStatus(@Param('id') id: number, @Body('status') status: string) {
  return this.issueService.updateStatus(+id, status);
}


}
