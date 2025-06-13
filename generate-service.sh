#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Function to create package.json for a service
create_package_json() {
    local service_name=$1
    local port=$2
    local service_dir=$service_name
    
    echo -e "${BLUE}Creating $service_name...${NC}"
    
    # Create directory structure
    mkdir -p "$service_dir/src"
    mkdir -p "$service_dir/tests"
    
    # Create package.json
    cat > "$service_dir/package.json" << EOF
{
  "name": "$service_name",
  "version": "1.0.0",
  "description": "$service_name microservice",
  "main": "src/app.js",
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "keywords": [
    "microservice",
    "nodejs",
    "express",
    "api"
  ],
  "author": "Your Name",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "morgan": "^1.10.0",
    "dotenv": "^16.3.1",
    "joi": "^17.9.2",
    "axios": "^1.4.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.5.0",
    "supertest": "^6.3.3"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=8.0.0"
  },
  "jest": {
    "testEnvironment": "node",
    "collectCoverageFrom": [
      "src/**/*.{js,jsx}",
      "!src/**/*.test.{js,jsx}"
    ]
  }
}
EOF

    # Create basic app.js
    cat > "$service_dir/src/app.js" << EOF
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || $port;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    service: '$service_name',
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.get('/api/\${service_name//-service/}', (req, res) => {
  res.json({
    message: '$service_name is running!',
    service: '$service_name',
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(\`$service_name running on port \${PORT}\`);
});

module.exports = app;
EOF

    # Create Dockerfile
    cat > "$service_dir/Dockerfile" << EOF
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose port
EXPOSE $port

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD wget --no-verbose --tries=1 --spider http://localhost:$port/health || exit 1

# Start the application
CMD ["npm", "start"]
EOF

    # Create .env.example
    cat > "$service_dir/.env.example" << EOF
# Environment Configuration
NODE_ENV=development
PORT=$port

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database
DB_USER=your_username
DB_PASSWORD=your_password
DB_URL=postgresql://username:password@host:port/database

# MongoDB Configuration (if applicable)
MONGODB_URI=mongodb://localhost:27017/your_database

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# External API Keys
# Add your service-specific API keys here

# Logging
LOG_LEVEL=info
EOF

    # Create basic test file
    cat > "$service_dir/tests/app.test.js" << EOF
const request = require('supertest');
const app = require('../src/app');

describe('$service_name', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('service', '$service_name');
      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/\${service_name//-service/}', () => {
    it('should return service information', async () => {
      const response = await request(app)
        .get('/api/\${service_name//-service/}')
        .expect(200);

      expect(response.body).toHaveProperty('service', '$service_name');
      expect(response.body).toHaveProperty('version');
    });
  });
});
EOF

    # Create .gitignore
    cat > "$service_dir/.gitignore" << EOF
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# Stores VSCode versions used for testing VSCode extensions
.vscode-test

# IDEs
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
EOF

    echo -e "${GREEN}✅ Created $service_name successfully${NC}"
}

# Function to install dependencies for a service
install_dependencies() {
    local service_name=$1
    echo -e "${YELLOW}Installing dependencies for $service_name...${NC}"
    cd "$service_name" && npm install && cd ..
    echo -e "${GREEN}✅ Dependencies installed for $service_name${NC}"
}

# Function to show usage
show_usage() {
    echo -e "${BLUE}Usage: $0 [OPTIONS] [SERVICES...]${NC}"
    echo ""
    echo "Options:"
    echo "  --all, -a          Create all services"
    echo "  --install, -i      Install npm dependencies after creation"
    echo "  --help, -h         Show this help message"
    echo ""
    echo "Available services:"
    for service in "${!SERVICES[@]}"; do
        echo "  - $service (port: ${SERVICES[$service]})"
    done
    echo ""
    echo "Examples:"
    echo "  $0 --all                           # Create all services"
    echo "  $0 --all --install                 # Create all services and install dependencies"
    echo "  $0 payment-service order-service   # Create specific services"
    echo "  $0 api-gateway --install           # Create API gateway and install dependencies"
}

# Main execution
main() {
    local create_all=false
    local install_deps=false
    local services_to_create=()
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --all|-a)
                create_all=true
                shift
                ;;
            --install|-i)
                install_deps=true
                shift
                ;;
            --help|-h)
                show_usage
                exit 0
                ;;
            -*)
                echo -e "${RED}Unknown option: $1${NC}"
                show_usage
                exit 1
                ;;
            *)
                if [[ -n "${SERVICES[$1]}" ]]; then
                    services_to_create+=("$1")
                else
                    echo -e "${RED}Unknown service: $1${NC}"
                    echo "Available services: ${!SERVICES[*]}"
                    exit 1
                fi
                shift
                ;;
        esac
    done
    
    # Determine which services to create
    if [[ "$create_all" == true ]]; then
        services_to_create=(${!SERVICES[@]})
    elif [[ ${#services_to_create[@]} -eq 0 ]]; then
        echo -e "${RED}Error: No services specified${NC}"
        show_usage
        exit 1
    fi
    
    echo -e "${BLUE}🚀 Creating microservices: ${services_to_create[*]}${NC}"
    echo ""
    
    # Create services
    for service in "${services_to_create[@]}"; do
        create_package_json "$service" "${SERVICES[$service]}"
    done
    
    echo ""
    echo -e "${GREEN}✨ Successfully created ${#services_to_create[@]} services!${NC}"
    
    # Install dependencies if requested
    if [[ "$install_deps" == true ]]; then
        echo ""
        echo -e "${YELLOW}Installing dependencies...${NC}"
        for service in "${services_to_create[@]}"; do
            install_dependencies "$service"
        done
    fi
    
    # Show next steps
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    if [[ "$install_deps" == false ]]; then
        echo "1. Navigate to each service directory and run 'npm install'"
    else
        echo "1. Dependencies are already installed!"
    fi
    echo "2. Copy .env.example to .env in each service and configure environment variables"
    echo "3. Start the services using 'npm start' or 'npm run dev'"
    echo "4. Run tests with 'npm test'"
}

main "$@"