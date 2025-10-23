import Joi from 'joi';

/**
 * Teams API Schemas
 * Used for Relationship Management - Teams functionality
 */

/**
 * Schema for Team/Pool Object
 */
export const teamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  oid: Joi.number().integer().positive().required(),
  name: Joi.string().required(),
  pool_type: Joi.string().valid('TEAM').required(),
  selection_mode: Joi.string().valid('SOLICITOR_SELECTION', 'POOL_SELECTION', 'DISABLED').required(),
  giving_category_label: Joi.string().allow(null).required(),
  creator_user_id: Joi.number().integer().positive().required(),
  stage_group_id: Joi.number().integer().min(0).required(),
  created_at: Joi.number().integer().positive().required(),
  updated_at: Joi.number().integer().positive().required(),
  total_dollars_raised: Joi.number().min(0).allow(null).required(),
  pool_participation_rate: Joi.alternatives().try(
    Joi.number(),
    Joi.string().valid('NaN'),
    Joi.any().valid(null)
  ).required(),
  assigned_prospect_rate: Joi.alternatives().try(
    Joi.number(),
    Joi.string().valid('NaN'),
    Joi.any().valid(null)
  ).required(),
  total_prospect_count: Joi.number().integer().min(0).allow(null).required(),
  total_solicitor_count: Joi.number().integer().min(0).allow(null).required(),
  visit_threshold: Joi.number().integer().positive().allow(null).required(),
  contact_threshold: Joi.number().integer().positive().allow(null).required(),
  dxo_ask_threshold: Joi.number().integer().positive().allow(null).required(),
  duration_type: Joi.string().valid('FISCAL_YEAR', 'CALENDAR_YEAR', 'CUSTOM').required(),
  start_date: Joi.number().integer().positive().required(),
  end_date: Joi.number().integer().positive().required(),
  is_auto_rollover: Joi.boolean().required(),
  reset_stages: Joi.boolean().required(),
  unassign_prospects: Joi.boolean().required(),
  resource_url: Joi.string().uri().allow(null).required(),
  giving_page_url: Joi.string().uri().allow(null).required(),
  chat_enabled: Joi.boolean().required(),
  lead_updates_enabled: Joi.boolean().required(),
  participation_goal: Joi.number().integer().positive().allow(null).required(),
  dollar_amount_goal: Joi.number().positive().allow(null).required(),
  pool_id: Joi.number().integer().positive().required()
}).unknown(true);

/**
 * Schema for List of Teams/Pools Response
 * Used for GET /assignments-java/v2/pools
 */
export const teamsListResponseSchema = Joi.object({
  limit: Joi.number().integer().positive().required(),
  offset: Joi.number().integer().min(0).required(),
  items: Joi.array().items(teamSchema).required(),
  total: Joi.number().integer().min(0).required()
}).unknown(true);

/**
 * Schema for List of Teams/Pools (array only)
 */
export const teamsListSchema = Joi.array().items(teamSchema);

/**
 * Schema for Stage Object
 */
export const stageSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  oid: Joi.number().integer().positive().optional(),
  name: Joi.string().required(),
  stage_group_id: Joi.number().integer().positive().optional(),
  stage_group_type: Joi.string().valid('TEAM', 'POOL').required(),
  sort_order: Joi.number().integer().min(0).optional(),
  created_at: Joi.number().integer().positive().optional(),
  updated_at: Joi.number().integer().positive().optional()
}).unknown(true);

/**
 * Schema for List of Stages
 * Used for GET /assignments-java/v2/stages
 */
export const stagesListSchema = Joi.array().items(stageSchema);

/**
 * Schema for Stage Set (Stage Group) Object
 */
export const stageSetSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  oid: Joi.number().integer().positive().required(),
  name: Joi.string().required(),
  stage_group_type: Joi.string().valid('TEAM', 'POOL').required(),
  created_at: Joi.number().integer().positive().required(),
  updated_at: Joi.number().integer().positive().required(),
  stages: Joi.array().items(
    Joi.object({
      id: Joi.alternatives().try(
        Joi.string().uuid(),
        Joi.number().integer().positive()
      ).required(),
      stage: Joi.string().required(),
      active: Joi.boolean().required(),
      sort_order: Joi.number().integer().min(0).required()
    })
  ).optional()
}).unknown(true);

/**
 * Schema for Individual Stage within Stage Set
 */
export const individualStageSchema = Joi.object({
  id: Joi.alternatives().try(
    Joi.string().uuid(),
    Joi.number().integer().positive()
  ).required(),
  stage: Joi.string().required(),
  active: Joi.boolean().required(),
  sort_order: Joi.number().integer().min(0).required()
}).unknown(true);

/**
 * Schema for Create Stage Set Request
 */
