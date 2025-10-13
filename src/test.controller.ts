import { Controller, Get } from '@nestjs/common';
import { S3Service } from './s3/s3.service';
import * as fs from 'fs';

@Controller('test')
export class TestController {
  constructor(private readonly s3Service: S3Service) {}

  @Get('upload')
  async upload() {
    // make sure you have a small test file in project root (e.g., "test.txt")
    const localPath = 'test.txt';

    if (!fs.existsSync(localPath)) {
      fs.writeFileSync(localPath, 'Hello from Fatima 🚀');
    }

    const url = await this.s3Service.uploadFile(localPath);
    return { message: 'File uploaded successfully!', url };
  }
}
