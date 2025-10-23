/**
 * Joi Schemas for Auth API responses
 * Converted from Postman environment variables
 */

import Joi from 'joi';

/**
 * Schema for GET /auth/session (current session)
 */
export const currentSessionSchema = Joi.object({
  expire_at: Joi.number().required(),
  trusted_device: Joi.boolean().required(),
  device_id: Joi.string().allow(null).required(),
  token: Joi.string().required(),
  created_at: Joi.number().required(),
  updated_at: Joi.number().required(),
  user: Joi.object({
    id: Joi.number().required(),
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    super_user: Joi.boolean().required(),
    can_delete_orgs: Joi.boolean().required(),
    has_linkedin_identities: Joi.boolean().required(),
    confirmed_at: Joi.number().required(),
    changed_at: Joi.number().required(),
    first_oid: Joi.number().required(),
    oids: Joi.array().items(Joi.number()).required(),
    has_multiple_affiliations: Joi.boolean().required(),
    mfa_required: Joi.boolean().required(),
    created_at: Joi.number().required(),
    updated_at: Joi.number().required(),
    last_sign_in_at: Joi.string().allow(null).required(),
    password_set_at: Joi.any().allow(null).required(),
    saml_user_id: Joi.any().allow(null).required(),
    user_profile_picture_url: Joi.any().allow(null).required(),
    mfa_enabled_at: Joi.any().allow(null).required(),
    affiliations: Joi.array().required(),
    affiliation_requests: Joi.array().required()
  }).required(),
  application: Joi.object({
    id: Joi.number().required(),
    name: Joi.string().required(),
    key: Joi.string().required(),
    created_at: Joi.number().required(),
    updated_at: Joi.number().required()
  }).required(),
  organization: Joi.object({
    id: Joi.number().required(),
    name: Joi.string().required(),
    slug: Joi.string().required()
  }).allow(null).required()
});

/**
 * Schema for POST /auth/session (create session with Basic Auth)
 * Standard session creation without Device ID
 */
export const createSessionSchema = Joi.object({
  token: Joi.string().required(),
  prime_token: Joi.string().allow(null).required(),
  user: Joi.object({
    id: Joi.number().required(),
    email: Joi.string().email().required(),
    first_name: Joi.string().allow(null).optional(),
    last_name: Joi.string().allow(null).optional()
  }).required()
});

/**
 * Schema for POST /auth/session with Device ID (Prime Token flow)
 * Returns both session token and prime_token
 */
export const createSessionWithDeviceSchema = Joi.object({
  token: Joi.string().required(),
  prime_token: Joi.string().required(),
  device_id: Joi.string().required(),
  user: Joi.object({
    id: Joi.number().required(),
    email: Joi.string().email().required(),
    first_name: Joi.string().allow(null).optional(),
    last_name: Joi.string().allow(null).optional()
  }).required()
});

/**
 * Schema for POST /auth/session with type: SCOPED
 * Creates scoped session with organization context
 */
export const createScopedSessionSchema = Joi.object({
  token: Joi.string().required(),
  type: Joi.string().required(),
  oid: Joi.number().required(),
  prime_token: Joi.string().allow(null).required(),
  user: Joi.object({
    id: Joi.number().required(),
    email: Joi.string().email().required(),
    first_name: Joi.string().allow(null).optional(),
    last_name: Joi.string().allow(null).optional()
  }).required()
});

/**
 * Schema for POST /auth/session with EvertruePrimeToken provider
 * Creates session using existing Prime Token
 */
export const createSessionFromPrimeTokenSchema = Joi.object({
  token: Joi.string().required(),
  device_id: Joi.string().required(),
  user: Joi.object({
    id: Joi.number().required(),
    email: Joi.string().email().required(),
    first_name: Joi.string().allow(null).optional(),
    last_name: Joi.string().allow(null).optional()
  }).required()
});

/**
 * Schema for POST /auth/session with EvertrueTemporaryTokenStrategy
 * Used for creating temporary scoped sessions
 */
export const createTemporarySessionSchema = Joi.object({
  token: Joi.string().required(),
  type: Joi.string().required(),
  oid: Joi.number().required(),
  expire_at: Joi.alternatives().try(
    Joi.number(),
    Joi.string()
  ).required()
});

/**
 * Schema for GET /auth/status
 */
export const statusSchema = Joi.object({
  status: Joi.string().required()
});

