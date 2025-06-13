#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Define your services and their specific configurations
const services = {
  'api-gateway': {
    description: 'API Gateway for microservices architecture',
    port: 3000,
    dependencies: {
      express: '^4.18.2',
      'http-proxy-middleware': '^2.0.6',
      cors: '^2.8.5',
      helmet: '^7.0.0',
      'express-rate-limit': '^6.7.0',
      axios: '^1.4.0',
      dotenv: '^16.3.1',
      morgan: '^1.10.0'
    },
    devDependencies: {
      nodemon: '^3.0.1',
      jest: '^29.5.0',
      supertest: '^6.3.3'
    }
  },
  'payment-service': {
    description: 'Payment processing service',
    port: 3001,
    dependencies: {
      express: '^4.18.2',
      pg: '^8.11.0',
      'pg-hstore': '^2.3.4',
      sequelize: '^6.32.1',
      bcryptjs: '^2.4.3',
      jsonwebtoken: '^9.0.1',
      joi: '^17.9.2',
      stripe: '^12.9.0',
      dotenv: '^16.3.1',
      cors: '^2.8.5',
      helmet: '^7.0.0',
      morgan: '^1.10.0'
    },
    devDependencies: {
      nodemon: '^3.0.1',
      jest: '^29.5.0',
      supertest: '^6.3.3',
      'sequelize-cli': '^6.6.1'
    }
  },
  'order-service': {
    description: 'Order management service',
    port: 3002,
    dependencies: {
      express: '^4.18.2',
      pg: '^8.11.0',
      'pg-hstore': '^2.3.4',
      sequelize: '^6.32.1',
      joi: '^17.9.2',
      axios: '^1.4.0',
      dotenv: '^16.3.1',
      cors: '^2.8.5',
      helmet: '^7.0.0',
      morgan: '^1.10.0',
      uuid: '^9.0.0'
    },
    devDependencies: {
      nodemon: '^3.0.1',
      jest: '^29.5.0',
      supertest: '^6.3.3',
      'sequelize-cli': '^6.6.1'
    }
  },
  'user-service': {
    description: 'User management and authentication service',
    port: 3003,
    dependencies: {
      express: '^4.18.2',
      pg: '^8.11.0',
      'pg-hstore': '^2.3.4',
      sequelize: '^6.32.1',
      bcryptjs: '^2.4.3',
      jsonwebtoken: '^9.0.1',
      joi: '^17.9.2',
      nodemailer: '^6.9.3',
      dotenv: '^16.3.1',
      cors: '^2.8.5',
      helmet: '^7.0.0',
      morgan: '^1.10.0',
      multer: '^1.4.5-lts.1'
    },
    devDependencies: {
      nodemon: '^3.0.1',
      jest: '^29.5.0',
      supertest: '^6.3.3',
      'sequelize-cli': '^6.6.1'
    }
  },
  'restaurant-service': {
    description: 'Restaurant management service',
    port: 3004,
    dependencies: {
      express: '^4.18.2',
      mongoose: '^7.3.1',
      joi: '^17.9.2',
      dotenv: '^16.3.1',
      cors: '^2.8.5',
      helmet: '^7.0.0',
      morgan: '^1.10.0',
      multer: '^1.4.5-lts.1',
      axios: '^1.4.0'
    },
    devDependencies: {
      nodemon: '^3.0.1',
      jest: '^29.5.0',
      supertest: '^6.3.3'
    }
  },
  'delivery-service': {
    description: 'Delivery management service',
    port: 3005,
    dependencies: {
      express: '^4.18.2',
      pg: '^8.11.0',
      'pg-hstore': '^2.3.4',
      sequelize: '^6.32.1',
      joi: '^17.9.2',
      axios: '^1.4.0',
      dotenv: '^16.3.1',
      cors: '^2.8.5',
      helmet: '^7.0.0',
      morgan: '^1.10.0',
      'socket.io': '^4.7.1'
    },
    devDependencies: {
      nodemon: '^3.0.1',
      jest: '^29.5.0',
      supertest: '^6.3.3',
      'sequelize-cli': '^6.6.1'
    }
  },
  'location-service': {
    description: 'Location and mapping service',
    port: 3006,
    dependencies: {
      express: '^4.18.2',
      mongoose: '^7.3.1',
      joi: '^17.9.2',
      dotenv: '^16.3.1',
      cors: '^2.8.5',
      helmet: '^7.0.0',
      morgan: '^1.10.0',
      axios: '^1.4.0',
      geolib: '^3.3.4'
    },
    devDependencies: {
      nodemon: '^3.0.1',
      jest: '^29.5.0',
      supertest: '^6.3.3'
    }
  },
  'notification-service': {
    description: 'Notification service for emails, SMS, and push notifications',
    port: 3007,
    dependencies: {
      express: '^4.18.2',
      pg: '^8.11.0',
      'pg-hstore': '^2.3.4',
      sequelize: '^6.32.1',
      joi: '^17.9.2',
      nodemailer: '^6.9.3',
      twilio: '^4.11.1',
      'firebase-admin': '^11.9.0',
      dotenv: '^16.3.1',
      cors: '^2.8.5',
      helmet: '^7.0.0',
      morgan: '^1.10.0',
      'node-cron': '^3.0.2'
    },
    devDependencies: {
      nodemon: '^3.0.1',
      jest: '^29.5.0',
      supertest: '^6.3.3',
      'sequelize-cli': '^6.6.1'
    }
  },
  'analytics-service': {
    description: 'Analytics and reporting service',
    port: 3008,
    dependencies: {
      express: '^4.18.2',
      mongoose: '^7.3.1',
      joi: '^17.9.2',
      dotenv: '^16.3.1',
      cors: '^2.8.5',
      helmet: '^7.0.0',
      morgan: '^1.10.0',
      axios: '^1.4.0',
      'node-cron': '^3.0.2',
      moment: '^2.29.4'
    },
    devDependencies: {
      nodemon: '^3.0.1',
      jest: '^29.5.0',
      supertest: '^6.3.3'
    }
  }
};

