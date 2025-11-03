import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { User } from 'src/user/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Issue } from './entities/issue.entity';
import { S3Service } from 'src/s3/s3.service';

@Injectable()
export class IssueService {
  constructor(
    @InjectRepository(Issue)
    private readonly issueRepo: Repository<Issue>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    private readonly s3Service: S3Service
  ) {}

  async create(createIssueDto: CreateIssueDto) {
    const issue = this.issueRepo.create({
      title: createIssueDto.title,
      description: createIssueDto.description,
      status: createIssueDto.status ?? 'open',
      category: createIssueDto.category,
      codeSnippet: createIssueDto.codeSnippet,
      attachments: createIssueDto.attachments ?? [],
    });

    if (createIssueDto.createdById) {
      const user = await this.userRepo.findOne({ where: { id: createIssueDto.createdById } });
      if (user) issue.createdBy = user;
    }

    return this.issueRepo.save(issue);
  }

  async getIssues(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const issues = await this.issueRepo.find({
      relations: ['createdBy'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    for (const issue of issues) {
      if (issue.createdBy?.profileImageID) {
        issue.createdBy.profileImage = await this.s3Service.getSignedUrl(
          issue.createdBy.profileImageID
        );
      }

      if (issue.attachments?.length) {
        issue.attachments = await Promise.all(
          issue.attachments.map(async (file) => ({
            name: file.name,
            url: await this.s3Service.getSignedUrl(file.url ?? file, 3600),
          }))
        );
      }
    }

    return issues;
  }

  async findOne(id: number) {
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
    if (issue.createdBy?.profileImageID) {
      issue.createdBy.profileImage = await this.s3Service.getSignedUrl(
        issue.createdBy.profileImageID
      );
    }

    // Issue Attachments
    if (issue.attachments?.length) {
      issue.attachments = await Promise.all(
        issue.attachments.map(async (file) => ({
          name: file.name,
          url: await this.s3Service.getSignedUrl(file.url ?? file, 3600),
        }))
      );
    }

    // Feedback + Comments images
    for (const fb of issue.feedbacks ?? []) {

      // Feedback user avatar
      if (fb.user?.profileImageID) {
        fb.user.profileImage = await this.s3Service.getSignedUrl(
          fb.user.profileImageID
        );
      }

      // Feedback attachments
      if (fb.attachments?.length) {
        fb.attachments = await Promise.all(
          fb.attachments.map(async (file) => ({
            name: file.name,
            url: await this.s3Service.getSignedUrl(file.url ?? file, 3600),
          }))
        );
      }

      // Comments user avatar
      for (const c of fb.comments ?? []) {
        if (c.user?.profileImageID) {
          c.user.profileImage = await this.s3Service.getSignedUrl(
            c.user.profileImageID
          );
        }
      }
    }

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
    return { message: `Issue #${id} deleted` };
  }
}
