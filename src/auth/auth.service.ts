import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService
{
    constructor(
        private userService: UserService,
        private jwtService: JwtService
    ) {}

    async signIn(email: string, pass: string): Promise<{access_token: string}>
    {

        console.log(email);
        console.log(pass);
        const user = await this.userService.findByEmail(email);
        if(user?.password !== pass)
        {
            throw new UnauthorizedException();
        }
        
        const payload = {sub: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name}

        return {
            access_token: await this.jwtService.sign(payload),
        };
    }
}
