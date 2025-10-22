import Joi from 'joi';

// Generic paginated search response schema used across search endpoints
export const paginatedSearchResponseSchema = Joi.object({
  items: Joi.array().optional(),
  limit: Joi.number().optional(),
  total: Joi.number().optional(),
  offset: Joi.number().optional(),
  scroll: Joi.boolean().optional(),
  // Some endpoints may include facets, stats, aggregations etc.
  facet: Joi.any().optional(),
  facets: Joi.any().optional(),
  stats: Joi.any().optional(),
  aggregations: Joi.any().optional(),
}).unknown(true);

// Contacts search responses
export const contactsSearchResponseSchema = paginatedSearchResponseSchema;

// Contact note search (highlighting) responses
export const contactNoteSearchResponseSchema = paginatedSearchResponseSchema;

export default {
  paginatedSearchResponseSchema,
  contactsSearchResponseSchema,
  contactNoteSearchResponseSchema,
};
