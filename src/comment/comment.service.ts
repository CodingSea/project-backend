import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Comment } from './entities/comment.entity';
import { Feedback } from 'src/feedback/entities/feedback.entity';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,

    @InjectRepository(Feedback)
    private readonly feedbackRepo: Repository<Feedback>,
  ) {}
async create(dto: CreateCommentDto) {
  const feedback = await this.feedbackRepo.findOne({ where: { id: dto.feedbackId } });

  if (!feedback) throw new NotFoundException('Feedback not found');

  const comment = this.commentRepo.create({
    content: dto.content,
    feedbackId: dto.feedbackId,
    userId: dto.userId,
  });

  await this.commentRepo.save(comment);

  // Return user details including profileImage
  return await this.commentRepo.findOne({
    where: { id: comment.id },
    relations: ['user'],
  });
}

}
