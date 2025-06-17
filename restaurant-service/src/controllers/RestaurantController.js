
import RestaurantService from '../../data-layer/DataAccess.js'

export class RestaurantController {
  constructor() {
    this.restaurantService = new RestaurantService();
  }

  async createRestaurant(req, res) {
    try {
      const result = await this.restaurantService.createRestaurant(req.body);
      res.status(201).json(result);
    } catch (error) {
      console.error('Create restaurant error:', error);
      res.status(400).json({ 
        error: error.message || 'Failed to create restaurant' 
      });
    }
  }

  async getRestaurant(req, res) {
    try {
      console.log('Fetching restaurant with ID:', req.params.id);
      
      const restaurant = await this.restaurantService.getRestaurant(
        parseInt(req.params.id)
      );
      
      if (!restaurant) {
        return res.status(404).json({ error: 'Restaurant not found but ali is no9ch kbiiiiir' });
      }
      
      res.json(restaurant);
    } catch (error) {
      console.error('Get restaurant error:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to get restaurant' 
      });
    }
  }

  async getUserRestaurants(req, res) {
    try {
      const restaurants = await this.restaurantService.getUserRestaurants(
        parseInt(req.params.userId)
      );
      res.json(restaurants);
    } catch (error) {
      console.error('Get user restaurants error:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to get user restaurants' 
      });
    }
  }

  async updateRestaurantLocation(req, res) {
    try {
      const location = await this.restaurantService.updateRestaurantLocation(
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
  }

  async deleteRestaurant(req, res) {
    try {
      await this.restaurantService.deleteRestaurant(
        parseInt(req.params.id)
      );
      res.json({ message: 'Restaurant deleted successfully' });
    } catch (error) {
      console.error('Delete restaurant error:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to delete restaurant' 
      });
    }
  }
}
