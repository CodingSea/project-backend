import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { User } from 'src/user/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Issue } from './entities/issue.entity';

@Injectable()
export class IssueService {
  constructor(
    @InjectRepository(Issue)
    private readonly issueRepo: Repository<Issue>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // ✅ Create new issue
  async create(createIssueDto: CreateIssueDto) {
    console.log('📝 Creating issue with:', createIssueDto.attachments?.length || 0, 'attachments');

    const issue = this.issueRepo.create({
      title: createIssueDto.title ?? '',
      description: createIssueDto.description ?? '',
      status: createIssueDto.status ?? 'open',
      category: createIssueDto.category ?? undefined,
      codeSnippet: createIssueDto.codeSnippet ?? undefined,
      attachments: createIssueDto.attachments ?? [],
    });

    if (createIssueDto.createdById) {
      const user = await this.userRepo.findOne({
        where: { id: createIssueDto.createdById },
      });
      if (user) issue.createdBy = user;
    }

    const saved = await this.issueRepo.save(issue);
    console.log('✅ Issue saved successfully:', saved.id);
    return saved;
  }

  // ✅ Paginated + filtered
  async getIssues(
    page: number,
    limit: number,
    status?: string,
    category?: string,
    searchQuery?: string,
  ): Promise<Issue[]> {
    const skip = (page - 1) * limit;

    const queryBuilder = this.issueRepo
      .createQueryBuilder('issue')
      .leftJoinAndSelect('issue.createdBy', 'user')
      .skip(skip)
      .take(limit)
      .orderBy('issue.createdAt', 'DESC');

    if (status && status !== 'All') {
      queryBuilder.andWhere('issue.status = :status', { status });
    }

    if (category && category !== 'AllCategories') {
      queryBuilder.andWhere('issue.category = :category', { category });
    }

    if (searchQuery) {
      queryBuilder.andWhere(
        '(LOWER(issue.title) LIKE :search OR LOWER(issue.description) LIKE :search)',
        { search: `%${searchQuery.toLowerCase()}%` },
      );
    }

    return queryBuilder.getMany();
  }

  async findOne(id: number) {
    const issue = await this.issueRepo.findOne({
      where: { id },
      relations: ['createdBy', 'feedbacks'],
    });
    if (!issue) throw new NotFoundException(`Issue #${id} not found`);
    return issue;
  }

  async update(id: number, dto: UpdateIssueDto) {
    const issue = await this.findOne(id);
    Object.assign(issue, dto);
    return this.issueRepo.save(issue);
  }

  async remove(id: number) {
    const issue = await this.findOne(id);
    await this.issueRepo.remove(issue);
    return { message: `Issue #${id} deleted successfully` };
  }
}
