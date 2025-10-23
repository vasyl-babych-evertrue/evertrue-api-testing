import Joi from 'joi';

/**
 * Interactions API Schemas
 * Used for managing interaction custom fields and types
 */

/**
 * Schema for Interaction Custom Field
 */
export const interactionCustomFieldSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  oid: Joi.number().integer().positive().required(),
  dataType: Joi.string().valid('STRING', 'DOUBLE', 'BOOLEAN', 'DATE', 'CURRENCY', 'PICKLIST').required(),
  required: Joi.boolean().required(),
  displayName: Joi.string().required(),
  uiControlType: Joi.string().allow(null).optional(),
  esField: Joi.string().required(),
  createdAt: Joi.number().integer().positive().required(),
  updatedAt: Joi.number().integer().positive().required(),
  sortOrder: Joi.number().integer().min(0).required(),
  active: Joi.boolean().required(),
  picklistValues: Joi.array().items(Joi.string()).optional()
}).unknown(true);

/**
 * Schema for List of Custom Fields
 */
export const interactionCustomFieldsListSchema = Joi.array().items(interactionCustomFieldSchema);

/**
 * Schema for Create Custom Field Request
 */
export const createCustomFieldRequestSchema = Joi.object({
  dataType: Joi.string().valid('STRING', 'DOUBLE', 'BOOLEAN', 'DATE').required(),
  required: Joi.boolean().optional(),
  displayName: Joi.string().required(),
  sortOrder: Joi.number().integer().min(0).required(),
  uiControlType: Joi.string().optional()
});

/**
 * Schema for Update Custom Field Request
 */
export const updateCustomFieldRequestSchema = Joi.object({
  dataType: Joi.string().valid('STRING', 'DOUBLE', 'BOOLEAN', 'DATE', 'CURRENCY', 'PICKLIST').optional(),
  required: Joi.boolean().optional(),
  displayName: Joi.string().optional(),
  sortOrder: Joi.number().integer().min(0).optional(),
  active: Joi.boolean().optional(),
  picklistValues: Joi.array().items(Joi.string()).optional()
});

/**
 * Schema for Interaction Type Category
 */
export const interactionTypeCategorySchema = Joi.object({
  id: Joi.number().integer().positive().optional(),
  ugc_type_id: Joi.number().integer().positive().optional(),
  category: Joi.string().required(),
  display_name: Joi.string().optional(),
  created_at: Joi.number().integer().positive().optional(),
  updated_at: Joi.number().integer().positive().optional()
}).unknown(true);

/**
 * Schema for Interaction Type
 */
export const interactionTypeSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  oid: Joi.number().integer().positive().optional(),
  type: Joi.string().required(),
  data_type: Joi.string().optional(),
  active: Joi.boolean().required(),
  sort_order: Joi.number().integer().min(0).optional(),
  categories: Joi.array().items(interactionTypeCategorySchema).optional(),
  created_at: Joi.number().integer().positive().optional(),
  updated_at: Joi.number().integer().positive().optional()
}).unknown(true);

/**
 * Schema for List of Interaction Types
 */
export const interactionTypesListSchema = Joi.array().items(interactionTypeSchema);

/**
 * Schema for Create Interaction Type Request
 */
export const createInteractionTypeRequestSchema = Joi.object({
  type: Joi.string().required(),
  active: Joi.boolean().required(),
  categories: Joi.array().items(
    Joi.object({
      display_name: Joi.string().optional(),
      category: Joi.string().required()
    })
  ).required(),
  sort_order: Joi.number().integer().min(0).required()
});

/**
 * Schema for Update Interaction Type Request (Bulk)
 */
export const updateInteractionTypeRequestSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  oid: Joi.number().integer().positive().required(),
  type: Joi.string().required(),
  data_type: Joi.string().required(),
  active: Joi.boolean().required(),
  sort_order: Joi.number().integer().min(0).required(),
  categories: Joi.array().items(interactionTypeCategorySchema).required(),
  created_at: Joi.number().integer().positive().required(),
  updated_at: Joi.number().integer().positive().required()
});
