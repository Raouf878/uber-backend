#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Service definitions
declare -A SERVICES=(
    ["api-gateway"]="3000"
    ["auth-service"]="3001"
    ["payment-service"]="3002"
    ["order-service"]="3003"
    ["user-service"]="3004"
    ["restaurant-service"]="3005"
    ["delivery-service"]="3006"
    ["location-service"]="3007"
    ["notification-service"]="3008"
    ["analytics-service"]="3009"
)

# Function to display usage
usage() {
    echo -e "${CYAN}Usage: $0 [OPTIONS]${NC}"
    echo -e "${CYAN}Options:${NC}"
    echo -e "  -s, --service <name>    Create structure for specific service"
    echo -e "  -a, --all              Create structure for all services"
    echo -e "  -l, --list             List available services"
    echo -e "  -h, --help             Display this help message"
    echo ""
    echo -e "${CYAN}Available services:${NC}"
    for service in "${!SERVICES[@]}"; do
        echo -e "  - ${service} (port: ${SERVICES[$service]})"
    done
}

# Function to create src folder structure for a service
create_src_structure() {
    local service_name=$1
    local service_dir=$service_name
    
    if [[ ! -d "$service_dir" ]]; then
        echo -e "${RED}❌ Service directory '$service_dir' does not exist${NC}"
        return 1
    fi
    
    echo -e "${BLUE}🏗️  Building src structure for $service_name...${NC}"
    
    # Create main src directories
    mkdir -p "$service_dir/src/config"
    mkdir -p "$service_dir/src/controllers"
    mkdir -p "$service_dir/src/middleware"
    mkdir -p "$service_dir/src/routes"
    mkdir -p "$service_dir/src/utils"
    
    # Create placeholder files for empty directories
    create_placeholder_files "$service_dir" "$service_name"
    
    # Create middleware files
    create_middleware_files "$service_dir" "$service_name"
    
    # Create route files based on service
    create_route_files "$service_dir" "$service_name"
    
    # Create controller files based on service
    create_controller_files "$service_dir" "$service_name"
    
    echo -e "${GREEN}✅ Created src structure for $service_name successfully${NC}"
}

# Function to create placeholder files for directories
create_placeholder_files() {
    local service_dir=$1
    local service_name=$2
    
    # Create empty files to maintain directory structure
    touch "$service_dir/src/config/.gitkeep"
    touch "$service_dir/src/utils/.gitkeep"
}

# Function to create middleware files
create_middleware_files() {
    local service_dir=$1
    local service_name=$2
    
    # Auth middleware
    cat > "$service_dir/src/middleware/auth.js" << 'EOF'
import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    req.user = user;
    next();
  });
};

export const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};
EOF

    # Validation middleware
    cat > "$service_dir/src/middleware/validation.js" << 'EOF'
import Joi from 'joi';

export const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    next();
  };
};

export const validateParams = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.params);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Parameter validation error',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    next();
  };
};
EOF

    # Rate limiting middleware
    cat > "$service_dir/src/middleware/rateLimiter.js" << 'EOF'
const requests = new Map();

export const rateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // max requests per window
    message = 'Too many requests, please try again later.'
  } = options;

  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!requests.has(key)) {
      requests.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    const requestData = requests.get(key);
    
    if (now > requestData.resetTime) {
      requests.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (requestData.count >= max) {
      return res.status(429).json({
        success: false,
        message: message
      });
    }
    
    requestData.count++;
    requests.set(key, requestData);
    next();
  };
};
EOF

    # Error handler middleware
    cat > "$service_dir/src/middleware/errorHandler.js" << 'EOF'
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let error = {
    success: false,
    message: err.message || 'Internal server error',
    statusCode: err.statusCode || 500
  };

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = {
      success: false,
      message: message,
      statusCode: 400
    };
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = {
      success: false,
      message: message,
      statusCode: 400
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      success: false,
      message: 'Invalid token',
      statusCode: 401
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      success: false,
      message: 'Token expired',
      statusCode: 401
    };
  }

  res.status(error.statusCode).json({
    success: error.success,
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
};
EOF
}

# Function to create route files based on service
create_route_files() {
    local service_dir=$1
    local service_name=$2
    
    case $service_name in
        "auth-service")
            cat > "$service_dir/src/routes/authentication.js" << 'EOF'
import express from 'express';
import { RegisterClient } from '../controllers/Authentication/Client/ClientRegisterController.js';
import { RegisterRestaurantOwner } from '../controllers/Authentication/RestaurantOwner/RestaurantRegisterController.js';
import { RegisterDeliveryDriver } from '../controllers/Authentication/DeliveryDriver/DeliveryRegistryController.js';
import { validateRequest } from '../middleware/validation.js';

