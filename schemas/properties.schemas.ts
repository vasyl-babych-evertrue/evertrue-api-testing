import Joi from 'joi';

// Common primitives
export const propertyPermissionSchema = Joi.object({
  writable: Joi.boolean().optional(),
  subject_role_id: Joi.number().optional(),
  actor_role_id: Joi.number().optional(),
}).unknown(true);

export const propertySchema = Joi.object({
  id: Joi.number().optional(),
  name: Joi.string().required(),
  description: Joi.string().allow('', null).optional(),
  data_type: Joi.string().required(),
  default: Joi.boolean().required(),
  permissions: Joi.array().items(propertyPermissionSchema).optional(),
  app_keys: Joi.array().items(Joi.string()).optional(),
  updated_at: Joi.number().optional(),
  created_at: Joi.number().optional(),
}).unknown(true);

// Responses
export const createPropertyResponseSchema = propertySchema.keys({ id: Joi.number().required() });
export const createNestedPropertyResponseSchema = propertySchema.keys({ id: Joi.number().required() });
export const updatePropertyResponseSchema = propertySchema.keys({ id: Joi.number().required(), updated_at: Joi.number().required() });

export const getPropertiesResponseSchema = Joi.alternatives().try(
  Joi.array().items(propertySchema),
  Joi.object({ items: Joi.array().items(propertySchema).required() }).unknown(true)
);

export const dynamicListCreateResponseSchema = Joi.object({
  id: Joi.number().required(),
  name: Joi.string().required(),
  type: Joi.string().required(),
}).unknown(true);

export const deleteResponseSchema = Joi.alternatives().try(
  Joi.string().allow(''),
  Joi.object().unknown(true)
);

export default {
  propertyPermissionSchema,
  propertySchema,
  createPropertyResponseSchema,
  createNestedPropertyResponseSchema,
  updatePropertyResponseSchema,
  getPropertiesResponseSchema,
  dynamicListCreateResponseSchema,
  deleteResponseSchema,
};