/**
 * Schema for empty response (204 No Content)
 */
export const emptyResponseSchema = Joi.string().valid('').required();

/**
 * Schema for User Search Response (POST /auth/users/search)
 * Note: Some users may not have all fields present
 */
export const userSearchSchema = Joi.object({
  total: Joi.number().required(),
  limit: Joi.number().required(),
  offset: Joi.number().required(),
  users: Joi.array().items(
    Joi.object({
      id: Joi.number().required(),
      name: Joi.string().required(),
      email: Joi.string().required(),
      super_user: Joi.boolean().required(),
      has_linkedin_identities: Joi.boolean().optional(),
      changed_at: Joi.number().required(),
      saml_user_id: Joi.string().allow(null).optional(),
      last_sign_in_at: Joi.alternatives().try(
        Joi.string().isoDate(),
        Joi.string().allow(null)
      ).optional(),
      created_at: Joi.number().required(),
      updated_at: Joi.number().required(),
      confirmed_at: Joi.alternatives().try(
        Joi.number(),
        Joi.string().allow(null)
      ).required(),
      mfa_enabled_at: Joi.number().allow(null).optional(),
      affiliations: Joi.array().required(),
      affiliation_requests: Joi.array().required(),
      version_created_at: Joi.alternatives().try(
        Joi.number(),
        Joi.string()
      ).required()
    })
  ).required()
});

/**
 * Schema for GET /auth/users/me - Current logged in user
 * This is the most complete user schema with all fields
 */
export const userSchema = Joi.object({
  // Core required fields - always present
  id: Joi.number().required(),
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  super_user: Joi.boolean().required(),
  super_admin: Joi.boolean().required(),
  can_delete_orgs: Joi.boolean().required(),
  has_linkedin_identities: Joi.boolean().required(),
  confirmed_at: Joi.number().required(),
  created_at: Joi.number().required(),
  updated_at: Joi.number().required(),
  changed_at: Joi.number().required(),
  last_sign_in_at: Joi.number().allow(null).required(),
  first_session_created_at: Joi.number().allow(null).required(),
  last_session_created_at: Joi.number().allow(null).required(),
  first_affiliation_created_at: Joi.number().allow(null).required(),
  mfa_state: Joi.string().required(),
  
  // Fields that can be null
  saml_user_id: Joi.any().allow(null).required(),
  mfa_enabled_at: Joi.any().allow(null).required(),
  confirmation_sent_at: Joi.any().allow(null).required(),
  final_revoked_date: Joi.any().allow(null).required(),
  password_set_at: Joi.any().allow(null).required(),
  
  // Complex nested arrays
  affiliations: Joi.array().items(
    Joi.object({
      id: Joi.number().required(),
      organization_id: Joi.number().required(),
      remote_user_id: Joi.any().allow(null).required(),
      contact_id: Joi.any().allow(null).required(),
      legacy_user_id: Joi.any().allow(null).required(),
      created_at: Joi.number().required(),
      updated_at: Joi.number().required(),
      organization: Joi.object({
        id: Joi.number().required(),
        name: Joi.string().required(),
        slug: Joi.string().required(),
        sso_method: Joi.string().required()
      }).required(),
      affiliation_roles: Joi.array().items(
        Joi.object({
          id: Joi.number().required(),
          role_id: Joi.number().required(),
          creator_user_id: Joi.number().required(),
          created_at: Joi.number().required(),
          updated_at: Joi.number().required(),
          role: Joi.object({
            id: Joi.number().required(),
            remote_id: Joi.string().allow('').required(),
            organization_id: Joi.number().required(),
            name: Joi.string().required(),
            default: Joi.boolean().required(),
            can_see_private_data: Joi.boolean().required()
          }).required()
        })
      ).required()
    })
  ).required(),
  
  affiliation_requests: Joi.array().items(
    Joi.object({
      id: Joi.number().required(),
      data: Joi.object().required(),
      committed: Joi.boolean().required(),
      status: Joi.string().required(),
      affiliation: Joi.any().allow(null).required(),
      organization: Joi.object({
        id: Joi.number().required(),
        name: Joi.string().required(),
        slug: Joi.string().required(),
        sso_method: Joi.string().required()
      }).required(),
      created_at: Joi.number().required(),
      updated_at: Joi.number().required()
    })
  ).required(),
  
  affiliation_attributes: Joi.array().items(
    Joi.object({
      id: Joi.number().required(),
      affiliation_id: Joi.number().required(),
      school_division_department_id: Joi.number().required(),
      title: Joi.string().required(),
      persona: Joi.string().required(),
      seniority: Joi.any().allow(null).required(),
      user_profile_picture_url: Joi.any().allow(null).required(),
      user_profile_picture_source: Joi.any().allow(null).required(),
      user_profile_picture_last_updated: Joi.any().allow(null).required(),
      created_at: Joi.number().required(),
      updated_at: Joi.number().required()
    })
  ).required()
});

