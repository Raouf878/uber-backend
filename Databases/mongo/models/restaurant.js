import mongoose from 'mongoose';

const restaurantLocationSchema = new mongoose.Schema({
  restaurantId: {
    type: Number,
    required: true,
    unique: true,
    index: true  // Add index for performance
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  openingHours: {
    type: String,
    required: true
  },
  closingHours: {
    type: String,
    required: true
  },
  workingDays: {
    type: [String],
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  }
}, {
  timestamps: true
});

// Force the collection name to match what you have in MongoDB
const RestaurantInfo = mongoose.model('RestaurantInfos', restaurantLocationSchema);
RestaurantInfo.init().then(() => {
  console.log('RestaurantInfo indexes created');
}).catch(err => {
  console.error('Index creation error:', err);
});

export default RestaurantInfo;