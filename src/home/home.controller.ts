import { Controller, Delete, Get, Post, Put, Query, Param, ParseIntPipe, Body, UnauthorizedException, UseGuards } from '@nestjs/common';
import { HomeService } from './home.service';
import { CreateHomeDto, HomeResponseDto, InquireDto, UpdateHomeDto } from './dto/home.dto';
import { User } from 'src/user/decorator/user.decorator';
import { UserInfoDecorator } from 'src/user/decorator/user.decorator';
import { Roles } from 'src/decorators/roles.decorator';
import { UserType } from '@prisma/client';


@Controller('home')
export class HomeController {

    constructor(private readonly homeService: HomeService){}

    @Get()
    getHomes(
        @Query('city') city?: string,
        @Query('minPrice') minPrice?: string,
        @Query('maxPrice') maxPrice?: string,
        @Query('propertyType') propertyType?: string,

    ) : Promise<HomeResponseDto[]> { 

        const price = minPrice || maxPrice ? {
            ...(minPrice && {gte: parseFloat(minPrice)}),
            ...(maxPrice && {lte: parseFloat(maxPrice)})
        } : undefined
        
        const filters = {
            ...(city && {city}),
            ...(price && {price}),
           ...(propertyType && { property_type: propertyType,})
        }

        return this.homeService.getHomes(filters)
    }

    @Get(':id')
    getHomeById(
        @Param('id', ParseIntPipe) homeId: number
    ){
        return this.homeService.getHomeById(homeId)
    }

    @Roles(UserType.ADMIN, UserType.REALTOR)
    @Post()
    createHome(
        @Body() body: CreateHomeDto, @User() user: UserInfoDecorator
    ){
        
        // return this.homeService.createHome(body, user.id)
        return 'Created Home'
    }

    @Roles(UserType.ADMIN, UserType.REALTOR)
    @Put(":id")
    async updateHome(
        @Param("id", ParseIntPipe) homeId:number,
        @Body() body: UpdateHomeDto,
        @User() user: UserInfoDecorator, 
    ){

        const realtor = await this.homeService.getRealtorByHomeId(homeId)
        if (realtor.id !== user.id){
            throw new UnauthorizedException()
        }
        return this.homeService.updateHomeById(body, homeId)
    }

    @Roles(UserType.ADMIN, UserType.REALTOR)
    @Delete(':id')
    async deleteHome(
        @Param('id', ParseIntPipe) homeId: number,
        @User() user:UserInfoDecorator
    ){
        const realtor = await this.homeService.getRealtorByHomeId(homeId)
        if (realtor.id !== user.id){
            throw new UnauthorizedException()
        }
      
        return this.homeService.deleteHomeById(homeId)  
    }


    @Roles(UserType.BUYER)
    @Post('/:id/inquire')
    inquireDto(
        @Param('id', ParseIntPipe) homeId: number,
        @User() user:UserInfoDecorator,
        @Body() {message}: InquireDto
    ){
        return this.homeService.inquire(user,homeId, message)
    }

    @Roles(UserType.REALTOR)
    @Get('/:id/messages')
    async getHomeMessages(
        @Param('id', ParseIntPipe) homeId: number,
        @User() user: UserInfoDecorator,
    ){
        const realtor = await this.homeService.getRealtorByHomeId(homeId)
        if(!realtor) throw new UnauthorizedException();

        return this.homeService.getMessagesByHome(homeId)
    }
}