import { Module } from '@nestjs/common';
import { IssueService } from './issue.service';
import { IssueController } from './issue.controller';
import { Feedback } from 'src/feedback/entities/feedback.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Issue } from './entities/issue.entity';
import { User } from 'src/user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Feedback, Issue, User])],
  controllers: [IssueController],
  providers: [IssueService],
})
export class IssueModule {}
