import RestaurantService from '../../data-layer/DataAccess.js';
import multer from 'multer';
import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WEBP images are allowed.'));
    }
  }
});

// Initialize the restaurant service
const s3 = new AWS.S3();
const restaurantService = new RestaurantService();

// Create a new restaurant
export const createRestaurant = async (req, res) => {
  try {
    const imageFile = req.file; // comes from multer
    let imageUrl = null;

    // Upload image to S3
    if (imageFile) {
      const extension = imageFile.originalname.split('.').pop();
      const fileName = `restaurants/${uuidv4()}/${uuidv4()}.${extension}`;
      const uploadParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: fileName,
        Body: imageFile.buffer,
        ContentType: imageFile.mimetype
      };

      const uploadResult = await s3.upload(uploadParams).promise();
      imageUrl = uploadResult.Location;
    }
    const result = await restaurantService.createRestaurant({
      ...req.body,
      imageUrl
    });
    res.status(201).json(result);
  } catch (error) {
    console.error('Create restaurant error:', error);
    res.status(400).json({
      error: error.message || 'Failed to create restaurant'
    });
  }
};

// Get restaurant by ID
export const getRestaurant = async (req, res) => {
  try {
    console.log('Fetching restaurant with ID:', req.params.id);
    console.log('Request params:', parseInt(req.params.id));
    
    const restaurant = await restaurantService.getRestaurant(
      parseInt(req.params.id)
    );
    
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    
    res.json(restaurant);
  } catch (error) {
    console.error('Get restaurant error:', error);
    res.status(500).json({
      error: error.message || 'Failed to get restaurant'
    });
  }
};

// Get all restaurants for a specific user
export const getUserRestaurants = async (req, res) => {
  try {
    const restaurants = await restaurantService.getUserRestaurants(
      parseInt(req.params.userId)
    );
    res.json(restaurants);
  } catch (error) {
    console.error('Get user restaurants error:', error);
    res.status(500).json({
      error: error.message || 'Failed to get user restaurants'
    });
  }
};

// Get all restaurants with pagination
export const getAllRestaurants = async (req, res) => {
  try {
    const { page, limit, userId } = req.query;
    const options = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      userId: userId ? parseInt(userId) : undefined
    };
    
    const result = await restaurantService.getAllRestaurants(options);
    res.json(result);
  } catch (error) {
    console.error('Get all restaurants error:', error);
    res.status(500).json({
      error: error.message || 'Failed to get restaurants'
    });
  }
};

// Update restaurant location
export const updateRestaurantLocation = async (req, res) => {
  try {
    const location = await restaurantService.updateRestaurantLocation(
      parseInt(req.params.id),
      req.body
    );
    
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }
    
    res.json(location);
  } catch (error) {
    console.error('Update location error:', error);
    res.status(400).json({
      error: error.message || 'Failed to update location'
    });
  }
};

// Delete restaurant
export const deleteRestaurant = async (req, res) => {
  try {
    await restaurantService.deleteRestaurant(
      parseInt(req.params.id)
    );
    res.json({ message: 'Restaurant deleted successfully' });
  } catch (error) {
    console.error('Delete restaurant error:', error);
    res.status(500).json({
      error: error.message || 'Failed to delete restaurant'
    });
  }
};