/**
 * Schema for GET /auth/users/{id} - Get user by ID
 * This endpoint returns fewer fields than /auth/users/me
 */
export const userByIdSchema = Joi.object({
  id: Joi.number().required(),
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  super_user: Joi.boolean().required(),
  super_admin: Joi.boolean().required(),
  can_delete_orgs: Joi.boolean().required(),
  has_linkedin_identities: Joi.boolean().required(),
  confirmed_at: Joi.number().required(),
  created_at: Joi.number().required(),
  updated_at: Joi.number().required(),
  changed_at: Joi.number().required(),
  last_sign_in_at: Joi.number().allow(null).required(),
  saml_user_id: Joi.any().allow(null).required(),
  confirmation_sent_at: Joi.any().allow(null).required(),
  password_set_at: Joi.any().allow(null).required(),
  affiliations: Joi.array().items(
    Joi.object({
      id: Joi.number().required(),
      organization_id: Joi.number().required(),
      remote_user_id: Joi.any().allow(null).required(),
      contact_id: Joi.any().allow(null).required(),
      legacy_user_id: Joi.any().allow(null).required(),
      created_at: Joi.number().required(),
      updated_at: Joi.number().required(),
      organization: Joi.object({
        id: Joi.number().required(),
        name: Joi.string().required(),
        slug: Joi.string().required(),
        sso_method: Joi.string().required()
      }).required(),
      affiliation_roles: Joi.array().items(
        Joi.object({
          id: Joi.number().required(),
          role_id: Joi.number().required(),
          creator_user_id: Joi.number().required(),
          created_at: Joi.number().required(),
          updated_at: Joi.number().required(),
          role: Joi.object({
            id: Joi.number().required(),
            remote_id: Joi.string().allow('').required(),
            organization_id: Joi.number().required(),
            name: Joi.string().required(),
            default: Joi.boolean().required(),
            can_see_private_data: Joi.boolean().required()
          }).required()
        })
      ).required()
    })
  ).required(),
  affiliation_requests: Joi.array().items(
    Joi.object({
      id: Joi.number().required(),
      data: Joi.object().required(),
      committed: Joi.boolean().required(),
      status: Joi.string().required(),
      affiliation: Joi.any().allow(null).required(),
      organization: Joi.object({
        id: Joi.number().required(),
        name: Joi.string().required(),
        slug: Joi.string().required(),
        sso_method: Joi.string().required()
      }).required(),
      created_at: Joi.number().required(),
      updated_at: Joi.number().required()
    })
  ).required(),
  affiliation_attributes: Joi.array().items(
    Joi.object({
      id: Joi.number().required(),
      affiliation_id: Joi.number().required(),
      school_division_department_id: Joi.number().required(),
      title: Joi.string().required(),
      persona: Joi.string().required(),
      seniority: Joi.any().allow(null).required(),
      user_profile_picture_url: Joi.any().allow(null).required(),
      user_profile_picture_source: Joi.any().allow(null).required(),
      user_profile_picture_last_updated: Joi.any().allow(null).required(),
      created_at: Joi.number().required(),
      updated_at: Joi.number().required()
    })
  ).required()
});

/**
 * Schema for GET /auth/users/contact_id/{contact_id} - Get user by contact ID
 * This endpoint returns fewer fields than the full user schema
 */
