import { Controller, Post, Param, Body, UploadedFiles, UseInterceptors, Get, Query, Res } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { S3Service } from 'src/s3/s3.service';

@Controller('issue')
export class FeedbackController {
  constructor(
    private readonly feedbackService: FeedbackService,
    private readonly s3Service: S3Service,
  ) {}

  @Post('feedback/:id/toggle')
  toggleFeedback(
    @Param('id') id: string,
    @Body('issueOwnerId') issueOwnerId: number
  ) {
    return this.feedbackService.toggleAccepted(Number(id), issueOwnerId);
  }

  @Post(':id/feedback')
  @UseInterceptors(FilesInterceptor('attachments'))
  async addFeedback(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: any,
  ) {
    const uploadedFiles: { name: string; url: string; key: string }[] = [];

    if (files?.length) {
      for (const file of files) {
        const key = `feedback/${Date.now()}-${file.originalname}`;
        await this.s3Service.uploadBuffer(file.buffer, key, file.mimetype);

        uploadedFiles.push({
          name: file.originalname,
          url: key,
          key
        });
      }
    }

    return this.feedbackService.create({
      issueId: Number(id),
      userId: Number(body.userId),
      content: body ?? "",
      attachments: uploadedFiles,
    });
  }

  @Get('feedback/download')
  async downloadFeedbackFile(@Query('key') key: string, @Res() res: any) {
    const fileStream = await this.s3Service.getFileStream(key);
    const fileName = key.split('/').pop();

    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });

    fileStream.pipe(res);
  }
}
