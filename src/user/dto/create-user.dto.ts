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

const passwordRegEx = /^(?=.*[a-z])(?=.*[A-Z])(?=.*d)(?=.*[@$!%*?&])[A-Za-zd@$!%*?&]{8,20}$/;

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
    @IsEnum(["admin", 'developer'])
    role: string;

    @IsNotEmpty()
    @Matches(passwordRegEx,
        {
            message: `Password must contain Minimum 8 and maximum 20 characters, 
    at least one uppercase letter, 
    one lowercase letter, 
    one number and 
    one special character`
        }
    )
    password: string;
}
