import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { User } from 'src/user/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Issue } from './entities/issue.entity';
import { S3Service } from 'src/s3/s3.service';

@Injectable()
export class IssueService
{
  constructor(
    @InjectRepository(Issue)
    private readonly issueRepo: Repository<Issue>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    private readonly s3Service: S3Service
  ) { }

  async create(createIssueDto: CreateIssueDto)
  {
    const issue = this.issueRepo.create({
      title: createIssueDto.title,
      description: createIssueDto.description,
      status: createIssueDto.status ?? 'Open',
      category: createIssueDto.category,
      codeSnippet: createIssueDto.codeSnippet,
      attachments: createIssueDto.attachments ?? [],
    });

    if (createIssueDto.createdById)
    {
      const user = await this.userRepo.findOne({ where: { id: createIssueDto.createdById } });
      if (user) issue.createdBy = user;
    }

    return this.issueRepo.save(issue);
  }

async getIssues(page: number, limit: number, status?: string, category?: string, search?: string) {
  const skip = (page - 1) * limit;

  const queryBuilder = this.issueRepo
    .createQueryBuilder("issue")
    .leftJoinAndSelect("issue.createdBy", "createdBy")
    .orderBy("issue.createdAt", "DESC")
    .skip(skip)
    .take(limit);

  if (status && status !== "all") {
    queryBuilder.andWhere("issue.status = :status", { status });
  }

  if (category && category !== "all") {
    queryBuilder.andWhere("issue.category = :category", { category });
  }

  if (search) {
    queryBuilder.andWhere(
      "(LOWER(issue.title) LIKE :search OR LOWER(issue.description) LIKE :search)",
      { search: `%${search.toLowerCase()}%` }
    );
  }

  const issues = await queryBuilder.getMany();
  return issues;
}


  async findOne(id: number)
  {
    const issue = await this.issueRepo.findOne({
      where: { id },
      relations: [
        'createdBy',
        'feedbacks',
        'feedbacks.user',
        'feedbacks.comments',
        'feedbacks.comments.user'
      ],
    });

    if (!issue) throw new NotFoundException(`Issue #${id} not found`);

    // Issue Creator Image
    if (issue.createdBy?.profileImageID)
    {
      issue.createdBy.profileImage = await this.s3Service.getSignedUrl(
        issue.createdBy.profileImageID
      );
    }

    // Issue Attachments
    if (issue.attachments?.length)
    {
      issue.attachments = await Promise.all(
        issue.attachments.map(async (file) => ({
          name: file.name,
          url: await this.s3Service.getSignedUrl(file.url ?? file, 3600),
        }))
      );
    }

    // Feedback + Comments images
    for (const fb of issue.feedbacks ?? [])
    {

      // Feedback user avatar
      if (fb.user?.profileImageID)
      {
        fb.user.profileImage = await this.s3Service.getSignedUrl(
          fb.user.profileImageID
        );
      }

      // Feedback attachments
      if (fb.attachments?.length)
      {
        fb.attachments = await Promise.all(
          fb.attachments.map(async (file) => ({
            name: file.name,
            url: await this.s3Service.getSignedUrl(file.url ?? file, 3600),
          }))
        );
      }

      // Comments user avatar
      for (const c of fb.comments ?? [])
      {
        if (c.user?.profileImageID)
        {
          c.user.profileImage = await this.s3Service.getSignedUrl(
            c.user.profileImageID
          );
        }
      }
    }

    return issue;
  }

  async update(id: number, dto: UpdateIssueDto)
  {
    const issue = await this.findOne(id);
    Object.assign(issue, dto);
    return this.issueRepo.save(issue);
  }

  async remove(id: number)
  {
    const issue = await this.findOne(id);
    await this.issueRepo.remove(issue);
    return { message: `Issue #${id} deleted` };
  }

async countIssues(status?: string, category?: string, searchQuery?: string): Promise<number> {
  const queryBuilder = this.issueRepo.createQueryBuilder('issue');

  if (status && status !== 'all') {
    queryBuilder.andWhere('issue.status = :status', { status });
  }

  if (category && category !== 'all') {
    queryBuilder.andWhere('issue.category = :category', { category });
  }

  if (searchQuery) {
    queryBuilder.andWhere(
      '(LOWER(issue.title) LIKE :search OR LOWER(issue.description) LIKE :search)',
      { search: `%${searchQuery.toLowerCase()}%` }
    );
  }

  return queryBuilder.getCount();
}


}
