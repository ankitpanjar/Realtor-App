import { CallHandler, ExecutionContext, NestInterceptor } from "@nestjs/common";
import * as  jwt from 'jsonwebtoken'


export class UserInterceptor implements NestInterceptor {
    async intercept(
        context: ExecutionContext, handler: CallHandler
    ) {
        const request = context.switchToHttp().getRequest()
        const jwtToken = request?.headers?.authorization?.split(" ")[1]
        const user = await jwt.decode(jwtToken)
        request.user = user 
        console.log('this is user interceptor')

        return handler.handle()
    }
}