export const userByContactIdSchema = Joi.object({
  id: Joi.number().required(),
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  super_user: Joi.boolean().required(),
  super_admin: Joi.boolean().required(),
  can_delete_orgs: Joi.boolean().required(),
  has_linkedin_identities: Joi.boolean().required(),
  confirmed_at: Joi.number().required(),
  created_at: Joi.number().required(),
  updated_at: Joi.number().required(),
  changed_at: Joi.number().required(),
  last_sign_in_at: Joi.number().allow(null).required(),
  saml_user_id: Joi.any().allow(null).required(),
  confirmation_sent_at: Joi.any().allow(null).required(),
  password_set_at: Joi.any().allow(null).required(),
  affiliations: Joi.array().items(
    Joi.object({
      id: Joi.number().required(),
      organization_id: Joi.number().required(),
      remote_user_id: Joi.any().allow(null).required(),
      contact_id: Joi.any().allow(null).required(),
      legacy_user_id: Joi.any().allow(null).required(),
      created_at: Joi.number().required(),
      updated_at: Joi.number().required(),
      organization: Joi.object({
        id: Joi.number().required(),
        name: Joi.string().required(),
        slug: Joi.string().required(),
        sso_method: Joi.string().required()
      }).required(),
      affiliation_roles: Joi.array().items(
        Joi.object({
          id: Joi.number().required(),
          role_id: Joi.number().required(),
          creator_user_id: Joi.number().required(),
          created_at: Joi.number().required(),
          updated_at: Joi.number().required(),
          role: Joi.object({
            id: Joi.number().required(),
            remote_id: Joi.string().allow('').required(),
            organization_id: Joi.number().required(),
            name: Joi.string().required(),
            default: Joi.boolean().required(),
            can_see_private_data: Joi.boolean().required()
          }).required()
        })
      ).required()
    })
  ).required(),
  affiliation_requests: Joi.array().items(
    Joi.object({
      id: Joi.number().required(),
      data: Joi.object().required(),
      committed: Joi.boolean().required(),
      status: Joi.string().required(),
      affiliation: Joi.any().allow(null).required(),
      organization: Joi.object({
        id: Joi.number().required(),
        name: Joi.string().required(),
        slug: Joi.string().required(),
        sso_method: Joi.string().required()
      }).required(),
      created_at: Joi.number().required(),
      updated_at: Joi.number().required()
    })
  ).required(),
  affiliation_attributes: Joi.array().items(
    Joi.object({
      id: Joi.number().required(),
      affiliation_id: Joi.number().required(),
      school_division_department_id: Joi.number().required(),
      title: Joi.string().required(),
      persona: Joi.string().required(),
      seniority: Joi.any().allow(null).required(),
      user_profile_picture_url: Joi.any().allow(null).required(),
      user_profile_picture_source: Joi.any().allow(null).required(),
      user_profile_picture_last_updated: Joi.any().allow(null).required(),
      created_at: Joi.number().required(),
      updated_at: Joi.number().required()
    })
  ).required()
});

/**
 * Schema for Roles Response (GET /auth/roles)
 */
export const rolesSchema = Joi.array()
  .items(
    Joi.object({
      id: Joi.number().integer().positive().required(),
      remote_id: Joi.string().allow('').max(255).required(),
      name: Joi.string().allow(null).max(255).required(),
      organization_id: Joi.number().integer().positive().required(),
      default: Joi.boolean().allow(null).required(),
      can_see_private_data: Joi.boolean().required(),
      created_at: Joi.number().integer().positive().required(),
      updated_at: Joi.number().integer().positive().required()
    })
  )
  .min(0)
  .unique('id');

/**
 * Schema for Single Role Response (GET /auth/roles/{id})
 */
export const roleSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  remote_id: Joi.string().allow('').max(255).required(),
  name: Joi.string().allow(null).max(255).required(),
  organization_id: Joi.number().integer().positive().required(),
  default: Joi.boolean().allow(null).required(),
  can_see_private_data: Joi.boolean().required(),
  created_at: Joi.number().integer().positive().required(),
  updated_at: Joi.number().integer().positive().required()
});

/**
 * Schema for Link Token Response
 */
export const linkTokenSchema = Joi.object({
  token: Joi.string().required(),
  expires_at: Joi.number().allow(null).required(),
  application: Joi.string().allow(null).required(),
  user_id: Joi.number().allow(null).required(),
  user: Joi.object({
    id: Joi.number().required(),
    name: Joi.string().required(),
    email: Joi.string().email().required()
  }).allow(null).required()
});

/**
 * Schema for Login Management response - Session type
 * For regular session logins
 */
export const sessionLoginSchema = Joi.object({
  key: Joi.string().required(),
  type: Joi.string().valid('session').required(),
  app_name: Joi.string().required(),
  device_id: Joi.string().allow(null).required(),
  created_at: Joi.number().required(),
  updated_at: Joi.number().required(),
  expire_at: Joi.number().allow(null).required(),
  sessions: Joi.array().items(Joi.object()).required()
});

