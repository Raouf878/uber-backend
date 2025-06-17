import { PrismaClient } from '@prisma/client';
import prisma from '../src/config/dbConnection.js'
import RestaurantInfo from '../../Databases/mongo/models/restaurant.js';
import mongoose from 'mongoose';


class RestaurantService {
  constructor() {
    this.prisma = prisma;
    this.RestaurantInfo = RestaurantInfo;
  }

  // Create a new restaurant
  async createRestaurant(restaurantData) {
    const { name, userId, latitude, longitude, address, openingHours, closingHours, workingDays } = restaurantData;
    
    try {
        
      // First, save to PostgreSQL
      const restaurant = await prisma.restaurant.create({
        data: {
          name,
          userId
        }
      });

      // Then, save location data to MongoDB
      const RestaurantInfo = new RestaurantInfo({
        restaurantId: restaurant.id,
        latitude,
        longitude,
        address,
        openingHours,
        closingHours,
        workingDays
      });

      await RestaurantInfo.save();

      return {
        success: true,
        restaurant,
        location: RestaurantInfo
      };

    } catch (error) {
      // If MongoDB fails, we should clean up PostgreSQL entry
      if (restaurant?.id) {
        await prisma.restaurant.delete({
          where: { id: restaurant.id }
        });
      }
      throw error;
    }
  }

  // Get restaurant with location data
  async getRestaurant(restaurantId) {
    try {
      console.log('Fetching restaurant with ID data access:', restaurantId);
      
      const restaurant = await this.prisma.restaurant.findUnique({
        where: { id: restaurantId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          menu: {
            include: {
              items: {
                include: {
                  item: true
                }
              }
            }
          }
        }
      });

      if (!restaurant) {
        return null;
      }

      const location = await this.RestaurantInfo.findOne({
        restaurantId: restaurantId
      });

      return {
        ...restaurant,
        location
      };
    } catch (error) {
      throw error;
    }
  }

  async getAllRestaurants(options = {}) {
    const { page = 1, limit = 10, userId } = options;
    const skip = (page - 1) * limit;

    try {
      const where = userId ? { userId } : {};
      
      const restaurants = await this.prisma.restaurant.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          _count: {
            select: {
              menu: true,
              orders: true
            }
          }
        }
      });

      // Get location data for each restaurant
      const restaurantsWithLocation = await Promise.all(
        restaurants.map(async (restaurant) => {
          const location = await this.RestaurantInfo.findOne({
            restaurantId: restaurant.id
          });
          return {
            ...restaurant,
            location
          };
        })
      );

      const total = await this.prisma.restaurant.count({ where });

      return {
        restaurants: restaurantsWithLocation,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }


  

  // Update restaurant location data
  async updateRestaurantLocation(restaurantId, locationData) {
    try {
      const updatedLocation = await RestaurantInfo.findOneAndUpdate(
        { restaurantId },
        locationData,
        { new: true }
      );

      return updatedLocation;

    } catch (error) {
      throw error;
    }
  }

  // Delete restaurant (from both databases)
  async deleteRestaurant(restaurantId) {
    try {
      // Delete from MongoDB first
      await RestaurantInfo.deleteOne({ restaurantId });
      
      // Then delete from PostgreSQL
      await prisma.restaurant.delete({
        where: { id: restaurantId }
      });

      return { success: true };

    } catch (error) {
      throw error;
    }
  }
}
export default RestaurantService;