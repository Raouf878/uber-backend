import mongoose from 'mongoose';

const restaurantLocationSchema = new mongoose.Schema({
  restaurantId: {
    type: Number,
    required: true,
    unique: true
  },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  address: { type: String, required: true },
  openingHours: { type: String, required: true },
  closingHours: { type: String, required: true },
  workingDays: {
    type: [String],
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  }
}, {
  timestamps: true
});

// Force collection name and check if model already exists
const RestaurantInfos = mongoose.model('RestaurantInfos', restaurantLocationSchema);

export default RestaurantInfos;