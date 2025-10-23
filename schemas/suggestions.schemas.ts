import Joi from 'joi';

/**
 * Suggestions API Schemas
 * Used for Review Contact Updates functionality
 */

/**
 * Schema for Suggestion Object
 */
const suggestionSchema = Joi.object({
  id: Joi.string().required(),
  type: Joi.string().required(),
  contact_id: Joi.string().required(),
  field_name: Joi.string().required(),
  old_value: Joi.any().allow(null).required(),
  new_value: Joi.any().allow(null).required(),
  is_approved: Joi.boolean().required(),
  created_at: Joi.string().required(),
  updated_at: Joi.string().required()
}).unknown(true); // Allow additional fields

/**
 * Schema for Submission Object (parent of suggestions)
 */
const submissionSchema = Joi.object({
  id: Joi.string().required(),
  contact_id: Joi.string().required(),
  created_at: Joi.string().required(),
  updated_at: Joi.string().required(),
  suggestions: Joi.array().items(suggestionSchema).required()
}).unknown(true);

/**
 * Schema for Contact Data Search Response
 * Used for POST /suggestions/v1/submissions/search
 */
export const contactDataSearchSchema = Joi.object({
  total: Joi.number().integer().min(0).required(),
  limit: Joi.number().integer().positive().required(),
  offset: Joi.number().integer().min(0).required(),
  items: Joi.array().items(submissionSchema).required()
}).unknown(true);

/**
 * Schema for Export Approved Suggestions Response
 * Used for POST /exporter/v1/submit/suggestion
 */
export const exportApprovedSuggestionsSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  created_at: Joi.number().integer().positive().required(),
  updated_at: Joi.number().integer().positive().required(),
  user_id: Joi.number().integer().positive().required(),
  oid: Joi.number().integer().positive().required(),
  external_path: Joi.string().allow(null).required(),
  file_name: Joi.string().required(),
  last_downloaded_at: Joi.number().integer().positive().allow(null).required(),
  percent_complete: Joi.number().integer().min(0).max(100).required(),
  state: Joi.number().integer().required(),
  list_id: Joi.number().integer().positive().allow(null).required(),
  app_key_id: Joi.number().integer().positive().required(),
  title: Joi.string().allow(null).required(),
  remote_id: Joi.string().allow(null).required(),
  type: Joi.string().required(),
  started_at: Joi.number().integer().positive().allow(null).required(),
  completed_at: Joi.number().integer().positive().allow(null).required(),
  search_criteria: Joi.string().allow('', null).required(),
  job_descriptor: Joi.string().allow('', null).required(),
  restart_count: Joi.number().integer().min(0).required(),
  total_bytes: Joi.number().integer().positive().allow(null).required(),
  error_message: Joi.string().allow(null).required()
}).unknown(true);
