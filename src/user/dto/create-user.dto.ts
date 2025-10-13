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
    MinLength,
    IsOptional
} from "class-validator";

const passwordRegEx = /^(?=.*[a-zA-Z])[a-zA-Z0-9]{5,20}$/;

export class CreateUserDto
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
    @IsOptional()
    @IsEnum(["admin", 'developer'])
    role?: string;

    @IsNotEmpty()
    @Matches(passwordRegEx,
        {
            message: `Password must contain Minimum 5 and maximum 20 characters, 
    at least one uppercase letter, 
    one lowercase letter, 
    one number`
        }
    )
    password: string;
}
