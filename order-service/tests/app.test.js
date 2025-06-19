import request from 'supertest';
import app from '../app.js';

describe('order-service', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('service', 'order-service');
      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /crameats/test-db', () => {
    it('should test database connection', async () => {
      const response = await request(app)
        .get('/crameats/test-db')
        .expect(200);

      expect(response.body).toHaveProperty('service', 'order-service');
      expect(response.body).toHaveProperty('dbWorking');
    });
  });

  describe('Order endpoints', () => {
    it('should get all orders with pagination', async () => {
      const response = await request(app)
        .get('/crameats/orders')
        .expect(200);

      expect(response.body).toHaveProperty('orders');
      expect(response.body).toHaveProperty('pagination');
    });
  });
});
