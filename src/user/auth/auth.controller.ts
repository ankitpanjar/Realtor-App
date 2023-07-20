import { Body, Controller, Get, Param, ParseEnumPipe, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto,SigninDto,GenerateProductKeyDto } from '../dtos/auth.dtos';
import { UserType } from '@prisma/client';
import * as bcrypt from 'bcryptjs'

import { User,UserInfoDecorator } from '../decorator/user.decorator';

@Controller('auth')
export class AuthController {

    constructor(private readonly authService: AuthService){}

    @Post('/signup/:userType')
    async signup(@Body() body: SignupDto, @Param("userType", new ParseEnumPipe(UserType)) userType: UserType ){

        if (userType !== UserType.BUYER){
            if (!body.productKey){
                throw new UnauthorizedException({message: "No Product Key, ProductKey Required"});
            }

            const validProductKey = `${body.email}-${userType}- ${"MY_SECRET_PRODUCT_KEY"}`;

            const isValidProductKey = await bcrypt.compare(validProductKey, body.productKey)

            if (!isValidProductKey) throw new UnauthorizedException({message: "Product Key Mismatch"})
        }

        return this.authService.signup(body, userType)
    }

    @Post('/signin')
    signin(@Body() body: SigninDto){
        return this.authService.signin(body)
    }

    @Post('/key')
    generateProductKey(
        @Body() {email, userType}: GenerateProductKeyDto
    ){
        return this.authService.generateProductKey(email, userType)
    }

    @Get('/me')
    me(
        @User() user: UserInfoDecorator
    ){
        return user
    }
}