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

// Order validation schemas
export const orderSchemas = {
  createOrder: Joi.object({
    userId: Joi.number().integer().positive().required(),
    restaurantId: Joi.number().integer().positive().required(),
    totalPrice: Joi.number().positive().required(),
    items: Joi.array().items(
      Joi.object({
        itemId: Joi.number().integer().positive().required(),
        quantity: Joi.number().integer().positive().required()
      })
    ).optional(),
    menus: Joi.array().items(
      Joi.object({
        menuId: Joi.number().integer().positive().required()
      })
    ).optional()
  }).custom((value, helpers) => {
    if ((!value.items || value.items.length === 0) && (!value.menus || value.menus.length === 0)) {
      return helpers.error('any.invalid', { message: 'At least one item or menu must be provided' });
    }
    return value;
  }),

  updateOrderStatus: Joi.object({
    status: Joi.string().valid(
      'PENDING', 
      'CONFIRMED', 
      'PREPARING', 
      'READY', 
      'OUT_FOR_DELIVERY', 
      'DELIVERED', 
      'CANCELLED'
    ).required()
  }),

  addItemToOrder: Joi.object({
    itemId: Joi.number().integer().positive().required(),
    quantity: Joi.number().integer().positive().required()
  }),

  updateItemQuantity: Joi.object({
    quantity: Joi.number().integer().positive().required()
  }),

  cancelOrder: Joi.object({
    reason: Joi.string().optional()
  })
};

// Parameter validation schemas
export const paramSchemas = {
  orderId: Joi.object({
    id: Joi.number().integer().positive().required()
  }),

  userId: Joi.object({
    userId: Joi.number().integer().positive().required()
  }),

  restaurantId: Joi.object({
    restaurantId: Joi.number().integer().positive().required()
  }),

  orderItemParams: Joi.object({
    orderId: Joi.number().integer().positive().required(),
    itemId: Joi.number().integer().positive().required()
  })
};
