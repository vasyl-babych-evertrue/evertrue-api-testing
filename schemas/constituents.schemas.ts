import Joi from 'joi';

/**
 * Constituents API Schemas
 * Used for managing custom contact properties/fields
 */

/**
 * Schema for Permission Object
 */
const permissionSchema = Joi.object({
  actor_role_id: Joi.number().integer().positive().required(),
  subject_role_id: Joi.number().integer().positive().required(),
  writable: Joi.boolean().required()
}).unknown(true);

/**
 * Schema for Property/Field Object
 */
export const propertySchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  name: Joi.string().required(),
  description: Joi.string().allow('', null).required(),
  created_at: Joi.number().integer().positive().required(),
  updated_at: Joi.number().integer().positive().required(),
  data_type: Joi.string().valid(
    'string', 'boolean', 'number', 'currency', 'date', 'date_string',
    'list', 'object', 'datetime'
  ).required(),
  default: Joi.boolean().required(),
  reserved: Joi.boolean().required(),
  visible: Joi.boolean().required(),
  filterable: Joi.boolean().required(),
  oid: Joi.number().integer().positive().required(),
  parent_id: Joi.number().integer().positive().allow(null).required(),
  permissions: Joi.array().items(permissionSchema).required(),
  app_keys: Joi.array().items(Joi.string()).required(),
  deleted: Joi.boolean().required(),
  // For nested objects
  containing_object: Joi.object().allow(null).optional(),
  properties: Joi.array().optional()
}).unknown(true);

/**
 * Schema for List of Properties
 * Used for GET /contacts/v1/properties
 */
export const propertiesListSchema = Joi.array().items(propertySchema);

/**
 * Schema for Create Property Request
 */
export const createPropertyRequestSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow('', null).required(),
  updated_at: Joi.number().integer().positive().required(),
  data_type: Joi.string().valid(
    'string', 'boolean', 'number', 'currency', 'date', 'date_string'
  ).required(),
  default: Joi.boolean().required(),
  reserved: Joi.boolean().required(),
  visible: Joi.boolean().required(),
  filterable: Joi.boolean().required(),
  oid: Joi.number().integer().positive().required(),
  parent_id: Joi.number().integer().positive().allow(null).required(),
  permissions: Joi.array().items(permissionSchema).required(),
  app_keys: Joi.array().items(Joi.string()).required(),
  deleted: Joi.boolean().required()
});

/**
 * Schema for Update Property Request
 */
export const updatePropertyRequestSchema = Joi.object({
  name: Joi.string().optional(), // Name cannot be changed after creation
  description: Joi.string().allow('', null).required(),
  created_at: Joi.number().integer().positive().optional(),
  updated_at: Joi.number().integer().positive().required(),
  data_type: Joi.string().valid(
    'string', 'boolean', 'number', 'currency', 'date', 'date_string'
  ).required(),
  default: Joi.boolean().required(),
  reserved: Joi.boolean().required(),
  visible: Joi.boolean().required(),
  filterable: Joi.boolean().required(),
  oid: Joi.number().integer().positive().required(),
  parent_id: Joi.number().integer().positive().allow(null).optional(),
  permissions: Joi.array().items(permissionSchema).required(),
  app_keys: Joi.array().items(Joi.string()).required(),
  deleted: Joi.boolean().required()
});
