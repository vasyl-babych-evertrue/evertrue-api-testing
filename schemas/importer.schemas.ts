import Joi from 'joi';

/**
 * Importer API Schemas
 * Based on: https://github.com/evertrue/importer/wiki/Endpoint-Doc
 */

/**
 * Schema for Job Object
 * Represents an import job in the Importer system
 */
export const jobSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  oid: Joi.number().integer().positive().required(),
  s3_filename: Joi.string().required(),
  type: Joi.string().allow('CSV', 'TRANSACTIONAL_CSV', 'ASSIGNMENT_CSV', 'ASSIGNMENT_TEAM_CSV', 'JSON', 'NOTES_CSV', 'PROPOSAL_CSV', 'UNKNOWN').required(),
  source: Joi.string().valid('CSV', 'RAISERSEDGE').optional(),
  compression: Joi.string().valid('NONE', 'ZIP', 'GZIP').optional(),
  map_id: Joi.number().integer().positive().allow(null).optional(),
  mapping_hash_id: Joi.number().integer().positive().allow(null).optional(),
  prune: Joi.boolean().optional(),
  notify: Joi.boolean().optional(),
  status: Joi.string().allow(
    'NEW', 'FORKED', 'QUEUED', 'RUNNING', 'OK', 'WARN', 'FAILED', 'CANCELLED',
    'PRUNING', 'PRUNING_FORKED', 'PRUNING_PENDING', 'PRUNING_QUEUED',
    'PRUNING_RECONCILE_PENDING', 'RECONCILE_PENDING', 'FILECHECK_FORKED',
    'FILECHECK_QUEUED', 'FILECHECK_RUNNING', 'FILECHECK_SUCCESS', 'FILECHECK_FAILED'
  ).required(),
  created_at: Joi.number().integer().positive().required(),
  updated_at: Joi.number().integer().positive().required(),
  status_started_at: Joi.number().integer().positive().optional(),
  current_status_id: Joi.number().integer().positive().optional(),
  type_display_name: Joi.string().optional(),
  status_display_name: Joi.string().optional(),
  // V3 API additional fields
  file_headers: Joi.array().items(Joi.object({
    import_column: Joi.string().required()
  })).optional(),
  automatic_import: Joi.boolean().optional(),
  full_import: Joi.boolean().optional(),
  mapping_complete: Joi.boolean().optional()
}).unknown(true); // Allow additional fields for flexibility

/**
 * Schema for Paginated Job List
 * Used for GET /importer/v1/jobs endpoint
 */
export const paginatedJobListSchema = Joi.object({
  limit: Joi.number().integer().positive().required(),
  offset: Joi.number().integer().min(0).required(),
  total: Joi.number().integer().min(0).required(),
  items: Joi.array().items(jobSchema).required()
});

/**
 * Schema for S3 URL Response
 * Used for GET /importer/v1/jobs/{job_id}/download endpoint
 */
export const s3UrlSchema = Joi.object({
  s3_url: Joi.string().uri().required()
});

/**
 * Schema for Mapping Check Response
 * Used for POST /importer/v1/jobs/mapping_check endpoint
 */
export const mappingCheckSchema = Joi.object({
  mapping_exists: Joi.boolean().required()
});

/**
 * Schema for Stat Object - Succeeded/Failed operations
 */
const statOperationsSchema = Joi.object({
  inspected: Joi.number().integer().min(0).required(),
  created: Joi.number().integer().min(0).required(),
  updated: Joi.number().integer().min(0).required(),
  deleted: Joi.number().integer().min(0).required(),
  roles_updated: Joi.number().integer().min(0).optional(),
  console_privacy_updated: Joi.number().integer().min(0).allow(null).optional()
});

/**
 * Schema for individual Stat item
 */
