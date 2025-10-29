import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Issue } from './entities/issue.entity';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { User } from 'src/user/entities/user.entity';
import { Feedback } from 'src/feedback/entities/feedback.entity';

@Injectable()
export class IssueService {
  constructor(
    @InjectRepository(Issue)
    private readonly issueRepository: Repository<Issue>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Feedback)
    private readonly feedbackRepository: Repository<Feedback>,
  ) {}

  // ✅ Create new issue
  async create(createIssueDto: CreateIssueDto) {
    const issue = this.issueRepository.create({
      title: createIssueDto.title,
      description: createIssueDto.description,
      status: createIssueDto.status || 'open',
      categories: createIssueDto.categories || 'general',
    });

    if (createIssueDto.createdById) {
      const user = await this.userRepository.findOne({
        where: { id: createIssueDto.createdById },
      });
      if (user) issue.createdBy = user;
    }

    return this.issueRepository.save(issue);
  }

  // ✅ Get all issues (with creator + feedbacks)
  async findAll() {
    return this.issueRepository.find({
      relations: ['createdBy', 'feedbacks'],
      order: { createdAt: 'DESC' },
    });
  }

  // ✅ Get one issue with feedbacks + comments
  async findOne(id: number) {
    const issue = await this.issueRepository.findOne({
      where: { id },
      relations: ['createdBy', 'feedbacks'],
    });
    if (!issue) throw new NotFoundException(`Issue #${id} not found`);

    return issue;
  }

  // ✅ Update issue
  async update(id: number, updateIssueDto: UpdateIssueDto) {
    const issue = await this.findOne(id);
    Object.assign(issue, updateIssueDto);
    return this.issueRepository.save(issue);
  }

  // ✅ Delete issue
  async remove(id: number) {
    const issue = await this.findOne(id);
    await this.issueRepository.remove(issue);
    return { message: `Issue #${id} deleted successfully` };
  }
}
