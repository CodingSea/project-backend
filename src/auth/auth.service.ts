import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';

@Injectable()
export class AuthService
{
    constructor(
        private userService: UserService,
        private jwtService: JwtService
    ) { }

    async signIn(email: string, pass: string): Promise<{ access_token: string }>
    {
        const user = await this.userService.findByEmail(email);
        if (!user)
        {
            throw new UnauthorizedException('User not found');
        }

        const isCorrect = await bcrypt.compare(pass, user.password);
        if (!isCorrect)
        {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload = {
            sub: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
        };

        return {
            access_token: this.jwtService.sign(payload),
        };
    }

}
