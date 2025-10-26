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

  //  Upload file from local path
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

  //  Upload directly from buffer (used for profile/certificate uploads)
  async uploadBuffer(fileBuffer: Buffer, key: string, contentType?: string): Promise<string> {
    const params: AWS.S3.PutObjectRequest = {
      Bucket: this.bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType || 'application/octet-stream',
    };

    await this.s3.upload(params).promise();
    return key;
  }

  //  Generate pre-signed URL for private file access
  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    const params = {
      Bucket: this.bucketName,
      Key: key,
      Expires: expiresInSeconds,
    };
    return this.s3.getSignedUrlPromise('getObject', params);
  }

  //  Delete file from S3
  async deleteFile(key: string): Promise<void> {
    try {
      await this.s3
        .deleteObject({
          Bucket: this.bucketName,
          Key: key,
        })
        .promise();
      console.log('🗑️ Deleted from S3:', key);
    } catch (err) {
      console.error('❌ Failed to delete from S3:', err);
      throw new Error('Failed to delete from S3');
    }
  }
}
