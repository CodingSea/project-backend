import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CertificateService } from './certificate.service';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';
import { Certificate } from './entities/certificate.entity';

@Controller('certificate')
export class CertificateController
{
  constructor(private readonly certificateService: CertificateService) { }

  @Post(":id")
  async create(
    @Param('id') userId: number,
    @Body() createCertificateDto: CreateCertificateDto
  ): Promise<Certificate>
  {
    return await this.certificateService.create(createCertificateDto, userId);
  }

  @Get()
  findAll()
  {
    return this.certificateService.findAll();
  }

  @Get(':userId')
  async getCertificates(@Param('userId') userId: number): Promise<Certificate[]>
  {
    return await this.certificateService.getCertificatesByUserId(userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCertificateDto: UpdateCertificateDto)
  {
    return this.certificateService.update(+id, updateCertificateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string)
  {
    return this.certificateService.remove(+id);
  }
}
