import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { User } from 'src/user/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Issue } from './entities/issue.entity';
import { S3Service } from 'src/s3/s3.service';
import { ServiceService } from 'src/service/service.service';

@Injectable()
export class IssueService
{
  constructor(
    @InjectRepository(Issue)
    private readonly issueRepo: Repository<Issue>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    private readonly s3Service: S3Service,

    private readonly svc: ServiceService
  ) { }

  async create(createIssueDto: CreateIssueDto)
  {
    const issue = this.issueRepo.create({
      title: createIssueDto.title,
      description: createIssueDto.description,
      status: createIssueDto.status ?? 'open',
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

  async getIssues(page: number, limit: number, status?: string, category?: string, search?: string, userId?: number)
  {
    const skip = (page - 1) * limit;

    // Retrieve the list of service IDs for the current user
    const userServices = await this.svc.getAllServicesForUser(userId!);
    const userServiceIds = userServices.map(service => service.serviceID); // Extract service IDs

    const queryBuilder = this.issueRepo
      .createQueryBuilder("issue")
      .leftJoinAndSelect("issue.createdBy", "createdBy")
      .leftJoinAndSelect("issue.service", "service") // Join the service to filter on it
      .orderBy("issue.createdAt", "DESC")
      .skip(skip)
      .take(limit);

    // Filter by status if provided
    if (status && status !== "all")
    {
      queryBuilder.andWhere("issue.status = :status", { status });
    }

    // Check if a category is provided and filter by it
    if (category && category !== "all")
    {
      queryBuilder.andWhere("issue.category = :category", { category });
    }

    // Filter issues based on service-related logic
    queryBuilder.andWhere(
      "(issue.category <> 'Service' OR (issue.category = 'Service' AND service.serviceID IN (:...userServiceIds)))",
      { userServiceIds }
    );

    // Filter by search term if provided
    if (search)
    {
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

  async countIssues(status?: string, category?: string, searchQuery?: string, userId?: number): Promise<number>
  {
    const queryBuilder = this.issueRepo.createQueryBuilder('issue');

    // Retrieve the list of service IDs for the current user
    const userServices = await this.svc.getAllServicesForUser(userId!);
    const userServiceIds = userServices.map(service => service.serviceID); // Extract service IDs

    // Join the service table to filter on it
    queryBuilder.leftJoin("issue.service", "service");

    // Filter by status if provided
    if (status && status !== 'all')
    {
      queryBuilder.andWhere('issue.status = :status', { status });
    }

    // Check if a category is provided and filter by it
    if (category && category !== 'all')
    {
      queryBuilder.andWhere('issue.category = :category', { category });
    }

    // Filter issues based on service-related logic
    queryBuilder.andWhere(
      "(issue.category <> 'Service' OR (issue.category = 'Service' AND service.serviceID IN (:...userServiceIds)))",
      { userServiceIds }
    );

    // Filter by search term if provided
    if (searchQuery)
    {
      queryBuilder.andWhere(
        '(LOWER(issue.title) LIKE :search OR LOWER(issue.description) LIKE :search)',
        { search: `%${searchQuery.toLowerCase()}%` }
      );
    }

    return queryBuilder.getCount();
  }

  async updateStatus(id: number, status: string)
  {
    const issue = await this.issueRepo.findOne({ where: { id } });
    if (!issue) throw new NotFoundException(`Issue #${id} not found`);

    issue.status = status;
    return this.issueRepo.save(issue);
  }


}
