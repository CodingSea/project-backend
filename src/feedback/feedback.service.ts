import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feedback } from './entities/feedback.entity';
import { Issue } from 'src/issue/entities/issue.entity';
import { User } from 'src/user/entities/user.entity';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback) private feedbackRepo: Repository<Feedback>,
    @InjectRepository(Issue) private issueRepo: Repository<Issue>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async create(dto: CreateFeedbackDto) {
    const issue = await this.issueRepo.findOne({ where: { id: dto.issueId } });
    if (!issue) throw new NotFoundException(`Issue ${dto.issueId} not found`);

    const user = await this.userRepo.findOne({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException(`User ${dto.userId} not found`);

    const feedback = this.feedbackRepo.create({
      content: dto.content,
      attachments: dto.attachments ?? [],
      issue,
      user,
    });

    return this.feedbackRepo.save(feedback);
  }

  async toggleAccepted(feedbackId: number, issueOwnerId: number) {
    const feedback = await this.feedbackRepo.findOne({
      where: { id: feedbackId },
      relations: ['issue', 'issue.createdBy'],
    });

    if (!feedback) throw new NotFoundException('Feedback not found');

    const issueOwner = feedback.issue.createdBy?.id;
    if (issueOwner !== issueOwnerId) {
      throw new NotFoundException('Not allowed');
    }

    feedback.isAccepted = !feedback.isAccepted;
    return this.feedbackRepo.save(feedback);
  }

  async findByIssue(issueId: number) {
    return this.feedbackRepo.find({
      where: { issue: { id: issueId } },
      relations: ['user', 'comments', 'comments.user'],
      order: { createdAt: 'DESC' },
    });
  }
}
