import Joi from 'joi';

// Common primitives
export const propertyPermissionSchema = Joi.object({
  writable: Joi.boolean().allow(null).required(),
  subject_role_id: Joi.number().allow(null).required(),
  actor_role_id: Joi.number().allow(null).required(),
});

export const propertySchema = Joi.object({
  id: Joi.number().allow(null).required(),
  name: Joi.string().required(),
  description: Joi.string().allow('', null).required(),
  data_type: Joi.string().required(),
  default: Joi.boolean().required(),
  permissions: Joi.array().items(propertyPermissionSchema).allow(null).required(),
  app_keys: Joi.array().items(Joi.string()).allow(null).required(),
  updated_at: Joi.number().allow(null).required(),
  created_at: Joi.number().allow(null).required(),
});

// Responses
export const createPropertyResponseSchema = propertySchema;
export const createNestedPropertyResponseSchema = propertySchema;
export const updatePropertyResponseSchema = propertySchema;

export const getPropertiesResponseSchema = Joi.object({
  items: Joi.array().items(propertySchema).required(),
});

// Some environments return a bare array for GET /contacts/v1/properties
export const propertiesArraySchema = Joi.array().items(propertySchema).required();

export const dynamicListCreateResponseSchema = Joi.object({
  id: Joi.number().required(),
  name: Joi.string().required(),
  type: Joi.string().required(),
});

export const deleteResponseSchema = Joi.object({
  status: Joi.string().allow('', 'ok').required(),
}).allow(null);

export default {
  propertyPermissionSchema,
  propertySchema,
  createPropertyResponseSchema,
  createNestedPropertyResponseSchema,
  updatePropertyResponseSchema,
  getPropertiesResponseSchema,
  propertiesArraySchema,
  dynamicListCreateResponseSchema,
  deleteResponseSchema,
};