const router = express.Router();

// Routes
router.route('/create-account').post(RegisterClient);
router.route('/create-restaurant-account').post(RegisterRestaurantOwner);
router.route('/create-delivery-account').post(RegisterDeliveryDriver);

export default router;
EOF
            ;;
        "payment-service")
            cat > "$service_dir/src/routes/payments.js" << 'EOF'
import express from 'express';
import { CreatePayment } from '../controllers/Payments/CreatePaymentController.js';
import { ProcessPayment } from '../controllers/Payments/ProcessPaymentController.js';
import { GetPaymentStatus } from '../controllers/Payments/GetPaymentStatusController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Routes
router.route('/create')
  .post(authenticateToken, CreatePayment);

router.route('/process/:paymentId')
  .post(authenticateToken, ProcessPayment);

router.route('/status/:paymentId')
  .get(authenticateToken, GetPaymentStatus);

export default router;
EOF
            ;;
        "order-service")
            cat > "$service_dir/src/routes/orders.js" << 'EOF'
import express from 'express';
import { CreateOrder } from '../controllers/Orders/CreateOrderController.js';
import { GetOrders } from '../controllers/Orders/GetOrdersController.js';
import { UpdateOrderStatus } from '../controllers/Orders/UpdateOrderStatusController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Routes
router.route('/')
  .post(authenticateToken, CreateOrder)
  .get(authenticateToken, GetOrders);

router.route('/:orderId/status')
  .patch(authenticateToken, UpdateOrderStatus);

export default router;
EOF
            ;;
        "user-service")
            cat > "$service_dir/src/routes/users.js" << 'EOF'
import express from 'express';
import { GetUsers } from '../controllers/Users/GetUsersController.js';
import { CreateUser } from '../controllers/Users/CreateUserController.js';
import { UpdateUser } from '../controllers/Users/UpdateUserController.js';
import { DeleteUser } from '../controllers/Users/DeleteUserController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Routes
router.route('/')
  .get(authenticateToken, GetUsers)
  .post(authenticateToken, CreateUser);

router.route('/:id')
  .put(authenticateToken, UpdateUser)
  .delete(authenticateToken, DeleteUser);

export default router;
EOF
            ;;
        "restaurant-service")
            cat > "$service_dir/src/routes/restaurants.js" << 'EOF'
import express from 'express';
import { GetRestaurants } from '../controllers/Restaurants/GetRestaurantsController.js';
import { CreateRestaurant } from '../controllers/Restaurants/CreateRestaurantController.js';
import { UpdateRestaurant } from '../controllers/Restaurants/UpdateRestaurantController.js';
import { DeleteRestaurant } from '../controllers/Restaurants/DeleteRestaurantController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Routes
router.route('/')
  .get(GetRestaurants)
  .post(authenticateToken, CreateRestaurant);

router.route('/:id')
  .put(authenticateToken, UpdateRestaurant)
  .delete(authenticateToken, DeleteRestaurant);

export default router;
EOF
            ;;
        "delivery-service")
            cat > "$service_dir/src/routes/delivery.js" << 'EOF'
import express from 'express';
import { GetDeliveries } from '../controllers/Delivery/GetDeliveriesController.js';
import { CreateDelivery } from '../controllers/Delivery/CreateDeliveryController.js';
import { UpdateDeliveryStatus } from '../controllers/Delivery/UpdateDeliveryStatusController.js';
import { TrackDelivery } from '../controllers/Tracking/TrackDeliveryController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Routes
router.route('/')
  .get(authenticateToken, GetDeliveries)
  .post(authenticateToken, CreateDelivery);

router.route('/:id/status')
  .patch(authenticateToken, UpdateDeliveryStatus);

router.route('/:id/track')
  .get(TrackDelivery);

export default router;
EOF
            ;;
        "location-service")
            cat > "$service_dir/src/routes/locations.js" << 'EOF'
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
EOF
            ;;
        "notification-service")
            cat > "$service_dir/src/routes/notifications.js" << 'EOF'
import express from 'express';
import { GetNotifications } from '../controllers/Notifications/GetNotificationsController.js';
import { CreateNotification } from '../controllers/Notifications/CreateNotificationController.js';
import { SendEmail } from '../controllers/Email/SendEmailController.js';
import { SendSMS } from '../controllers/SMS/SendSMSController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Routes
router.route('/')
  .get(authenticateToken, GetNotifications)
  .post(authenticateToken, CreateNotification);

