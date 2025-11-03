import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IssueService } from './issue.service';
import { IssueController } from './issue.controller';
import { Issue } from './entities/issue.entity';
import { Feedback } from 'src/feedback/entities/feedback.entity';
import { User } from 'src/user/entities/user.entity';
import { S3Module } from 'src/s3/s3.module';
import { FeedbackModule } from 'src/feedback/feedback.module'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([Issue, Feedback, User]),
    S3Module,
    FeedbackModule,
  ],
  controllers: [IssueController],
  providers: [IssueService],
})
export class IssueModule {}
