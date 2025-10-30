import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { Comment } from './entities/comment.entity';
import { Feedback } from 'src/feedback/entities/feedback.entity';
import { User } from 'src/user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, Feedback, User])],
  controllers: [CommentController],
  providers: [CommentService],
})
export class CommentModule {}
