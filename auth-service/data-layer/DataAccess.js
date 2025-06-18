
import prisma from '../src/config/dbConnection.js';
import RestaurantInfo from "../../Databases/mongo/models/restaurant.js";
import bcrypt from 'bcrypt';
 import { Prisma } from '@prisma/client';
 import DatabaseService from './DatabaseService.js';
 import connectDB from '../src/config/mongoDb.js';


class DataAccess extends DatabaseService {
    constructor(){
        super();
        this.prisma = prisma;
        this.RestaurantInfo = RestaurantInfo;
        this.connectDB = connectDB;
        this.initializeMongoDB();
    }
    async initializeMongoDB() {
        try {
          await this.connectDB();
          console.log('MongoDB connection initialized in RestaurantService');
        } catch (error) {
          console.error('Failed to initialize MongoDB connection:', error);
        }
      }
    async RegisterRestaurant(restaurantData) {
        const {firstName, lastName, restaurantName, email, password, restaurantLat, restaurantLong, restaurantAddress, openingHours, closingHours, workingDays,role}= restaurantData;
        try {
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);
             const result = await prisma.$transaction(async (tx) => {
                    const newUser = await tx.user.create({
                        data: {
                            firstName,
                            lastName,
                            email,
                            password: passwordHash,
                            role,
                        },
                    });
            
                    // Create restaurant for the new user
                    const newRestaurant = await tx.restaurant.create({
                        data: {
                            userId: newUser.id,
                            name: restaurantName,
            
                            // Associate the restaurant with the new user
                        },
                    });
                    
                    // Save restaurant location data to MongoDB
                    const RestaurantInfo = new this.RestaurantInfo({
                        restaurantId: newUser.id,
                        latitude: restaurantLat ? parseFloat(restaurantLat) : null,
                        longitude: restaurantLong ? parseFloat(restaurantLong) : null,
                        address: restaurantAddress,
                        openingHours,
                        closingHours,
                        workingDays
                    });

                    await RestaurantInfo.save();

                    return { user: newUser, restaurant: newRestaurant };    
                }
                );

            return result;
        } catch (error) {
            console.error("Error creating restaurant:", error);
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                return res.status(409).json({
                    success: false,
                    message: 'A user with this email already exists.'
                });
            }
        }
            throw error;
        }
    }
    async RegisterClient(clientData){
        const { firstName, lastName, email, password, role } = clientData;
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const newUser = await prisma.user.create({
                    data: {
                        firstName,
                        lastName,
                        email,
                        password:passwordHash,
                        role,
                    },
                });
                return newUser;
        
    }
    async RegisterDeliveryPerson(deliveryPersonData){
        const { firstName, lastName, email, password, role } = deliveryPersonData;
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        
        const newUser = await prisma.user.create({
            data: {
                firstName,
                lastName,
                email,
                password: passwordHash,
                role,
            },
        });
        return newUser;

    }

}
export default DataAccess