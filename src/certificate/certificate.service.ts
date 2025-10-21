import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';
import { Certificate } from './entities/certificate.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class CertificateService
{
  constructor(
    @InjectRepository(Certificate)
    private readonly certificateRepository: Repository<Certificate>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) { }

  //  Create Certificate
  async create(
    dto: CreateCertificateDto,
    userId: number,
    fileUrls: string[] = []
  ): Promise<Certificate>
  {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const certificate = this.certificateRepository.create({
      ...dto,
      user: user,
      certificateFile: fileUrls.length ? fileUrls : []
    });

    return await this.certificateRepository.save(certificate);
  }

  //  Get all certificates for a specific user
  async getCertificatesByUserId(userId: number): Promise<Certificate[]>
  {
    return await this.certificateRepository.find({
      where: { user: { id: userId } },
      relations: [ 'user' ],
    });
  }

  findAll()
  {
    return this.certificateRepository.find({ relations: [ 'user' ] });
  }

  //  Update certificate info
  async update(id: number, dto: UpdateCertificateDto): Promise<Certificate>
  {
    const cert = await this.certificateRepository.findOne({
      where: { certificateID: id },
    });
    if (!cert) throw new NotFoundException(`Certificate ${id} not found`);

    Object.assign(cert, dto);
    return this.certificateRepository.save(cert);
  }

  //  Delete certificate
  async remove(id: number): Promise<void>
  {
    await this.certificateRepository.delete(id);
  }
}
