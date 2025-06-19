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

// Delivery validation schemas
export const deliverySchemas = {
  createDelivery: Joi.object({
    orderId: Joi.number().integer().positive().required(),
    userId: Joi.number().integer().positive().required(),
    status: Joi.string().valid('PENDING', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED').default('PENDING'),
    pickupTime: Joi.date().iso().optional(),
    deliveryTime: Joi.date().iso().optional()
  }),

  updateDeliveryStatus: Joi.object({
    status: Joi.string().valid('PENDING', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED').required()
  }),

  acceptOrder: Joi.object({
    orderId: Joi.number().integer().positive().required()
  })
};

// Parameter validation schemas
export const paramSchemas = {
  deliveryId: Joi.object({
    id: Joi.number().integer().positive().required()
  }),

  userId: Joi.object({
    userId: Joi.number().integer().positive().required()
  }),

  orderId: Joi.object({
    orderId: Joi.number().integer().positive().required()
  })
};
