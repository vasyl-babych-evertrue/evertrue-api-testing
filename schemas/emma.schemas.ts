import Joi from 'joi';

// Emma Account
export const emmaAccountSchema = Joi.object({
  id: Joi.number().required(),
  oid: Joi.number().required(),
  remote_id: Joi.number().required(),
  name: Joi.string().required(),
  public_api_key: Joi.string().required(),
  created_at: Joi.number().required(),
  updated_at: Joi.number().allow(null).required(),
  invalidated_at: Joi.number().allow(null).required(),
});

export const emmaAccountCreateResponseSchema = Joi.object({
  id: Joi.number().required(),
  oid: Joi.number().required(),
  remote_id: Joi.number().required(),
  name: Joi.string().required(),
  public_api_key: Joi.string().required(),
  private_api_key: Joi.string().required(),
  created_at: Joi.number().required(),
  updated_at: Joi.number().allow(null).required(),
  invalidated_at: Joi.number().allow(null).required(),
});

export const emmaAccountsArraySchema = Joi.array().items(emmaAccountSchema).required();

export const emmaDeleteEmptyResponseSchema = Joi.string().allow('').required();

// Emma Member
export const emmaMemberCreateResponseSchema = Joi.object({
  id: Joi.number().required(),
  remote_id: Joi.number().required(),
  account_id: Joi.number().required(),
  contact_id: Joi.number().required(),
  oid: Joi.number().required(),
  name: Joi.string().required(),
  email: Joi.string().required(),
  emma_member_data: Joi.object({
    first_name: Joi.string().required(),
    last_name: Joi.string().required(),
  }).required(),
  evertrue_member_data: Joi.object({
    first_name: Joi.string().required(),
    last_name: Joi.string().required(),
  }).required(),
  in_emma: Joi.boolean().required(),
  should_send: Joi.boolean().required(),
});

export const emmaMemberDetailSchema = Joi.object({
  id: Joi.number().required(),
  oid: Joi.number().required(),
  group_id: Joi.number().required(),
  member_id: Joi.number().required(),
  emma_state: Joi.object({
    first_name: Joi.string().required(),
    last_name: Joi.string().required(),
  }).required(),
  et_state: Joi.object({
    first_name: Joi.string().required(),
    last_name: Joi.string().required(),
  }).required(),
  last_pulled: Joi.number().required(),
  last_pushed: Joi.number().required(),
  in_emma: Joi.boolean().required(),
  should_send: Joi.boolean().required(),
  created_at: Joi.number().required(),
  updated_at: Joi.number().allow(null).required(),
});

export const emmaMembersListSchema = Joi.object({
  limit: Joi.number().required(),
  offset: Joi.number().required(),
  items: Joi.array().items(emmaMemberDetailSchema).required(),
});

export const emmaMembersArraySchema = Joi.array().items(emmaMemberCreateResponseSchema).required();

// Emma Group
export const emmaGroupSchema = Joi.object({
  id: Joi.number().required(),
  remote_id: Joi.number().required(),
  name: Joi.string().required(),
  account_id: Joi.number().required(),
  oid: Joi.number().required(),
  emma_members_count: Joi.number().required(),
  et_list_id: Joi.number().required(),
  et_list_owner_id: Joi.number().required(),
  et_connected_by_id: Joi.number().required(),
  et_members_count: Joi.number().required(),
  in_emma: Joi.boolean().required(),
  should_send: Joi.boolean().required(),
  last_pulled: Joi.number().allow(null).required(),
  last_pushed: Joi.number().allow(null).required(),
  created_at: Joi.number().required(),
  updated_at: Joi.number().allow(null).required(),
});

export const emmaGroupsArraySchema = Joi.array().items(emmaGroupSchema).required();

export const emmaGroupsListSchema = Joi.object({
  limit: Joi.number().required(),
  offset: Joi.number().required(),
  items: Joi.array().items(emmaGroupSchema).required(),
});

export default {
  emmaAccountSchema,
  emmaAccountCreateResponseSchema,
  emmaAccountsArraySchema,
  emmaDeleteEmptyResponseSchema,
  emmaMemberCreateResponseSchema,
  emmaMemberDetailSchema,
  emmaMembersListSchema,
  emmaMembersArraySchema,
  emmaGroupSchema,
  emmaGroupsArraySchema,
  emmaGroupsListSchema,
};