router.route('/email')
  .post(authenticateToken, SendEmail);

router.route('/sms')
  .post(authenticateToken, SendSMS);

export default router;
EOF
            ;;
        "analytics-service")
            cat > "$service_dir/src/routes/analytics.js" << 'EOF'
import express from 'express';
import { GetAnalytics } from '../controllers/Analytics/GetAnalyticsController.js';
import { GenerateReport } from '../controllers/Reports/GenerateReportController.js';
import { GetMetrics } from '../controllers/Metrics/GetMetricsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Routes
router.route('/')
  .get(authenticateToken, GetAnalytics);

router.route('/reports')
  .post(authenticateToken, GenerateReport);

router.route('/metrics')
  .get(authenticateToken, GetMetrics);

export default router;
EOF
            ;;
        "api-gateway")
            cat > "$service_dir/src/routes/gateway.js" << 'EOF'
import express from 'express';
import { ProxyRequest } from '../controllers/Gateway/ProxyController.js';
import { HealthCheck } from '../controllers/Health/HealthCheckController.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Routes
router.route('/health')
  .get(HealthCheck);

router.route('/proxy/*')
  .all(rateLimiter(), ProxyRequest);

export default router;
EOF
            ;;
        *)
            # Default route structure
            cat > "$service_dir/src/routes/index.js" << 'EOF'
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Default health check route
router.route('/health')
  .get((req, res) => {
    res.json({
      success: true,
      message: 'Service is running',
      timestamp: new Date().toISOString()
    });
  });

export default router;
EOF
            ;;
    esac
}

# Function to create controller files based on service
create_controller_files() {
    local service_dir=$1
    local service_name=$2
    
    case $service_name in
        "auth-service")
            mkdir -p "$service_dir/src/controllers/Authentication/Client"
            mkdir -p "$service_dir/src/controllers/Authentication/RestaurantOwner"
            mkdir -p "$service_dir/src/controllers/Authentication/DeliveryDriver"
            
            cat > "$service_dir/src/controllers/Authentication/Client/ClientRegisterController.js" << 'EOF'
export const RegisterClient = async (req, res) => {
  try {
    // Client registration logic
    res.status(201).json({
      success: true,
      message: 'Client registered successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
EOF
            ;;
        "payment-service")
            mkdir -p "$service_dir/src/controllers/Payments"
            
            cat > "$service_dir/src/controllers/Payments/CreatePaymentController.js" << 'EOF'
export const CreatePayment = async (req, res) => {
  try {
    // Payment creation logic
    res.status(201).json({
      success: true,
      message: 'Payment created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
EOF
            ;;
        *)
            mkdir -p "$service_dir/src/controllers"
            touch "$service_dir/src/controllers/.gitkeep"
            ;;
    esac
}

# Function to list available services
list_services() {
    echo -e "${CYAN}Available services:${NC}"
    for service in "${!SERVICES[@]}"; do
        echo -e "  - ${GREEN}${service}${NC} (port: ${SERVICES[$service]})"
    done
}

# Function to create all services
create_all_services() {
    echo -e "${PURPLE}🚀 Creating structure for all services...${NC}"
    
    for service in "${!SERVICES[@]}"; do
        if [[ -d "$service" ]]; then
            create_src_structure "$service"
            echo ""
        else
            echo -e "${YELLOW}⚠️  Directory '$service' does not exist, skipping...${NC}"
        fi
    done
    
    echo -e "${GREEN}🎉 All service structures created successfully!${NC}"
}

# Main function
main() {
    # Check if no arguments provided
    if [[ $# -eq 0 ]]; then
        usage
        exit 1
    fi
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -s|--service)
                if [[ -z "$2" ]]; then
                    echo -e "${RED}❌ Error: Service name required${NC}"
                    exit 1
                fi
                
                service_name="$2"
                
                # Check if service exists in our list
                if [[ ! -v SERVICES["$service_name"] ]]; then
                    echo -e "${RED}❌ Error: Unknown service '$service_name'${NC}"
                    echo -e "${CYAN}Available services:${NC}"
                    list_services
                    exit 1
                fi
                
                create_src_structure "$service_name"
                shift 2
                ;;
            -a|--all)
                create_all_services
                shift
                ;;
            -l|--list)
                list_services
                shift
                ;;
            -h|--help)
                usage
                exit 0
                ;;
            *)
                echo -e "${RED}❌ Error: Unknown option '$1'${NC}"
                usage
                exit 1
                ;;
        esac
    done
}

# Execute main function with all arguments
main "$@"