export const createStageSetRequestSchema = Joi.object({
  name: Joi.string().required(),
  stage_group_type: Joi.string().valid('TEAM', 'POOL').required()
});

/**
 * Schema for Create Stage Request
 */
export const createStageRequestSchema = Joi.object({
  stage: Joi.string().required(),
  active: Joi.boolean().required(),
  id: Joi.string().uuid().required(),
  sort_order: Joi.number().integer().min(0).required()
});

/**
 * Schema for Update Stage Request
 */
export const updateStageRequestSchema = Joi.object({
  stage: Joi.string().required(),
  sort_order: Joi.number().integer().min(0).required(),
  active: Joi.boolean().required()
});

/**
 * Schema for Assignment Title Object
 */
export const assignmentTitleSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  oid: Joi.number().integer().positive().required(),
  title: Joi.string().required(),
  sort_order: Joi.number().integer().min(0).required(),
  active: Joi.boolean().required(),
  deleted: Joi.boolean().required(),
  created_at: Joi.number().integer().positive().required(),
  updated_at: Joi.number().integer().positive().required()
}).unknown(true);

/**
 * Schema for List of Assignment Titles (array only)
 */
export const assignmentTitlesListSchema = Joi.array().items(assignmentTitleSchema);

/**
 * Schema for Assignment Titles Response with pagination
 */
export const assignmentTitlesResponseSchema = Joi.object({
  limit: Joi.number().integer().positive().required(),
  offset: Joi.number().integer().min(0).required(),
  items: Joi.array().items(assignmentTitleSchema).required(),
  total: Joi.number().integer().min(0).required()
}).unknown(true);

/**
 * Schema for Create Assignment Title Request
 */
export const createAssignmentTitleRequestSchema = Joi.object({
  title: Joi.string().required(),
  active: Joi.boolean().required(),
  sort_order: Joi.number().integer().min(0).required()
});

/**
 * Schema for Update Assignment Title Request (bulk)
 */
export const updateAssignmentTitleRequestSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  oid: Joi.number().integer().positive().required(),
  title: Joi.string().required(),
  sort_order: Joi.number().integer().min(0).required(),
  active: Joi.boolean().required(),
  deleted: Joi.boolean().required(),
  created_at: Joi.number().integer().positive().required(),
  updated_at: Joi.number().integer().positive().required()
});

/**
 * Schema for Create Team Request
 */
export const createTeamRequestSchema = Joi.object({
  name: Joi.string().required(),
  pool_type: Joi.string().valid('TEAM').required(),
  selection_mode: Joi.string().valid('SOLICITOR_SELECTION', 'POOL_SELECTION').required()
});

/**
 * Schema for Update Team Request
 */
export const updateTeamRequestSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  oid: Joi.number().integer().positive().required(),
  name: Joi.string().required(),
  pool_type: Joi.string().valid('TEAM').required(),
  selection_mode: Joi.string().valid('SOLICITOR_SELECTION', 'POOL_SELECTION', 'DISABLED').required(),
  giving_category_label: Joi.string().allow(null).required(),
  creator_user_id: Joi.number().integer().positive().required(),
  stage_group_id: Joi.number().integer().positive().required(),
  created_at: Joi.number().integer().positive().required(),
  updated_at: Joi.number().integer().positive().required(),
  total_dollars_raised: Joi.number().min(0).required(),
  pool_participation_rate: Joi.alternatives().try(
    Joi.number(),
    Joi.string().valid('NaN')
  ).required(),
  assigned_prospect_rate: Joi.alternatives().try(
    Joi.number(),
    Joi.string().valid('NaN')
  ).required(),
  total_prospect_count: Joi.number().integer().min(0).required(),
  total_solicitor_count: Joi.number().integer().min(0).required(),
  visit_threshold: Joi.number().integer().positive().allow(null).required(),
  contact_threshold: Joi.number().integer().positive().allow(null).required(),
  dxo_ask_threshold: Joi.number().integer().positive().allow(null).required(),
  duration_type: Joi.string().valid('FISCAL_YEAR', 'CALENDAR_YEAR', 'CUSTOM').required(),
  start_date: Joi.number().integer().positive().required(),
  end_date: Joi.number().integer().positive().required(),
  is_auto_rollover: Joi.boolean().required(),
  reset_stages: Joi.boolean().required(),
  unassign_prospects: Joi.boolean().required(),
  resource_url: Joi.string().uri().allow(null).required(),
  giving_page_url: Joi.string().uri().allow(null).required(),
  chat_enabled: Joi.boolean().required(),
  lead_updates_enabled: Joi.boolean().required(),
  participation_goal: Joi.number().integer().positive().allow(null).required(),
  dollar_amount_goal: Joi.number().positive().allow(null).required(),
  pool_id: Joi.number().integer().positive().required()
});
