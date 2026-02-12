import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
    @IsEmail()
    @IsNotEmpty()
    email: string = '';

    @IsString()
    @IsNotEmpty()
    @MinLength(6, { message: 'Password must be at least 6 characters' })
    password: string = '';
}

export class LoginDto {
    @IsEmail()
    @IsNotEmpty()
    email: string = '';

    @IsString()
    @IsNotEmpty()
    password: string = '';
}
