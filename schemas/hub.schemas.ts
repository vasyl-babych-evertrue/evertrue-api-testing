import Joi from 'joi';

// Generic helpers
export const hubMetaSchema = Joi.object({
  total: Joi.number().optional(),
  limit: Joi.number().optional(),
  offset: Joi.number().optional(),
}).unknown(true);

export const hubListSchema = Joi.object({
  items: Joi.array().items(Joi.object().unknown(true)).required(),
  meta: hubMetaSchema.optional(),
}).unknown(true);

export const hubDetailSchema = Joi.object().unknown(true);

export const hubSearchResponseSchema = Joi.object({
  items: Joi.array().items(Joi.object().unknown(true)).required(),
  meta: hubMetaSchema.optional(),
}).unknown(true);

export const hubStatusSchema = Joi.object({
  status: Joi.string().valid('ok', 'healthy').optional(),
}).unknown(true);

export const hubHealthSchema = Joi.object({
  status: Joi.string().optional(),
  checks: Joi.any().optional(),
}).unknown(true);

export default {
  hubMetaSchema,
  hubListSchema,
  hubDetailSchema,
  hubSearchResponseSchema,
  hubStatusSchema,
  hubHealthSchema,
};
