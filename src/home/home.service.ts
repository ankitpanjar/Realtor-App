import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { HomeResponseDto } from './dto/home.dto';
import { PropertyType } from '@prisma/client';
import { UserInfoDecorator } from 'src/user/decorator/user.decorator';




interface GetHomesParams {
    city?: string;
    price?: {
        gte?: number;
        lte?: number;
    };
    propertyType?: PropertyType;
}

interface CreateHomeParams {
    address             : string;
    numberOfBedrooms  : number;
    numberOfBathrooms : number;
    city                : string;
    price               : number;
    landSize           : number;
    propertyType       : PropertyType;
    images              : {url:string}[]
}

interface UpdateHomeParams {
    address      ?       : string;
    numberOfBedrooms  ? : number;
    numberOfBathrooms ? : number;
    city         ?       : string;
    price        ?       : number;
    landSize     ?      : number;
    propertyType ?      : PropertyType;
}




@Injectable()
export class HomeService {

    constructor(private readonly prismaService: PrismaService){}

    async getHomes( filters: GetHomesParams): Promise<HomeResponseDto[]> {
        const homes = await this.prismaService.home.findMany({
            select: {
                id: true,
                address: true,
                city: true,
                price: true,
                property_type: true,
                number_of_bathrooms: true,
                number_of_bedrooms: true,
                images: {
                    select: {
                        url: true
                    }, 
                    take: 1
                }, 
            }, 
            where: filters
        })

        if (!homes) throw new NotFoundException()
        return homes.map(home => {
            return new HomeResponseDto(home)
        })
    }


    async getHomeById(id: number){

        const home = await this.prismaService.home.findUnique({
            select: {
                id: true,
                address: true,
                city: true,
                price: true,
                property_type: true,
                number_of_bathrooms: true,
                number_of_bedrooms: true,
                images: {
                    select: {
                        url: true
                    }, 
                }, 
            },
            where: {id},
        })

        if (!home) throw new NotFoundException();

        return new HomeResponseDto(home)
    }

    async createHome(data: CreateHomeParams, userId: number){
        const home = await this.prismaService.home.create({
            data: {
                address: data.address,
                number_of_bathrooms: data.numberOfBathrooms,
                number_of_bedrooms: data.numberOfBedrooms,
                city: data.city,
                land_size: data.landSize,
                property_type: data.propertyType,
                price: data.price,
                realtor_id: userId,
            },
        });

        const homeImages = data.images.map(image => {
            return {...image, home_id: home.id}
        })

        await this.prismaService.image.createMany({
            data: homeImages
        })
       
        return new HomeResponseDto(home)
        
    }

    async updateHomeById(data: UpdateHomeParams, id: number){
        const home = await this.prismaService.home.findUnique({
            where: {
                id,
            },
        });

        if (!home) throw new NotFoundException()

        const updatedHome = await this.prismaService.home.update({
            where: {
                id
            },
            data
        })

        return new HomeResponseDto(updatedHome)
    }

    async deleteHomeById(id: number){

        await this.prismaService.image.deleteMany({
            where: {
                home_id: id,
            }
        })

        await this.prismaService.home.delete({
            where: {
                id,
            },
        });

        return 'Deleted Successfully'
    }

    async getRealtorByHomeId(id: number){
        const home = await this.prismaService.home.findUnique({
            where: {
                id,
            },
            select: {
                realtor: {
                    select: {
                        name: true,
                        id: true,
                        email: true,
                        phone: true,
                    }
                }
            }
        })
        if (!home) throw new NotFoundException();
        return home.realtor
    }

    async inquire(buyer: UserInfoDecorator, homeId: number, message: string){
        const realtor = await this.getRealtorByHomeId(homeId)

        return await this.prismaService.message.create({
            data: {
                realtor_id: realtor.id,
                buyer_id: buyer.id,
                home_id: homeId,
                message,
            },
        });
    }

    async getMessagesByHome(homeId:number ){

        const msgs = await this.prismaService.message.findMany({
            where: {
                home_id: homeId,
            },
            select: {
                message: true,
                buyer: {
                    select:{
                        name: true,
                        phone: true,
                        email: true,
                    }
                }
            }
        });
        return msgs
    }
}