const statItemSchema = Joi.object({
  import_progress: Joi.number().integer().min(0).max(100).required(),
  type: Joi.string().valid('CONTACT', 'GIFT', 'NOTE', 'PROPOSAL', 'ASSIGNMENT').required(),
  pruning_progress: Joi.number().integer().min(0).max(100).allow(null).optional(),
  succeeded: statOperationsSchema.required(),
  failed: statOperationsSchema.required(),
  top_level_gifts: Joi.object().unknown(true).optional(),
  second_level_gifts: Joi.object().unknown(true).allow(null).optional(),
  third_level_gifts: Joi.object().unknown(true).allow(null).optional(),
  soft_credits_on_pledges: Joi.object().unknown(true).allow(null).optional(),
  soft_credits_on_same_contact_as_related_gift: Joi.object().unknown(true).allow(null).optional(),
  pruned_gifts: Joi.number().integer().min(0).optional()
});

/**
 * Schema for Stat Object
 * Used for GET /importer/v1/stats/job/{job_id} endpoint
 */
export const statSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  oid: Joi.number().integer().positive().required(),
  job_id: Joi.number().integer().positive().required(),
  created_at: Joi.number().integer().positive().required(),
  updated_at: Joi.number().integer().positive().required(),
  import_progress: Joi.number().integer().min(0).max(100).required(),
  pruning_progress: Joi.number().integer().min(0).max(100).required(),
  stat: Joi.array().items(statItemSchema).required()
});

/**
 * Schema for Event Summary
 * Used for GET /importer/v1/events/job/{job_id}/summary endpoint
 */
export const eventSummarySchema = Joi.object({
  CREATE: Joi.number().integer().min(0).optional(),
  UPDATE: Joi.number().integer().min(0).optional(),
  DELETE: Joi.number().integer().min(0).optional(),
  ERROR: Joi.number().integer().min(0).optional()
});

/**
 * Schema for Event Summary List Item
 */
const eventSummaryListItemSchema = Joi.object({
  event_code: Joi.number().integer().required(),
  message: Joi.string().required(),
  count: Joi.number().integer().min(0).required()
});

/**
 * Schema for Event Summary List
 * Used for GET /importer/v1/events/job/{job_id}/distinct endpoint
 */
export const eventSummaryListSchema = Joi.array().items(eventSummaryListItemSchema);

/**
 * Schema for Event Object
 */
const eventSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  oid: Joi.number().integer().positive().required(),
  job_id: Joi.number().integer().positive().required(),
  event_code: Joi.number().integer().required(),
  remote_id: Joi.string().allow(null).required(),
  message: Joi.string().required(),
  created_at: Joi.number().integer().positive().required()
});

/**
 * Schema for Paginated Event List
 * Used for GET /importer/v1/events/job/{job_id}/event/{event_code} endpoint
 */
export const paginatedEventListSchema = Joi.object({
  limit: Joi.number().integer().positive().required(),
  offset: Joi.number().integer().min(0).required(),
  total: Joi.number().integer().min(0).required(),
  items: Joi.array().items(eventSchema).required()
});

/**
 * Schema for Paginated Pruning List
 * Used for GET /importer/v1/pruning/jobs/{job_id} endpoint
 */
export const paginatedPruningListSchema = Joi.object({
  limit: Joi.number().integer().positive().required(),
  offset: Joi.number().integer().min(0).required(),
  total: Joi.number().integer().min(0).required(),
  items: Joi.array().items(Joi.string()).required()
});

/**
 * Schema for Pruning Summary
 * Used for GET /importer/v1/pruning/jobs/{job_id}/summary endpoint
 */
export const pruningSummarySchema = Joi.object({
  TOTAL: Joi.number().integer().min(0).optional(),
  CONTACTS: Joi.number().integer().min(0).optional(),
  GIFTS: Joi.number().integer().min(0).optional(),
  NOTES: Joi.number().integer().min(0).optional(),
  PROPOSAL: Joi.number().integer().min(0).optional(),
  ASSIGNMENTS: Joi.number().integer().min(0).optional()
}).min(1);
