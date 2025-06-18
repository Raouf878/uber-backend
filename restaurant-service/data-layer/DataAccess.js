import { PrismaClient } from '@prisma/client';
import prisma from '../src/config/dbConnection.js'
import RestaurantInfo from '../../Databases/mongo/models/restaurant.js';
import DatabaseService from './DatabaseService.js';
import connectDB from '../src/config/mongoDb.js';
import mongoose from 'mongoose';

class RestaurantService extends DatabaseService {
  constructor() {
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
  // Create a new restaurant
  async createRestaurant(restaurantData) {
    const { name, userId, latitude, longitude, address, openingHours, closingHours, workingDays } = restaurantData;
    let restaurant = null;
    
    try {
      // Validate required fields
      if (!name || !userId) {
        throw new Error('Restaurant name and userId are required');
      }

      // Convert userId to integer if it's a string
      const userIdInt = typeof userId === 'string' ? parseInt(userId) : userId;
      
      // Ensure MongoDB connection is ready
      if (mongoose.connection.readyState !== 1) {
        await this.connectDB();
      }
        
      // First, save to PostgreSQL
      restaurant = await prisma.restaurant.create({
        data: {
          name,
          userId: userIdInt
        }
      });      // Then, save location data to MongoDB (if provided)
      let restaurantInfo = null;
      if (latitude && longitude && address) {
        restaurantInfo = new this.RestaurantInfo({
          restaurantId: restaurant.id.toString(),
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          address,
          openingHours: openingHours || "09:00",
          closingHours: closingHours || "22:00",
          workingDays: workingDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        });

        await restaurantInfo.save();
      }      return {
        success: true,
        restaurant,
        location: restaurantInfo || null
      };

    } catch (error) {
      // If MongoDB fails, we should clean up PostgreSQL entry
      if (restaurant?.id) {
        try {
          await prisma.restaurant.delete({
            where: { id: restaurant.id }
          });
        } catch (cleanupError) {
          console.error('Failed to cleanup PostgreSQL entry:', cleanupError);
        }
      }
      throw error;
    }
  }

  // Get restaurant with location data using direct MongoDB collection access
  async getRestaurant(restaurantId) {
    try {
      // Convert to integer if it's a string
      const id = typeof restaurantId === 'string' ? parseInt(restaurantId) : restaurantId;
      // Ensure MongoDB connection is ready
      if (mongoose.connection.readyState !== 1) {
        await this.connectDB();
      }
      const restaurant = await this.prisma.restaurant.findUnique({
        where: { id: id },
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
      if (!restaurant) return null;
      // Try direct collection access for location
      try {
        const db = mongoose.connection.db;
        const location = await db.collection('restaurantinfos').findOne({ restaurantId: id.toString() });
        return { ...restaurant, location };
      } catch (err) {
        // Fallback to Mongoose model
        const location = await this.RestaurantInfo.findOne({ restaurantId: id.toString() }).maxTimeMS(5000);
        return { ...restaurant, location };
      }
    } catch (error) {
      console.error('Error in getRestaurant:', error);
      throw error;
    }
  }

  // Get restaurants for a specific user
  async getUserRestaurants(userId) {
    try {
      const id = typeof userId === 'string' ? parseInt(userId) : userId;
      console.log('Fetching restaurants for user ID:', id);
      
      const restaurants = await this.prisma.restaurant.findMany({
        where: { userId: id },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      // Get location data for each restaurant
      const restaurantsWithLocation = await Promise.all(
        restaurants.map(async (restaurant) => {
          try {
            const location = await this.RestaurantInfo.findOne({
              restaurantId: restaurant.id.toString()
            }).maxTimeMS(3000);
            
            return {
              ...restaurant,
              location
            };
          } catch (error) {
            console.error(`Failed to get location for restaurant ${restaurant.id}:`, error);
            return {
              ...restaurant,
              location: null
            };
          }
        })
      );

      return restaurantsWithLocation;
    } catch (error) {
      console.error('Error in getUserRestaurants:', error);
      throw error;
    }
  }

  async getAllRestaurants(options = {}) {
    const { page = 1, limit = 10, userId } = options;
    const skip = (page - 1) * limit;

    try {
      // Ensure MongoDB connection is ready
      if (mongoose.connection.readyState !== 1) {
        await this.connectDB();
      }

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
          try {
            const location = await this.RestaurantInfo.findOne({
              restaurantId: restaurant.id
            }).maxTimeMS(5000);
            return {
              ...restaurant,
              location
            };
          } catch (error) {
            console.error(`Failed to get location for restaurant ${restaurant.id}:`, error);
            return {
              ...restaurant,
              location: null
            };
          }
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
    }  }

  // Update restaurant location data using direct MongoDB collection access
  async updateRestaurantLocation(restaurantId, locationData) {
    try {
      const id = typeof restaurantId === 'string' ? parseInt(restaurantId) : restaurantId;
      if (mongoose.connection.readyState !== 1) {
        await this.connectDB();
      }
      // Try direct collection update
      try {
        const db = mongoose.connection.db;
        const result = await db.collection('restaurantinfos').findOneAndUpdate(
          { restaurantId: id.toString() },
          { $set: locationData },
          { returnDocument: 'after', upsert: true }
        );
        return result.value;
      } catch (err) {
        // Fallback to Mongoose model
        const updatedLocation = await this.RestaurantInfo.findOneAndUpdate(
          { restaurantId: id.toString() },
          locationData,
          { new: true, upsert: true }
        ).maxTimeMS(5000);
        return updatedLocation;
      }
    } catch (error) {
      console.error('Error in updateRestaurantLocation:', error);
      throw error;
    }
  }
  // Delete restaurant (from both databases)
  async deleteRestaurant(restaurantId) {
    try {
      // Convert to integer if it's a string
      const id = typeof restaurantId === 'string' ? parseInt(restaurantId) : restaurantId;
      
      // Ensure MongoDB connection is ready
      if (mongoose.connection.readyState !== 1) {
        await this.connectDB();
      }

      // Delete from MongoDB first
      await this.RestaurantInfo.deleteOne({ restaurantId: id.toString() }).maxTimeMS(5000);
      
      // Then delete from PostgreSQL
      await prisma.restaurant.delete({
        where: { id: id }
      });

      return { success: true };

    } catch (error) {
      console.error('Error in deleteRestaurant:', error);
      throw error;
    }
  }  
  /**
   * Create a new menu for a restaurant
   * @param {number} restaurantId
   * @param {object} menuData { name, description, price }
   */
  async createMenu(restaurantId, menuData) {
    try {
      const id = typeof restaurantId === 'string' ? parseInt(restaurantId) : restaurantId;
      const { name, description, price } = menuData;
      if (!name || !description || typeof price !== 'number') {
        throw new Error('Menu name, description, and price are required');
      }
      const menu = await this.prisma.menu.create({
        data: {
          restaurantId: id,
          name,
          description,
          price
        }
      });
      return { success: true, menu };
    } catch (error) {
      console.error('Error creating menu:', error);
      throw error;
    }
  }

  /**
   * Get a menu by ID
   * @param {number} menuId
   */
  async getMenu(menuId) {
    try {
      const id = typeof menuId === 'string' ? parseInt(menuId) : menuId;
      const menu = await this.prisma.menu.findUnique({
        where: { id },
        include: {
          restaurant: true,
          items: { include: { item: true } }
        }
      });
      if (!menu) return { success: false, message: 'Menu not found' };
      return { success: true, menu };
    } catch (error) {
      console.error('Error fetching menu:', error);
      throw error;
    }
  }

  /**
   * Update a menu by ID
   * @param {number} menuId
   * @param {object} menuData { name, description, price }
   */
  async updateMenu(menuId, menuData) {
    try {
      const id = typeof menuId === 'string' ? parseInt(menuId) : menuId;
      const menu = await this.prisma.menu.update({
        where: { id },
        data: menuData
      });
      return { success: true, menu };
    } catch (error) {
      console.error('Error updating menu:', error);
      throw error;
    }
  }

  /**
   * Delete a menu by ID
   * @param {number} menuId
   */
  async deleteMenu(menuId) {
    try {
      const id = typeof menuId === 'string' ? parseInt(menuId) : menuId;
      await this.prisma.menu.delete({ where: { id } });
      return { success: true, message: 'Menu deleted' };
    } catch (error) {
      console.error('Error deleting menu:', error);
      throw error;
    }
  }

  /**
   * Create an item for a restaurant (optionally add to menu)
   * @param {number} restaurantId
   * @param {object} itemData { itemId, name, price, status, imageUrl }
   * @param {number|null} menuId
   */
  async createItem(restaurantId, itemData, menuId = null) {
    try {
      const restaurantIdInt = typeof restaurantId === 'string' ? parseInt(restaurantId) : restaurantId;
      const { itemId, name, price, status, imageUrl } = itemData;
      if (!itemId || !name || typeof price !== 'number' || !status) {
        throw new Error('itemId, name, price, and status are required');
      }
      const item = await this.prisma.items.create({
        data: {
          itemId,
          name,
          restaurantId: restaurantIdInt,
          price,
          status,
          imageUrl
        }
      });
      if (menuId) {
        const menuIdInt = typeof menuId === 'string' ? parseInt(menuId) : menuId;
        await this.prisma.menuItem.create({
          data: {
            menuId: menuIdInt,
            itemId: item.id
          }
        });
      }
      return { success: true, item };
    } catch (error) {
      console.error('Error creating item:', error);
      throw error;
    }
  }

  /**
   * Get all items with pagination and filtering
   */
  async getAllItems(options = {}) {
    const { 
      page = 1, 
      limit = 20, 
      status = null, 
      search = null,
      priceMin = null,
      priceMax = null 
    } = options;
    
    const skip = (page - 1) * limit;

    try {
      // Build where clause
      const where = {};
      
      if (status) {
        where.status = status;
      }
      
      if (search) {
        where.name = {
          contains: search,
          mode: 'insensitive'
        };
      }
      
      if (priceMin !== null || priceMax !== null) {
        where.price = {};
        if (priceMin !== null) where.price.gte = priceMin;
        if (priceMax !== null) where.price.lte = priceMax;
      }

      const items = await this.prisma.items.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              menuItems: true,
              orderItems: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      });

      const total = await this.prisma.items.count({ where });

      return {
        success: true,
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching items:', error);
      throw error;
    }
  }

  /**
   * Get a specific item by ID
   */
  async getItem(itemId) {
    try {
      const item = await this.prisma.items.findUnique({
        where: { id: itemId },
        include: {
          menuItems: {
            include: {
              menu: {
                include: {
                  restaurant: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            }
          },
          _count: {
            select: {
              orderItems: true
            }
          }
        }
      });

      if (!item) {
        return {
          success: false,
          message: 'Item not found'
        };
      }

      return {
        success: true,
        item
      };
    } catch (error) {
      console.error('Error fetching item:', error);
      throw error;
    }
  }

  /**
   * Update an item
   */
  async updateItem(itemId, updateData) {
    try {
      const item = await this.prisma.items.update({
        where: { id: itemId },
        data: updateData
      });

      return {
        success: true,
        item
      };
    } catch (error) {
      console.error('Error updating item:', error);
      throw error;
    }
  }

  /**
   * Delete an item
   */
  async deleteItem(itemId) {
    try {
      // First remove all menu items that reference this item
      await this.prisma.menuItem.deleteMany({
        where: { itemId }
      });

      // Then delete the item
      await this.prisma.items.delete({
        where: { id: itemId }
      });

      return {
        success: true,
        message: 'Item deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  }

  // ============ MENU ITEM OPERATIONS ============

  /**
   * Add an item to a menu
   */
  async addItemToMenu(menuId, itemId) {
    try {
      // Check if menu exists
      const menu = await this.prisma.menu.findUnique({
        where: { id: menuId }
      });

      if (!menu) {
        throw new Error('Menu not found');
      }

      // Check if item exists
      const item = await this.prisma.items.findUnique({
        where: { id: itemId }
      });

      if (!item) {
        throw new Error('Item not found');
      }

      // Check if item is already in menu
      const existingMenuItem = await this.prisma.menuItem.findUnique({
        where: {
          menuId_itemId: {
            menuId,
            itemId
          }
        }
      });

      if (existingMenuItem) {
        return {
          success: false,
          message: 'Item already exists in this menu'
        };
      }

      // Add item to menu
      const menuItem = await this.prisma.menuItem.create({
        data: {
          menuId,
          itemId
        },
        include: {
          menu: {
            select: {
              id: true,
              restaurant: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          item: true
        }
      });

      return {
        success: true,
        menuItem
      };
    } catch (error) {
      console.error('Error adding item to menu:', error);
      throw error;
    }
  }

  /**
   * Remove an item from a menu
   */
  async removeItemFromMenu(menuId, itemId) {
    try {
      const menuItem = await this.prisma.menuItem.findUnique({
        where: {
          menuId_itemId: {
            menuId,
            itemId
          }
        }
      });

      if (!menuItem) {
        return {
          success: false,
          message: 'Item not found in this menu'
        };
      }

      await this.prisma.menuItem.delete({
        where: {
          menuId_itemId: {
            menuId,
            itemId
          }
        }
      });

      return {
        success: true,
        message: 'Item removed from menu successfully'
      };
    } catch (error) {
      console.error('Error removing item from menu:', error);
      throw error;
    }
  }

  /**
   * Get all items in a specific menu
   */
  async getMenuItems(menuId, options = {}) {
    const { status = null, search = null } = options;

    try {
      const where = { menuId };
      
      // Add item filters
      if (status || search) {
        where.item = {};
        if (status) where.item.status = status;
        if (search) {
          where.item.name = {
            contains: search,
            mode: 'insensitive'
          };
        }
      }

      const menuItems = await this.prisma.menuItem.findMany({
        where,
        include: {
          item: true,
          menu: {
            select: {
              id: true,
              restaurant: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          item: {
            name: 'asc'
          }
        }
      });

      return {
        success: true,
        menuItems
      };
    } catch (error) {
      console.error('Error fetching menu items:', error);
      throw error;
    }
  }

  /**
   * Bulk add items to a menu
   */
  async bulkAddItemsToMenu(menuId, itemIds) {
    try {
      // Verify menu exists
      const menu = await this.prisma.menu.findUnique({
        where: { id: menuId }
      });

      if (!menu) {
        throw new Error('Menu not found');
      }

      // Verify all items exist
      const items = await this.prisma.items.findMany({
        where: {
          id: {
            in: itemIds
          }
        }
      });

      if (items.length !== itemIds.length) {
        throw new Error('Some items not found');
      }

      // Get existing menu items to avoid duplicates
      const existingMenuItems = await this.prisma.menuItem.findMany({
        where: {
          menuId,
          itemId: {
            in: itemIds
          }
        }
      });

      const existingItemIds = existingMenuItems.map(mi => mi.itemId);
      const newItemIds = itemIds.filter(id => !existingItemIds.includes(id));

      if (newItemIds.length === 0) {
        return {
          success: false,
          message: 'All items already exist in this menu'
        };
      }

      // Create menu items
      const menuItemsData = newItemIds.map(itemId => ({
        menuId,
        itemId
      }));

      await this.prisma.menuItem.createMany({
        data: menuItemsData
      });

      return {
        success: true,
        message: `${newItemIds.length} items added to menu successfully`,
        addedCount: newItemIds.length,
        skippedCount: existingItemIds.length
      };
    } catch (error) {
      console.error('Error bulk adding items to menu:', error);
      throw error;
    }
  }

  /**
   * Bulk remove items from a menu
   */
  async bulkRemoveItemsFromMenu(menuId, itemIds) {
    try {
      const result = await this.prisma.menuItem.deleteMany({
        where: {
          menuId,
          itemId: {
            in: itemIds
          }
        }
      });

      return {
        success: true,
        message: `${result.count} items removed from menu successfully`,
        removedCount: result.count
      };
    } catch (error) {
      console.error('Error bulk removing items from menu:', error);
      throw error;
    }
  }

  /**
   * Get menu statistics
   */
  async getMenuStats(menuId) {
    try {
      const menu = await this.prisma.menu.findUnique({
        where: { id: menuId },
        include: {
          restaurant: {
            select: {
              id: true,
              name: true
            }
          },
          items: {
            include: {
              item: true
            }
          }
        }
      });

      if (!menu) {
        return {
          success: false,
          message: 'Menu not found'
        };
      }

      const stats = {
        totalItems: menu.items.length,
        availableItems: menu.items.filter(mi => mi.item.status === 'available').length,
        unavailableItems: menu.items.filter(mi => mi.item.status === 'unavailable').length,
        averagePrice: menu.items.length > 0 
          ? menu.items.reduce((sum, mi) => sum + mi.item.price, 0) / menu.items.length 
          : 0,
        priceRange: menu.items.length > 0 
          ? {
              min: Math.min(...menu.items.map(mi => mi.item.price)),
              max: Math.max(...menu.items.map(mi => mi.item.price))
            }
          : { min: 0, max: 0 }
      };

      return {
        success: true,
        menu: {
          id: menu.id,
          restaurant: menu.restaurant
        },
        stats
      };
    } catch (error) {
      console.error('Error fetching menu stats:', error);
      throw error;
    }
  }
}

export default RestaurantService;