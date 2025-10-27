import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsArray,
  MinLength,
  Matches,
  IsNotEmpty,
} from 'class-validator';

const passwordRegEx = /^(?=.*[a-zA-Z])[a-zA-Z0-9]{5,20}$/;

export class CreateUserDto {
  @IsString()
  @MinLength(2, { message: 'First Name must have at least 2 characters.' })
  @IsNotEmpty()
  first_name: string;

  @IsString()
  @MinLength(2, { message: 'Last Name must have at least 2 characters.' })
  @IsNotEmpty()
  last_name: string;

  @IsNotEmpty()
  @IsEmail({}, { message: 'Please provide a valid Email.' })
  email: string;

  @IsNotEmpty()
  @Matches(passwordRegEx, {
    message: `Password must contain between 5 and 20 characters, 
at least one uppercase letter, one lowercase letter, and one number.`,
  })
  password: string;

  @IsOptional()
  @IsEnum(['admin', 'developer'])
  role?: string;

  // ✅ Added to fix the error (skills array)
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];
}
