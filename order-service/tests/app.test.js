const request = require('supertest');
const app = require('../src/app');

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

  describe('GET /api/${service_name//-service/}', () => {
    it('should return service information', async () => {
      const response = await request(app)
        .get('/api/${service_name//-service/}')
        .expect(200);

      expect(response.body).toHaveProperty('service', 'order-service');
      expect(response.body).toHaveProperty('version');
    });
  });
});
