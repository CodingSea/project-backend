import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

import 
{
    IsString,
    IsAlphanumeric,
    IsEmail,
    IsEnum,
    IsInt,
    IsNotEmpty,
    isString,
    Matches,
    MinLength
} from "class-validator";

export class UpdateUserDto extends PartialType(CreateUserDto) 
{
    @IsString()
    @MinLength(2, { message: "First Name must have atleast 2 characters." })
    @IsNotEmpty()
    first_name: string;

    @IsNotEmpty()
    @MinLength(2, { message: "First Name must have atleast 2 characters." })
    last_name: string;

    @IsNotEmpty()
    @IsEmail({}, { message: 'Please provide valid Email.' })
    email: string;

    @IsString()
    @IsEnum([ "admin", 'developer' ])
    role: string;

    
}
