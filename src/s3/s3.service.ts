import { Injectable } from '@nestjs/common';
import AWS from 'aws-sdk';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class S3Service {
  private readonly s3: AWS.S3;
  private readonly bucketName = 'iga-project-files'; // bucket name

  constructor() {
    AWS.config.update({
      region: 'me-south-1',
    });

    this.s3 = new AWS.S3();
  }

  async uploadFile(localFilePath: string, folder = 'uploads') {
    const fileContent = fs.readFileSync(localFilePath);
    const fileExt = path.extname(localFilePath);
    const key = `${folder}/${randomUUID()}${fileExt}`;

    const params: AWS.S3.PutObjectRequest = {
      Bucket: this.bucketName,
      Key: key,
      Body: fileContent,
    };

    await this.s3.upload(params).promise();

    return `https://${this.bucketName}.s3.me-south-1.amazonaws.com/${key}`;
  }

    async uploadBuffer(fileBuffer: Buffer, key: string): Promise<string> {
        const params: AWS.S3.PutObjectRequest = {
        Bucket: this.bucketName,
        Key: key,
        Body: fileBuffer,
        };
    
        await this.s3.upload(params).promise();
        return `https://${this.bucketName}.s3.me-south-1.amazonaws.com/${key}`;
    }
    
}
