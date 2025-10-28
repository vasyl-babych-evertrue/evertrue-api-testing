import Joi from 'joi';

// Generic helpers (all fields required; allow null if field can be null)
export const hubMetaSchema = Joi.object({
  total: Joi.number().allow(null).required(),
  limit: Joi.number().allow(null).required(),
  offset: Joi.number().allow(null).required(),
});

// List response: enforce presence of items and meta; do not permit extra unknown keys at root
export const hubListSchema = Joi.object({
  items: Joi.array().items(Joi.any()).required(),
  meta: hubMetaSchema.allow(null).required(),
});

// Some endpoints (e.g., GET /hub/v1/filters?query=...) return a bare array
export const hubFiltersArraySchema = Joi.array().items(Joi.any()).required();

// Search response: similar structure to list
export const hubSearchResponseSchema = Joi.object({
  items: Joi.array().items(Joi.any()).required(),
  meta: hubMetaSchema.allow(null).required(),
});

// Status/health (not used in current tests)
export const hubStatusSchema = Joi.object({
  status: Joi.string().valid('ok', 'healthy').required(),
});

export const hubHealthSchema = Joi.object({
  status: Joi.string().required(),
  checks: Joi.any().allow(null).required(),
});

export default {
  hubMetaSchema,
  hubListSchema,
  hubSearchResponseSchema,
  hubStatusSchema,
  hubHealthSchema,
};