/**
 * Schema for Login Management response - Prime Token type
 * For prime token logins
 */
export const primeTokenLoginSchema = Joi.object({
  key: Joi.string().required(),
  type: Joi.string().valid('prime_token').required(),
  app_name: Joi.string().required(),
  device_id: Joi.string().allow(null).required(),
  created_at: Joi.number().required(),
  updated_at: Joi.number().required(),
  expire_at: Joi.number().allow(null).required(),
  sessions: Joi.array().items(Joi.object()).required()
});

/**
 * Schema for Login Management response - Generic login
 * For logins that may not have type field or have other types
 */
export const genericLoginSchema = Joi.object({
  key: Joi.string().required(),
  created_at: Joi.number().required(),
  updated_at: Joi.number().required()
}).unknown(true);

/**
 * Schema for array of logins
 * Accepts any of the login types
 */
export const loginsArraySchema = Joi.array().items(
  Joi.alternatives().try(
    sessionLoginSchema,
    primeTokenLoginSchema,
    genericLoginSchema
  )
);

/**
 * Schema for User Picker response (LinkedIn shared identities)
 */
export const userPickerSchema = Joi.object({
  users: Joi.array().items(
    Joi.object({
      id: Joi.number().required(),
      name: Joi.string().required(),
      email: Joi.string().email().required(),
      affiliations: Joi.array().required()
    })
  ).required(),
  message: Joi.string().allow(null).required()
});

/**
 * Schema for LIDS LinkedIn activation error response
 */
export const lidsErrorSchema = Joi.object({
  error: Joi.string().required(),
  message: Joi.string().allow(null).required(),
  details: Joi.any().allow(null).required()
});

/**
 * Schema for bulk fetch users response
 */
export const bulkFetchUsersSchema = Joi.object({
  users: Joi.array().items(
    Joi.object({
      id: Joi.number().required(),
      name: Joi.string().required(),
      email: Joi.string().email().required(),
      contact_id: Joi.number().allow(null).required(),
      affiliation_id: Joi.number().allow(null).required(),
      mfa_state: Joi.string().allow(null).required(),
      super_user: Joi.boolean().required(),
      super_admin: Joi.boolean().required(),
      can_delete_orgs: Joi.boolean().required(),
      mfa_enabled_at: Joi.number().allow(null).required(),
      confirmed_at: Joi.number().allow(null).required(),
      unconfirmed_email: Joi.string().allow(null).optional(),
      confirmation_sent_at: Joi.number().allow(null).required(),
      changed_at: Joi.number().allow(null).required(),
      created_at: Joi.number().required(),
      updated_at: Joi.number().required(),
      roles: Joi.array().items(
        Joi.object({
          id: Joi.number().required(),
          remote_id: Joi.string().allow(null).required(),
          name: Joi.string().required(),
          organization_id: Joi.number().required(),
          default: Joi.boolean().required(),
          can_see_private_data: Joi.boolean().required(),
          created_at: Joi.number().allow(null).required(),
          updated_at: Joi.number().allow(null).required()
        })
      ).required()
    })
  ).required(),
  meta: Joi.object({
    total: Joi.number().required(),
    limit: Joi.number().required(),
    count: Joi.number().required(),
    total_pages: Joi.number().required(),
    current_page: Joi.number().required(),
    next_page: Joi.number().allow(null).required(),
    prev_page: Joi.number().allow(null).required(),
    first_page: Joi.boolean().required(),
    last_page: Joi.boolean().required(),
    out_of_range: Joi.boolean().required()
  }).required()
});

/**
 * Schema for Affiliation Role Object
 */
export const affiliationRoleSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  affiliation_id: Joi.number().integer().positive().optional(),
  role_id: Joi.number().integer().positive().optional(),
  creator_user_id: Joi.number().integer().positive().allow(null).required(),
  user_id: Joi.number().integer().positive().optional(),
  created_at: Joi.number().integer().positive().required(),
  updated_at: Joi.number().integer().positive().required(),
  role: Joi.object({
    id: Joi.number().integer().positive().required(),
    remote_id: Joi.string().allow('').max(255).required(),
    organization_id: Joi.number().integer().positive().required(),
    name: Joi.string().allow(null).max(255).required(),
    default: Joi.boolean().allow(null).required(),
    can_see_private_data: Joi.boolean().required(),
    created_at: Joi.number().integer().positive().optional(),
    updated_at: Joi.number().integer().positive().optional()
  }).required()
});

