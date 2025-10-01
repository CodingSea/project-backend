import { Injectable } from '@nestjs/common';
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

  async create(certificateDto: CreateCertificateDto, userId: number): Promise<Certificate>
  {
    // Fetch the user entity
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user)
    {
      throw new Error('User not found');
    }

    // Create a new certificate and associate it with the user
    const certificate = this.certificateRepository.create({
      ...certificateDto,
      userId: user
    });

    return await this.certificateRepository.save(certificate);
  }

  async getCertificatesByUserId(userId: number): Promise<Certificate[]>
  {
    return await this.certificateRepository.find({ where: { userId: { id: userId } } });
  }

  findAll()
  {
    return `This action returns all certificate`;
  }

  findOne(id: number)
  {
    return `This action returns a #${id} certificate`;
  }

  update(id: number, updateCertificateDto: UpdateCertificateDto)
  {
    return `This action updates a #${id} certificate`;
  }

  remove(id: number)
  {
    return `This action removes a #${id} certificate`;
  }
}
