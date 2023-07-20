import { Injectable, NotAcceptableException, HttpException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcryptjs'
import * as jwt from 'jsonwebtoken'
import { UserType } from '@prisma/client';



interface SignupParams{
    name: string;
    password: string;
    email: string;
    phone: string;
}

interface SigninParams {
    email: string;
    password: string;
}

@Injectable()
export class AuthService {

    constructor(private readonly prismaService: PrismaService){}

     async signup({email, password, phone, name}: SignupParams, userType: UserType){

        const userExists = await this.prismaService.user.findUnique({
            where: {
                email
            }
        })

        if(userExists) throw new NotAcceptableException("User Exists Already");

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await this.prismaService.user.create({
            data: {
                email, name, phone,
                password: hashedPassword,
                user_type: userType,
            }
        })

        const token = await this.generateJwt(user.name, user.id)

        return token
    }

    async signin({email, password}: SigninParams){
        const user = await this.prismaService.user.findUnique({
            where: {
                email
            }
        })

        if (!user) throw new HttpException("Invallid Email", 400)

        const hashedPassword = user.password

        const isValidPassword = await bcrypt.compare(password, hashedPassword)

        if (!isValidPassword) throw new HttpException("Incorrect Password", 400)

        const token = await this.generateJwt(user.name, user.id)

        return token

    }

    private async generateJwt(name: string, id: number){

        const jwtToken = await jwt.sign(
              {name, id},
              "MY_SECRET_TOKEN",
              {expiresIn: 36000})
        return jwtToken
    }

    async generateProductKey(email: string, userType: UserType){
        const string = `${email}-${userType}- ${"MY_SECRET_PRODUCT_KEY"}`;

        return bcrypt.hash(string, 10)
    }

    async createImage(image){

        const images = await this.prismaService.image.create({
            data: {
                url: image,
                home_id: 2
            }
        })
    }
}
 