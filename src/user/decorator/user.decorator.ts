import {createParamDecorator, ExecutionContext, UnauthorizedException} from '@nestjs/common'


export interface UserInfoDecorator {
    name: string,
    id: number,
    iat: number;
    exp: number;
}

export const User = createParamDecorator((data, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    if (!request.user) throw new UnauthorizedException({message: 'JWT Token Required'})
    console.log('this is user decorator')
    return request.user
})