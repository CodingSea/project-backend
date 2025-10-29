import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { IssueService } from './issue.service';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { Issue } from './entities/issue.entity';

@Controller('issue')
export class IssueController
{
  constructor(private readonly issueService: IssueService) { }

  @Post()
  create(@Body() createIssueDto: CreateIssueDto)
  {
    return this.issueService.create(createIssueDto);
  }

  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('search') searchQuery?: string
  )
  {
    return this.issueService.getIssues(page, limit, status, category, searchQuery);
  }

  @Get('count')
  async countFilteredIssues(
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('search') searchQuery?: string
  ): Promise<number>
  {
    return this.issueService.countIssues(status, category, searchQuery);
  }

  @Get(':id')
  findOne(@Param('id') id: string)
  {
    return this.issueService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateIssueDto: UpdateIssueDto)
  {
    return this.issueService.update(+id, updateIssueDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string)
  {
    return this.issueService.remove(+id);
  }
}