/**
 * Schema for Organization in Affiliation
 */
export const affiliationOrganizationSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  name: Joi.string().max(255).required(),
  slug: Joi.string().max(255).required(),
  sso_method: Joi.string().valid('disabled', 'saml', 'oauth').required()
});

/**
 * Schema for Affiliation Object
 */
export const affiliationSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  organization_id: Joi.number().integer().positive().optional(),
  remote_user_id: Joi.string().allow(null).optional(),
  contact_id: Joi.number().integer().positive().allow(null).required(),
  legacy_user_id: Joi.number().integer().positive().allow(null).optional(),
  created_at: Joi.number().integer().positive().required(),
  updated_at: Joi.number().integer().positive().required(),
  organization: affiliationOrganizationSchema.optional(),
  affiliation_roles: Joi.array().items(affiliationRoleSchema).required()
});

/**
 * Schema for array of affiliations
 */
export const affiliationsArraySchema = Joi.array()
  .items(affiliationSchema)
  .min(0);

/**
 * Schema for Affiliation Request Object
 */
export const affiliationRequestSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  data: Joi.object().optional(),
  committed: Joi.boolean().required(),
  status: Joi.string().valid('PENDING', 'APPROVED', 'DENIED').required(),
  affiliation: affiliationSchema.allow(null).optional(),  // Only present when APPROVED
  organization: affiliationOrganizationSchema.required(),
  user: Joi.object({
    id: Joi.number().integer().positive().required(),
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    has_linkedin_identities: Joi.boolean().required(),
    saml_user_id: Joi.any().allow(null).required(),
    changed_at: Joi.number().integer().positive().required(),
    confirmed_at: Joi.number().integer().positive().required(),
    created_at: Joi.number().integer().positive().required(),
    mfa_enabled_at: Joi.any().allow(null).required(),
    updated_at: Joi.number().integer().positive().required()
  }).required(),
  moderator: Joi.object().allow(null).optional(),
  moderated_at: Joi.number().integer().positive().allow(null).required(),
  created_at: Joi.number().integer().positive().required(),
  updated_at: Joi.number().integer().positive().required()
});

/**
 * Schema for array of affiliation requests
 */
export const affiliationRequestsArraySchema = Joi.array()
  .items(affiliationRequestSchema)
  .min(0);

/**
 * Schema for Affiliation Invitation Object
 * Note: POST returns invited_by as number, GET returns inviter as object
 */
export const affiliationInvitationSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  invited_by: Joi.number().integer().positive().optional(),  // POST response
  inviter: Joi.object().optional(),  // GET response
  email: Joi.string().email().optional(),  // Not in GET response
  name: Joi.string().allow(null).required(),
  contact_id: Joi.number().integer().positive().allow(null).required(),
  role_ids: Joi.array().items(Joi.alternatives().try(
    Joi.number().integer().positive(),
    Joi.string()
  )).min(1).required(),
  affiliation_id: Joi.number().integer().positive().allow(null).optional(),  // Not always present
  application_name: Joi.string().optional(),  // POST response
  application: Joi.object().optional(),  // GET response
  organization: Joi.object().optional(),  // GET response
  status: Joi.string().optional(),  // GET response
  saml_user_id: Joi.string().allow(null).optional(),
  created_at: Joi.number().integer().positive().required(),
  updated_at: Joi.number().integer().positive().required(),
  accepted_at: Joi.number().integer().positive().allow(null).required(),
  invite_email_sent_at: Joi.number().integer().positive().allow(null).optional()  // Not always present
});

/**
 * Schema for array of affiliation invitations
 */
export const affiliationInvitationsArraySchema = Joi.array()
  .items(affiliationInvitationSchema)
  .min(0);

/**
 * Schema for School Division Department Object
 * Used by affiliation attributes to group users into departments
 * Note: GET list doesn't include created_at/updated_at, but GET by ID and POST/PATCH/PUT do
 */
export const schoolDivisionDepartmentSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  value: Joi.string().required(),
  created_at: Joi.number().integer().positive().optional(), // Only in GET by ID, POST, PATCH, PUT
  updated_at: Joi.number().integer().positive().optional(), // Only in GET by ID, POST, PATCH, PUT
  organization: Joi.object().unknown(true).required()
});

