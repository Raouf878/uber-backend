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
      // Ensure MongoDB connection is ready
      if (mongoose.connection.readyState !== 1) {
        await this.connectDB();
      }
        
      // First, save to PostgreSQL
      restaurant = await prisma.restaurant.create({
        data: {
          name,
          userId
        }
      });

      // Then, save location data to MongoDB
      const restaurantInfo = new this.RestaurantInfo({
        restaurantId: restaurant.id,
        latitude,
        longitude,
        address,
        openingHours,
        closingHours,
        workingDays
      });

      await restaurantInfo.save();

      return {
        success: true,
        restaurant,
        location: restaurantInfo
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

  // Get restaurant with location data
  async getRestaurant(restaurantId) {
    try {
      console.log('Fetching restaurant with ID:', restaurantId);
      
      // Ensure MongoDB connection is ready
      if (mongoose.connection.readyState !== 1) {
        console.log('MongoDB not connected, reconnecting...');
        await this.connectDB();
      }
      
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

      // Test the collection access like in your connectDB
      try {
        const db = mongoose.connection.db;
        const count = await db.collection('restaurantinfos').countDocuments();
        console.log(`Total documents in restaurantinfos collection: ${count}`);
        
        // Get a sample document to see the structure
        const sampleDoc = await db.collection('restaurantinfos').findOne();
        console.log('Sample document structure:', sampleDoc ? Object.keys(sampleDoc) : 'No documents found');
        
        // Now search for the specific restaurant location using direct collection access
        console.log('Searching for location with restaurantId:', restaurant.id);
        const location = await db.collection('restaurantinfos').findOne({
          restaurantId: restaurant.id
        });
        
        console.log('Location found:', location ? 'Yes' : 'No');
        if (location) {
          console.log('Location data keys:', Object.keys(location));
        }

        return {
          ...restaurant,
          location
        };
      } catch (testError) {
        console.log('Direct collection access failed:', testError.message);
        
        // Fallback to Mongoose model approach
        console.log('Falling back to Mongoose model approach...');
        const location = await this.RestaurantInfo.findOne({
          restaurantId: restaurant.id
        }).maxTimeMS(5000);

        console.log('Mongoose fallback - Location found:', location ? 'Yes' : 'No');

        return {
          ...restaurant,
          location
        };
      }
    } catch (error) {
      console.error('Error in getRestaurant:', error);
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
    }
  }

  // Update restaurant location data
  async updateRestaurantLocation(restaurantId, locationData) {
    try {
      // Ensure MongoDB connection is ready
      if (mongoose.connection.readyState !== 1) {
        await this.connectDB();
      }

      const updatedLocation = await this.RestaurantInfo.findOneAndUpdate(
        { restaurantId },
        locationData,
        { new: true }
      ).maxTimeMS(5000);

      return updatedLocation;

    } catch (error) {
      throw error;
    }
  }

  // Delete restaurant (from both databases)
  async deleteRestaurant(restaurantId) {
    try {
      // Ensure MongoDB connection is ready
      if (mongoose.connection.readyState !== 1) {
        await this.connectDB();
      }

      // Delete from MongoDB first
      await this.RestaurantInfo.deleteOne({ restaurantId }).maxTimeMS(5000);
      
      // Then delete from PostgreSQL
      await prisma.restaurant.delete({
        where: { id: restaurantId }
      });

      return { success: true };

    } catch (error) {
      throw error;
    }
  }
  async createMenu(restaurantId, menuData = {}) {
    try {
      // Verify restaurant exists
      const restaurant = await this.prisma.restaurant.findUnique({
        where: { id: restaurantId }
      });

      if (!restaurant) {
        throw new Error('Restaurant not found');
      }

      const menu = await this.prisma.menu.create({
        data: {
          restaurantId,
          ...menuData
        },
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

      return {
        success: true,
        menu
      };
    } catch (error) {
      console.error('Error creating menu:', error);
      throw error;
    }
  }

  /**
   * Get all menus for a restaurant
   */
  async getRestaurantMenus(restaurantId, options = {}) {
    const { includeItems = true } = options;

    try {
      const menus = await this.prisma.menu.findMany({
        where: { restaurantId },
        include: {
          restaurant: {
            select: {
              id: true,
              name: true
            }
          },
          items: includeItems ? {
            include: {
              item: true
            }
          } : false,
          _count: {
            select: {
              items: true
            }
          }
        }
      });

      return {
        success: true,
        menus
      };
    } catch (error) {
      console.error('Error fetching restaurant menus:', error);
      throw error;
    }
  }

  /**
   * Get a specific menu by ID
   */
  async getMenu(menuId) {
    try {
      const menu = await this.prisma.menu.findUnique({
        where: { id: menuId },
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
              }
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

      return {
        success: true,
        menu
      };
    } catch (error) {
      console.error('Error fetching menu:', error);
      throw error;
    }
  }

  /**
   * Delete a menu
   */
  async deleteMenu(menuId) {
    try {
      // First remove all menu items
      await this.prisma.menuItem.deleteMany({
        where: { menuId }
      });

      // Then delete the menu
      await this.prisma.menu.delete({
        where: { id: menuId }
      });

      return {
        success: true,
        message: 'Menu deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting menu:', error);
      throw error;
    }
  }

  // ============ ITEM OPERATIONS ============

  /**
   * Create a new item
   */
  async createItem(itemData) {
    const { itemId, name, price, status = 'available', imageUrl = '' } = itemData;

    try {
      const item = await this.prisma.items.create({
        data: {
          itemId,
          name,
          price,
          status,
          imageUrl
        }
      });

      return {
        success: true,
        item
      };
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