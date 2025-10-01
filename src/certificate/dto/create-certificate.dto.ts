import { IsNotEmpty, IsString, IsDateString } from 'class-validator';

export class CreateCertificateDto
{
    @IsNotEmpty()
    @IsString()
    Name: string;

    @IsNotEmpty()
    @IsString()
    Type: string;

    @IsNotEmpty()
    @IsString()
    IssuingOrganization: string;

    @IsNotEmpty()
    @IsDateString()
    IssueDate: string;

    @IsNotEmpty()
    @IsDateString()
    ExpiryDate: Date;

    @IsNotEmpty()
    @IsString()
    Description: string;

    @IsNotEmpty()
    @IsString()
    CertificateFile: string; // Assuming this is a URL or path to the file
}