/**
 * Schema for GET /school_division_departments - List departments
 */
export const schoolDivisionDepartmentsListSchema = Joi.array()
  .items(schoolDivisionDepartmentSchema)
  .min(0);

/**
 * Schema for CSV Invite Object
 */
export const csvInviteSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  organization_id: Joi.number().integer().positive().required(),
  csv_file_name: Joi.string().required(),
  csv_content_type: Joi.string().required(),
  csv_file_size: Joi.number().integer().min(0).required(),
  created_at: Joi.string().isoDate().required(),
  updated_at: Joi.string().isoDate().required(),
  url: Joi.string().uri().required()
});

/**
 * Schema for GET /csv_invites - List all CSV invites
 */
export const csvInvitesListSchema = Joi.object({
  csv_invites: Joi.array().items(csvInviteSchema).min(0).required()
});

/**
 * Schema for GET /csv_invite/:id - Get single CSV invite
 */
export const csvInviteSingleSchema = Joi.object({
  csv_invite: csvInviteSchema.required()
});

/**
 * Schema for POST /csv_invite - Create CSV invite
 */
export const csvInviteCreateSchema = Joi.object({
  csv_invite: csvInviteSchema.required()
});

/**
 * Schema for Affiliation Attribute Object (Base)
 * Used for POST/PATCH responses - without nested affiliation object
 */
export const affiliationAttributeBaseSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  affiliation_id: Joi.number().integer().positive().required(),
  school_division_department_id: Joi.number().integer().positive().allow(null).required(),
  title: Joi.string().allow(null).required(),
  persona: Joi.string().allow(null).required(),
  seniority: Joi.string().allow(null).required(),
  user_profile_picture_url: Joi.string().uri().allow(null).required(),
  user_profile_picture_source: Joi.string().allow(null).required(),
  user_profile_picture_last_updated: Joi.string().isoDate().allow(null).required(),
  nps_score: Joi.number().integer().min(0).max(10).allow(null).required(),
  nps_score_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).allow(null).required(), // Format: YYYY-MM-DD
  created_at: Joi.string().isoDate().required(), // ISO date string for POST/PATCH
  updated_at: Joi.string().isoDate().required()  // ISO date string for POST/PATCH
});

/**
 * Schema for Affiliation Attribute Object (Full)
 * Used for GET by ID and List - includes nested affiliation and timestamps as numbers
 * Note: affiliation_id and school_division_department_id are NOT in the response
 */
export const affiliationAttributeSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  title: Joi.string().allow(null).required(),
  persona: Joi.string().allow(null).required(),
  seniority: Joi.string().allow(null).required(),
  user_profile_picture_url: Joi.string().uri().allow(null).required(),
  user_profile_picture_source: Joi.string().allow(null).required(),
  user_profile_picture_last_updated: Joi.string().isoDate().allow(null).required(),
  nps_score: Joi.number().integer().min(0).max(10).allow(null).required(),
  nps_score_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).allow(null).required(), // Format: YYYY-MM-DD
  created_at: Joi.number().integer().positive().required(), // Unix timestamp in milliseconds
  updated_at: Joi.number().integer().positive().required(), // Unix timestamp in milliseconds
  affiliation: Joi.object().unknown(true).required(),
  school_division_department: Joi.object().unknown(true).allow(null).required()
});

/**
 * Schema for GET /auth/affiliation_attributes - List affiliation attributes
 */
export const affiliationAttributesListSchema = Joi.object({
  affiliation_attributes: Joi.array().items(affiliationAttributeSchema).min(0).required()
});

/**
 * Schema for GET /auth/affiliation_attributes/:id - Get single affiliation attribute
 */
export const affiliationAttributeSingleSchema = Joi.object({
  affiliation_attribute: affiliationAttributeSchema.required()
});

/**
 * Schema for Persona Object
 */
export const personaSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  value: Joi.string().required()
});

/**
 * Schema for GET /auth/personas - List personas
 */
export const personasListSchema = Joi.array().items(personaSchema).min(0);

/**
 * Schema for Seniority Object
 */
export const senioritySchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  value: Joi.string().required()
});

/**
 * Schema for GET /auth/seniorities - List seniorities
 */
export const senioritiesListSchema = Joi.array().items(senioritySchema).min(0);