// Function to create package.json for a service
function createPackageJson(serviceName, config) {
  const packageJson = {
    name: serviceName,
    version: '1.0.0',
    description: config.description,
    main: 'src/app.js',
    scripts: {
      start: 'node src/app.js',
      dev: 'nodemon src/app.js',
      test: 'jest',
      'test:watch': 'jest --watch',
      'test:coverage': 'jest --coverage'
    },
    keywords: [
      'microservice',
      'nodejs',
      'express',
      'api'
    ],
    author: 'Your Name',
    license: 'MIT',
    dependencies: config.dependencies,
    devDependencies: config.devDependencies,
    engines: {
      node: '>=18.0.0',
      npm: '>=8.0.0'
    },
    jest: {
      testEnvironment: 'node',
      collectCoverageFrom: [
        'src/**/*.{js,jsx}',
        '!src/**/*.test.{js,jsx}'
      ]
    }
  };

  return packageJson;
}

// Function to create directory structure and files
function createServiceStructure(serviceName, config) {
  const servicePath = path.join(process.cwd(), serviceName);
  
  // Create service directory if it doesn't exist
  if (!fs.existsSync(servicePath)) {
    fs.mkdirSync(servicePath, { recursive: true });
  }

  // Create src directory
  const srcPath = path.join(servicePath, 'src');
  if (!fs.existsSync(srcPath)) {
    fs.mkdirSync(srcPath, { recursive: true });
  }

  // Create package.json
  const packageJson = createPackageJson(serviceName, config);
  fs.writeFileSync(
    path.join(servicePath, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // Create basic app.js file
  const appJsContent = generateAppJs(serviceName, config);
  fs.writeFileSync(path.join(srcPath, 'app.js'), appJsContent);

  // Create Dockerfile
  const dockerfileContent = generateDockerfile();
  fs.writeFileSync(path.join(servicePath, 'Dockerfile'), dockerfileContent);

  // Create .env.example
  const envContent = generateEnvExample(config);
  fs.writeFileSync(path.join(servicePath, '.env.example'), envContent);

  // Create basic test file
  const testContent = generateTestFile(serviceName);
  const testPath = path.join(servicePath, 'tests');
  if (!fs.existsSync(testPath)) {
    fs.mkdirSync(testPath, { recursive: true });
  }
  fs.writeFileSync(path.join(testPath, 'app.test.js'), testContent);

  console.log(`✅ Created ${serviceName} with package.json and basic structure`);
}

// Generate basic Express app
function generateAppJs(serviceName, config) {
  const isMongoService = ['restaurant-service', 'location-service', 'analytics-service'].includes(serviceName);
  const hasSocketIO = serviceName === 'delivery-service';
  
  return `const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();
${hasSocketIO ? "const { createServer } = require('http');\nconst { Server } = require('socket.io');" : ''}

const app = express();
const PORT = process.env.PORT || ${config.port};

${hasSocketIO ? 'const server = createServer(app);\nconst io = new Server(server, {\n  cors: {\n    origin: "*",\n    methods: ["GET", "POST"]\n  }\n});' : ''}

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    service: '${serviceName}',
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.get('/api/${serviceName.replace('-service', '')}', (req, res) => {
  res.json({
    message: '${config.description} is running!',
    service: '${serviceName}',
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

${hasSocketIO ? `
// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(\`${serviceName} running on port \${PORT}\`);
});
` : `
app.listen(PORT, '0.0.0.0', () => {
  console.log(\`${serviceName} running on port \${PORT}\`);
});
`}

module.exports = app;
`;
}

// Generate Dockerfile
function generateDockerfile() {
  return `FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["npm", "start"]
`;
}

// Generate .env.example
function generateEnvExample(config) {
  return `# Environment Configuration
NODE_ENV=development
PORT=${config.port}

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
`;
}

// Generate basic test file
function generateTestFile(serviceName) {
  return `const request = require('supertest');
const app = require('../src/app');

describe('${serviceName}', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('service', '${serviceName}');
      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/${serviceName.replace('-service', '')}', () => {
    it('should return service information', async () => {
      const response = await request(app)
        .get('/api/${serviceName.replace('-service', '')}')
        .expect(200);

      expect(response.body).toHaveProperty('service', '${serviceName}');
      expect(response.body).toHaveProperty('version');
    });
  });
});
`;
}

// Main execution function
function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node generate-packages.js [options] [services...]

Options:
  --all, -a        Generate package.json for all services
  --help, -h       Show this help message

Examples:
  node generate-packages.js --all
  node generate-packages.js payment-service order-service
  node generate-packages.js api-gateway
    `);
    return;
  }

  let servicesToCreate = [];

  if (args.includes('--all') || args.includes('-a')) {
    servicesToCreate = Object.keys(services);
  } else if (args.length > 0) {
    servicesToCreate = args.filter(service => services[service]);
    
    // Check for invalid service names
    const invalidServices = args.filter(service => !services[service]);
    if (invalidServices.length > 0) {
      console.error(`❌ Invalid service names: ${invalidServices.join(', ')}`);
      console.log(`Available services: ${Object.keys(services).join(', ')}`);
      return;
    }
  } else {
    console.error('❌ Please specify services to create or use --all flag');
    console.log(`Available services: ${Object.keys(services).join(', ')}`);
    return;
  }

  console.log(`🚀 Creating package.json files for: ${servicesToCreate.join(', ')}\n`);

  servicesToCreate.forEach(serviceName => {
    createServiceStructure(serviceName, services[serviceName]);
  });

  console.log(`\n✨ Successfully created ${servicesToCreate.length} services!`);
  console.log('\nNext steps:');
  console.log('1. Navigate to each service directory');
  console.log('2. Run "npm install" to install dependencies');
  console.log('3. Copy .env.example to .env and configure your environment variables');
  console.log('4. Start developing your services!');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { services, createServiceStructure, createPackageJson };