// Create menu
export const createMenu = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { name, description, price, imageUrl } = req.body;

    // Debug logging
    console.log('=== CREATE MENU DEBUG ===');
    console.log('Request body:', req.body);
    console.log('Extracted imageUrl:', imageUrl);
    console.log('Request file:', req.file);
    console.log('S3 Config:', {
      bucket: process.env.S3_BUCKET_NAME,
      region: process.env.AWS_REGION,
      hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY
    });

    let finalImageUrl = imageUrl || null;

    // If imageUrl is a local file path, read the file and upload to S3
    if (imageUrl && !imageUrl.startsWith('http') && (imageUrl.includes('/') || imageUrl.includes('\\'))) {
      console.log('🔍 Local file path detected, reading file and uploading to S3...');
      console.log('Local file path:', imageUrl);
      console.log('📍 ENTERING LOCAL FILE PATH BRANCH');

      try {
        // Check if file exists
        if (!fs.existsSync(imageUrl)) {
          console.error('❌ File not found:', imageUrl);
          finalImageUrl = null;
        } else {
          // Read the file
          const fileBuffer = fs.readFileSync(imageUrl);
          const fileExtension = path.extname(imageUrl).toLowerCase();
          const fileName = `menus/${uuidv4()}/${uuidv4()}${fileExtension}`;
          
          // Determine content type based on extension
          const contentTypeMap = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.webp': 'image/webp',
            '.gif': 'image/gif'
          };
          const contentType = contentTypeMap[fileExtension] || 'image/jpeg';

          console.log('📁 File read successfully:');
          console.log(`   - File size: ${(fileBuffer.length / 1024).toFixed(2)} KB`);
          console.log(`   - Extension: ${fileExtension}`);
          console.log(`   - Content type: ${contentType}`);

          console.log('S3 upload parameters:', {
            bucket: process.env.S3_BUCKET_NAME,
            key: fileName,
            contentType: contentType
          });

          // Note: ACL removed because many S3 buckets disable ACLs by default
          // If you need public access, configure bucket policy instead
          const uploadParams = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: fileName,
            Body: fileBuffer,
            ContentType: contentType
          };

          console.log('Starting S3 upload from local file...');
          const uploadResult = await s3.upload(uploadParams).promise();
          
          console.log('✅ S3 upload from local file successful!');
          console.log('S3 upload result:', {
            location: uploadResult.Location,
            bucket: uploadResult.Bucket,
            key: uploadResult.Key,
            etag: uploadResult.ETag
          });

          finalImageUrl = uploadResult.Location;
          
          console.log('📸 Local file processing complete:');
          console.log(`   - Original path: ${imageUrl}`);
          console.log(`   - File size: ${(fileBuffer.length / 1024).toFixed(2)} KB`);
          console.log(`   - S3 location: ${uploadResult.Location}`);
          console.log(`   - S3 bucket: ${uploadResult.Bucket}`);
          console.log(`   - S3 key: ${uploadResult.Key}`);
          console.log(`   - Content type: ${contentType}`);
          console.log(`   - ETag: ${uploadResult.ETag}`);
          console.log('🔗 Final image URL set to:', finalImageUrl);
        }
      } catch (localFileError) {
        console.error('❌ Failed to process local file:', localFileError);
        console.error('Local file error details:', {
          message: localFileError.message,
          code: localFileError.code,
          path: imageUrl
        });
        finalImageUrl = null;
      }
    }
    // If image was uploaded via multipart form, upload to S3
    else if (req.file) {
      console.log('File upload detected, uploading to S3...');
      console.log('File info:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });

      try {
        const extension = req.file.originalname.split('.').pop();
        const fileName = `menus/${uuidv4()}/${uuidv4()}.${extension}`;
        
        console.log('S3 upload parameters:', {
          bucket: process.env.S3_BUCKET_NAME,
          key: fileName,
          contentType: req.file.mimetype
        });

        const uploadParams = {
          Bucket: process.env.S3_BUCKET_NAME,
          Key: fileName,
          Body: req.file.buffer,
          ContentType: req.file.mimetype
        };

        console.log('Starting S3 upload...');
        const uploadResult = await s3.upload(uploadParams).promise();
        
        console.log('✅ S3 upload successful!');
        console.log('S3 upload result:', {
          location: uploadResult.Location,
          bucket: uploadResult.Bucket,
          key: uploadResult.Key,
          etag: uploadResult.ETag
        });

        finalImageUrl = uploadResult.Location;
        
        console.log('📸 Image processing complete:');
        console.log(`   - Original file: ${req.file.originalname}`);
        console.log(`   - File size: ${(req.file.size / 1024).toFixed(2)} KB`);
        console.log(`   - S3 location: ${uploadResult.Location}`);
        console.log(`   - S3 bucket: ${uploadResult.Bucket}`);
        console.log(`   - S3 key: ${uploadResult.Key}`);
        console.log(`   - Content type: ${req.file.mimetype}`);
        console.log(`   - ETag: ${uploadResult.ETag}`);
        console.log('🔗 Final image URL set to:', finalImageUrl);
      } catch (s3Error) {
        console.error('S3 upload failed:', s3Error);
        console.error('S3 error details:', {
          code: s3Error.code,
          message: s3Error.message,
          statusCode: s3Error.statusCode
        });
        // Continue with menu creation even if S3 upload fails
        finalImageUrl = null;
      }
    }

    const menuData = {
      name,
      description,
      price: parseFloat(price),
      imageUrl: finalImageUrl
    };

    console.log('Final menuData before database save:', menuData);

    const result = await restaurantService.createMenu(parseInt(restaurantId), menuData);
    
    console.log('💾 Menu creation result:', result);
    
    if (result.success) {
      console.log('🎉 MENU CREATED SUCCESSFULLY!');
      console.log(`   - Menu ID: ${result.menu.id}`);
      console.log(`   - Menu Name: ${result.menu.name}`);
      console.log(`   - Restaurant ID: ${result.menu.restaurantId}`);
      console.log(`   - Price: $${result.menu.price}`);
      console.log(`   - Image URL: ${result.menu.imageUrl || 'No image'}`);
      
      if (result.menu.imageUrl && result.menu.imageUrl.includes('amazonaws.com')) {
        console.log('📷 Image successfully uploaded to S3 and saved in database!');
      } else if (result.menu.imageUrl) {
        console.log('🔗 Image URL provided and saved in database!');
      } else {
        console.log('ℹ️  Menu created without image');
      }
    }
    
    console.log('=== END CREATE MENU DEBUG ===');
      
    res.status(201).json(result);
  } catch (error) {
    console.error('Error in createMenu controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create menu',
      error: error.message
    });
  }
}

  /**
   * Get all menus for a restaurant
   * GET /api/restaurants/:restaurantId/menus
   */
  export const getRestaurantMenus = async (req, res) => {
    try {
      const { restaurantId } = req.params;
      const { includeItems } = req.query;

      const result = await restaurantService.getRestaurantMenus(
        parseInt(restaurantId), 
        { includeItems: includeItems === 'true' }
      );
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Error in getRestaurantMenus controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch restaurant menus',
        error: error.message
      });
    }
  }

  /**
   * Get a specific menu by ID
   * GET /api/menus/:menuId
   */
  export const getMenu = async (req, res) => {
    try {
      const { menuId } = req.params;

      const result = await restaurantService.getMenu(parseInt(menuId));

      if (!result.success) {
        return res.status(404).json(result);
      }
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Error in getMenu controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch menu',
        error: error.message
      });
    }
  }

  /**
   * Update a menu by ID
   * PUT /api/menus/:menuId
   */
  export const updateMenu = async (req, res) => {
    try {
      const { menuId } = req.params;
      const menuData = req.body;
      const result = await restaurantService.updateMenu(parseInt(menuId), menuData);
      res.status(200).json(result);
    } catch (error) {
      console.error('Error in updateMenu controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update menu',
        error: error.message
      });
    }
  }

  /**
   * Delete a menu
   * DELETE /api/menus/:menuId
   */
  export const deleteMenu = async (req, res) => {
    try {
      const { menuId } = req.params;

      const result = await restaurantService.deleteMenu(parseInt(menuId));

      res.status(200).json(result);
    } catch (error) {
      console.error('Error in deleteMenu controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete menu',
        error: error.message
      });
    }
  }

  /**
   * Get menu statistics
   * GET /api/menus/:menuId/stats
   */
  export const getMenuStats = async (req, res) => {
    try {
      const { menuId } = req.params;

      const result = await restaurantService.getMenuStats(parseInt(menuId));

      if (!result.success) {
        return res.status(404).json(result);
      }
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Error in getMenuStats controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch menu statistics',
        error: error.message
      });
    }
  }
  // ============ ITEM CONTROLLERS ============
  /**
   * Create a new item
   * POST /api/restaurants/:restaurantId/items
   */
  export const createItem = async (req, res) => {
    try {
      const { restaurantId } = req.params;
      const data = req.body;

      // Validation
      if (!data.name || data.price === undefined) {
        return res.status(400).json({
          success: false,
          message: 'name and price are required'
        });
      }

      if (!restaurantId) {
        return res.status(400).json({
          success: false,
          message: 'Restaurant ID is required'
        });
      }

      // Add restaurantId to the data
      const itemData = {
        ...data,
        restaurantId: parseInt(restaurantId)
      };

      const result = await restaurantService.createItem(
        parseInt(restaurantId), 
        itemData
      );
      
      res.status(201).json(result);
    } catch (error) {
      console.error('Error in createItem controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create item',
        error: error.message
      });
    }
  }
  /**
   * Get all items with pagination and filtering
   * GET /api/items
   */
  export const getAllItems = async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        search,
        priceMin,
        priceMax
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        search,
        priceMin: priceMin ? parseFloat(priceMin) : null,
        priceMax: priceMax ? parseFloat(priceMax) : null
      };

      const result = await restaurantService.getAllItems(options);
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Error in getAllItems controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch items',
        error: error.message
      });
    }
  }

  /**
   * Get a specific item by ID
   * GET /api/items/:itemId
   */
  export const getItem = async (req, res) => {
    try {
      const { itemId } = req.params;

      const result = await restaurantService.getItem(parseInt(itemId));

      if (!result.success) {
        return res.status(404).json(result);
      }
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Error in getItem controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch item',
        error: error.message
      });
    }
  }

  /**
   * Update an item
   * PUT /api/items/:itemId
   */
  export const updateItem = async (req, res) => {
    try {
      const { itemId } = req.params;
      const updateData = req.body;

      const result = await restaurantService.updateItem(parseInt(itemId), updateData);

      res.status(200).json(result);
    } catch (error) {
      console.error('Error in updateItem controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update item',
        error: error.message
      });
    }
  }

  /**
   * Delete an item
   * DELETE /api/items/:itemId
   */
  export const deleteItem = async (req, res) => {
    try {
      const { itemId } = req.params;

      const result = await restaurantService.deleteItem(parseInt(itemId));

      res.status(200).json(result);
    } catch (error) {
      console.error('Error in deleteItem controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete item',
        error: error.message
      });
    }
  }

  // ============ MENU ITEM CONTROLLERS ============

  /**
   * Add an item to a menu
   * POST /api/menus/:menuId/items/:itemId
   */
  export const addItemToMenu = async (req, res) => {
    try {
      const { menuId, itemId } = req.params;

      const result = await restaurantService.addItemToMenu(
        parseInt(menuId), 
        parseInt(itemId)
      );
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      
      res.status(201).json(result);
    } catch (error) {
      console.error('Error in addItemToMenu controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add item to menu',
        error: error.message
      });
    }
  }

  /**
   * Remove an item from a menu
   * DELETE /api/menus/:menuId/items/:itemId
   */
  export const removeItemFromMenu = async (req, res) => {
    try {
      const { menuId, itemId } = req.params;

      const result = await restaurantService.removeItemFromMenu(
        parseInt(menuId), 
        parseInt(itemId)
      );
      
      if (!result.success) {
        return res.status(404).json(result);
      }
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Error in removeItemFromMenu controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove item from menu',
        error: error.message
      });
    }
  }

  /**
   * Get all items in a specific menu
   * GET /api/menus/:menuId/items
   */
  export const getMenuItems = async (req, res) => {
    try {
      const { menuId } = req.params;
      const { status, search } = req.query;

      const result = await restaurantService.getMenuItems(
        parseInt(menuId), 
        { status, search }
      );
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Error in getMenuItems controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch menu items',
        error: error.message
      });
    }
  }

  /**
   * Bulk add items to a menu
   * POST /api/menus/:menuId/items/bulk
   * Body: { itemIds: [1, 2, 3, ...] }
   */
  export const bulkAddItemsToMenu = async (req, res) => {
    try {
      const { menuId } = req.params;
      const { itemIds } = req.body;

      if (!Array.isArray(itemIds) || itemIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'itemIds must be a non-empty array'
        });
      }

      const result = await restaurantService.bulkAddItemsToMenu(
        parseInt(menuId), 
        itemIds.map(id => parseInt(id))
      );
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      
      res.status(201).json(result);
    } catch (error) {
      console.error('Error in bulkAddItemsToMenu controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to bulk add items to menu',
        error: error.message
      });
    }
  }

  /**
   * Bulk remove items from a menu
   * DELETE /api/menus/:menuId/items/bulk
   * Body: { itemIds: [1, 2, 3, ...] }
   */
  export const bulkRemoveItemsFromMenu = async (req, res) => {
    try {
      const { menuId } = req.params;
      const { itemIds } = req.body;

      if (!Array.isArray(itemIds) || itemIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'itemIds must be a non-empty array'
        });
      }

      const result = await restaurantService.bulkRemoveItemsFromMenu(
        parseInt(menuId), 
        itemIds.map(id => parseInt(id))
      );
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Error in bulkRemoveItemsFromMenu controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to bulk remove items from menu',
        error: error.message
      });
    }
  }
