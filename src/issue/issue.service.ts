import { Injectable } from '@nestjs/common';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { User } from 'src/user/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Issue } from './entities/issue.entity';

@Injectable()
export class IssueService
{
  constructor(
    @InjectRepository(Issue)
    private readonly issueRepo: Repository<Issue>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>
  ) { }

  create(createIssueDto: CreateIssueDto)
  {
    return 'This action adds a new issue';
  }

  findAll()
  {
    return this.issueRepo.find();
  }

  async getIssues(page: number, limit: number, status?: string, category?: string, searchQuery?: string): Promise<Issue[]>
  {
    const skip = (page - 1) * limit;

    const queryBuilder = this.issueRepo.createQueryBuilder('issue')
      .skip(skip)
      .take(limit)
      .orderBy('issue.createdAt', 'DESC');

    // Apply filtering based on status
    if (status && status !== 'All')
    {
      queryBuilder.andWhere('issue.status = :status', { status });
    }

    // Apply filtering based on category
    if (category && category !== 'AllCategories')
    {
      queryBuilder.andWhere('issue.category = :category', { category });
    }

    // Apply search query if provided
    if (searchQuery)
    {
      queryBuilder.andWhere('(LOWER(issue.title) LIKE :search OR LOWER(issue.description) LIKE :search)', {
        search: `%${searchQuery.toLowerCase()}%`
      });
    }

    return queryBuilder.getMany();
  }

  async countIssues(status?: string, category?: string, searchQuery?: string): Promise<number>
  {
    const queryBuilder = this.issueRepo.createQueryBuilder('issue');

    // Apply filtering based on status
    if (status && status !== 'All')
    {
      queryBuilder.andWhere('issue.status = :status', { status });
    }

    // Apply filtering based on category
    if (category && category !== 'AllCategories')
    {
      queryBuilder.andWhere('issue.category = :category', { category });
    }

    // Apply search query if provided
    if (searchQuery)
    {
      queryBuilder.andWhere('(LOWER(issue.title) LIKE :search OR LOWER(issue.description) LIKE :search)', {
        search: `%${searchQuery.toLowerCase()}%`
      });
    }

    return queryBuilder.getCount();
  }

  findOne(id: number)
  {
    return `This action returns a #${id} issue`;
  }

  update(id: number, updateIssueDto: UpdateIssueDto)
  {
    return `This action updates a #${id} issue`;
  }

  remove(id: number)
  {
    return `This action removes a #${id} issue`;
  }
}
