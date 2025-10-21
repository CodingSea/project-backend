import { Injectable } from '@nestjs/common';
import AWS from 'aws-sdk';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class S3Service {
  private readonly s3: AWS.S3;
  private readonly bucketName = 'iga-project-files'; // replace if your bucket name is different

  constructor() {
    AWS.config.update({
      region: 'me-south-1',
    });
    this.s3 = new AWS.S3();
  }

  // Upload local file path (for other modules)
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

  // Upload directly from buffer (used for profile/certificate uploads)
  async uploadBuffer(fileBuffer: Buffer, key: string, contentType?: string): Promise<string> {
    const params: AWS.S3.PutObjectRequest = {
      Bucket: this.bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType || 'application/octet-stream',
    };

    await this.s3.upload(params).promise();
    return key; // store only the key, not the full URL
  }

  // ✅ Generate a pre-signed URL for reading private files
  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    const params = {
      Bucket: this.bucketName,
      Key: key,
      Expires: expiresInSeconds,
    };
    return this.s3.getSignedUrlPromise('getObject', params);
  }
}
