import express from 'express';
import { GetLocations } from '../controllers/Locations/GetLocationsController.js';
import { CreateLocation } from '../controllers/Locations/CreateLocationController.js';
import { GeocodeAddress } from '../controllers/Geocoding/GeocodeAddressController.js';
import { GetNearbyPlaces } from '../controllers/Mapping/GetNearbyPlacesController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Routes
router.route('/')
  .get(authenticateToken, GetLocations)
  .post(authenticateToken, CreateLocation);

router.route('/geocode')
  .post(GeocodeAddress);

router.route('/nearby')
  .get(GetNearbyPlaces);

export default router;
