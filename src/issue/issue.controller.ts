import {
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
} from '@nestjs/common';
import { IssueService } from './issue.service';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { S3Service } from 'src/s3/s3.service';
import { Express } from 'express';

@Controller('issue')
export class IssueController {
  constructor(
    private readonly issueService: IssueService,
    private readonly s3Service: S3Service,
  ) {}

  // ✅ CREATE ISSUE (with S3 upload)
  @Post()
  @UseInterceptors(FilesInterceptor('attachments'))
  async create(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: any,
  ) {
    console.log('🔥 CREATE ISSUE → files received:', files?.length || 0);

    const uploadedFiles: { name: string; url: string }[] = [];

    if (files?.length) {
      for (const file of files) {
        const key = `issues/${Date.now()}-${file.originalname}`;
        const keyPath = await this.s3Service.uploadBuffer(file.buffer, key, file.mimetype);
        uploadedFiles.push({ name: file.originalname, url: keyPath });
        console.log('✅ Uploaded to S3:', key);
      }
    }

    const dto: CreateIssueDto = {
      title: body.title,
      description: body.description,
      category: body.category,
      codeSnippet: body.codeSnippet,
      attachments: uploadedFiles,
      createdById: Number(body.createdById) || undefined,
    };

    return this.issueService.create(dto);
  }

  // ✅ GET ALL
  @Get()
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.issueService.getIssues(page, limit, status, category, search);
  }

  // ✅ GET ONE (with signed URLs)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const issue = await this.issueService.findOne(+id);

    if (issue.attachments?.length) {
      issue.attachments = await Promise.all(
        issue.attachments.map(async (f: any) => ({
          name: f.name,
          url: await this.s3Service.getSignedUrl(f.url, 3600),
        })),
      );
    }

    return issue;
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateIssueDto) {
    return this.issueService.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.issueService.remove(+id);
  }
}
