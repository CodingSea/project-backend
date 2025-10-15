import { IsNotEmpty, IsString, IsDateString } from 'class-validator';
import { IsNull } from 'typeorm';

export class CreateCertificateDto
{
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    type: string;

    @IsNotEmpty()
    @IsString()
    issuingOrganization: string;

    @IsNotEmpty()
    @IsDateString()
    issueDate: string;

    @IsNotEmpty()
    @IsDateString()
    expiryDate: Date;

    @IsString()
    description: string;

    // @IsString()
    // CertificateFile: string; // Assuming this is a URL or path to the file
}