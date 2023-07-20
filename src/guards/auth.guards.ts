import { CanActivate, Injectable, ExecutionContext } from "@nestjs/common";
import { Reflector} from "@nestjs/core"
import * as jwt from 'jsonwebtoken'
import { PrismaService } from "src/prisma/prisma.service";


interface JWTPayload {
    name: string; id: number; iat: number; exp: number;
}

@Injectable()
export class AuthGuard implements CanActivate{

    constructor(private readonly reflector: Reflector,
                private readonly prismaService:PrismaService){}

    async canActivate(context: ExecutionContext){
        // 1) Determine the UserTypes that can execute the called endpoint
        const roles = this.reflector.getAllAndOverride('roles', [
            context.getHandler(),
            context.getClass(),
        ]);

        console.log('this is AuthGuard')

        // 2) Grab the JWT token from the request header and verify it
        if(roles?.length){
            const request = context.switchToHttp().getRequest()
            const token =  request.headers?.authorization?.split(" ")[1]
            try {
                const payload = await jwt.verify(token, 'MY_SECRET_TOKEN') as JWTPayload
                
                const user = await this.prismaService.user.findUnique({
                    where: {
                        id: payload.id,
                    }
                })
                if(!user) return false 
                if(roles.includes(user.user_type)) return true
           
                return false
                
            } catch (error) {
                return false
            } 
        }
        // 3) Database request to get user by id 
        // 4) Determine if the user can permission

        return true
    }
}