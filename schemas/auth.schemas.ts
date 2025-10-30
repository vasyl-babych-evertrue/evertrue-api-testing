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
    affiliation_requests: Joi.array().required(),
  }).required(),
  application: Joi.object({
    id: Joi.number().required(),
    name: Joi.string().required(),
    key: Joi.string().required(),
    created_at: Joi.number().required(),
    updated_at: Joi.number().required(),
  }).required(),
  organization: Joi.object({
    id: Joi.number().required(),
    name: Joi.string().required(),
    slug: Joi.string().required(),
  })
    .allow(null)
    .required(),
});

/**
 * Base user object for session responses (minimal)
 * Used when API doesn't return first_name/last_name
 */
const sessionUserMinimalSchema = Joi.object({
  id: Joi.number().required(),
  email: Joi.string().email().required(),
}).required();

/**
 * Full user object for session responses
 * Used when API returns first_name/last_name (may be null)
 */
const sessionUserFullSchema = Joi.object({
  id: Joi.number().required(),
  email: Joi.string().email().required(),
  first_name: Joi.string().allow(null).required(),
  last_name: Joi.string().allow(null).required(),
}).required();

/**
 * Schema for POST /auth/session (create session with Basic Auth)
 * Standard session creation without Device ID
 * Note: Currently uses minimal user schema as API doesn't return first_name/last_name
 */
export const createSessionSchema = Joi.object({
  token: Joi.string().required(),
  prime_token: Joi.string().allow(null).required(),
  user: sessionUserMinimalSchema,
});

/**
 * Schema for POST /auth/session with Device ID (Prime Token flow)
 * Returns both session token and prime_token
 */
export const createSessionWithDeviceSchema = Joi.object({
  token: Joi.string().required(),
  prime_token: Joi.string().required(),
  device_id: Joi.string().required(),
  user: sessionUserMinimalSchema,
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
  user: sessionUserMinimalSchema,
});

/**
 * Schema for POST /auth/session with EvertruePrimeToken provider
 * Creates session using existing Prime Token
 */
export const createSessionFromPrimeTokenSchema = Joi.object({
  token: Joi.string().required(),
  device_id: Joi.string().required(),
  user: sessionUserMinimalSchema,
});

/**
 * Schema for POST /auth/session with EvertrueTemporaryTokenStrategy
 * Used for creating temporary scoped sessions
 */
export const createTemporarySessionSchema = Joi.object({
  token: Joi.string().required(),
  type: Joi.string().required(),
  oid: Joi.number().required(),
  expire_at: Joi.alternatives().try(Joi.number(), Joi.string()).required(),
});

/**
 * Schema for GET /auth/status
 */
export const statusSchema = Joi.object({
  status: Joi.string().required(),
});

/**
 * Schema for empty response (204 No Content)
 */
export const emptyResponseSchema = Joi.string().valid('').required();

/**
 * Schema for User Search Response (POST /auth/users/search)
 * Note: Some users may not have all fields (e.g., has_linkedin_identities, saml_user_id, last_sign_in_at)
 * This is NOT a bug - different users have different data
 */
export const userSearchSchema = Joi.object({
  total: Joi.number().required(),
  limit: Joi.number().required(),
  offset: Joi.number().required(),
  users: Joi.array()
    .items(
      Joi.object({
        // Core fields - always present
        id: Joi.number().required(),
        name: Joi.string().required(),
        email: Joi.string().required(),
        super_user: Joi.boolean().required(),
        changed_at: Joi.number().required(),
        created_at: Joi.number().required(),
        updated_at: Joi.number().required(),
        confirmed_at: Joi.alternatives().try(Joi.number(), Joi.string().allow(null)).required(),
        affiliations: Joi.array().required(),
        affiliation_requests: Joi.array().required(),
        version_created_at: Joi.alternatives().try(Joi.number(), Joi.string()).required(),
        // Optional fields - may not be present for all users
        has_linkedin_identities: Joi.boolean().optional(),
        saml_user_id: Joi.string().allow(null).optional(),
        last_sign_in_at: Joi.alternatives().try(Joi.string().isoDate(), Joi.string().allow(null)).optional(),
        mfa_enabled_at: Joi.number().allow(null).optional(),
      })
    )
    .required(),
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
  affiliations: Joi.array()
    .items(
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
          sso_method: Joi.string().allow(null).required(),
        }).required(),
        affiliation_roles: Joi.array()
          .items(
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
                can_see_private_data: Joi.boolean().required(),
              }).required(),
            })
          )
          .required(),
      })
    )
    .required(),

  affiliation_requests: Joi.array()
    .items(
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
          sso_method: Joi.string().allow(null).required(),
        }).required(),
        created_at: Joi.number().required(),
        updated_at: Joi.number().required(),
      })
    )
    .required(),

  affiliation_attributes: Joi.array()
    .items(
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
        updated_at: Joi.number().required(),
      })
    )
    .required(),
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
  affiliations: Joi.array()
    .items(
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
          sso_method: Joi.string().allow(null).required(),
        }).required(),
        affiliation_roles: Joi.array()
          .items(
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
                can_see_private_data: Joi.boolean().required(),
              }).required(),
            })
          )
          .required(),
      })
    )
    .required(),
  affiliation_requests: Joi.array()
    .items(
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
          sso_method: Joi.string().allow(null).required(),
        }).required(),
        created_at: Joi.number().required(),
        updated_at: Joi.number().required(),
      })
    )
    .required(),
  affiliation_attributes: Joi.array()
    .items(
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
        updated_at: Joi.number().required(),
      })
    )
    .required(),
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
  affiliations: Joi.array()
    .items(
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
          sso_method: Joi.string().allow(null).required(),
        }).required(),
        affiliation_roles: Joi.array()
          .items(
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
                can_see_private_data: Joi.boolean().required(),
              }).required(),
            })
          )
          .required(),
      })
    )
    .required(),
  affiliation_requests: Joi.array()
    .items(
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
          sso_method: Joi.string().allow(null).required(),
        }).required(),
        created_at: Joi.number().required(),
        updated_at: Joi.number().required(),
      })
    )
    .required(),
  affiliation_attributes: Joi.array()
    .items(
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
        updated_at: Joi.number().required(),
      })
    )
    .required(),
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
      updated_at: Joi.number().integer().positive().required(),
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
  updated_at: Joi.number().integer().positive().required(),
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
    email: Joi.string().email().required(),
  })
    .allow(null)
    .required(),
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
  sessions: Joi.array().items(Joi.object()).required(),
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
  sessions: Joi.array().items(Joi.object()).required(),
});

/**
 * Schema for Login Management response - Generic login
 * For logins that may not have type field or have other types
 */
export const genericLoginSchema = Joi.object({
  key: Joi.string().required(),
  created_at: Joi.number().required(),
  updated_at: Joi.number().required(),
}).unknown(true);

/**
 * Schema for array of logins
 * Accepts any of the login types
 */
export const loginsArraySchema = Joi.array().items(
  Joi.alternatives().try(sessionLoginSchema, primeTokenLoginSchema, genericLoginSchema)
);

/**
 * Schema for User Picker response (LinkedIn shared identities)
 */
export const userPickerSchema = Joi.object({
  users: Joi.array()
    .items(
      Joi.object({
        id: Joi.number().required(),
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        affiliations: Joi.array().required(),
      })
    )
    .required(),
  message: Joi.string().allow(null).required(),
});

/**
 * Schema for LIDS LinkedIn activation error response
 */
export const lidsErrorSchema = Joi.object({
  error: Joi.string().required(),
  message: Joi.string().allow(null).required(),
  details: Joi.any().allow(null).required(),
});

/**
 * Schema for bulk fetch users response
 * Note: unconfirmed_email may not be present for all users
 */
export const bulkFetchUsersSchema = Joi.object({
  users: Joi.array()
    .items(
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
        unconfirmed_email: Joi.string().allow(null).optional(), // May not be present
        confirmation_sent_at: Joi.number().allow(null).required(),
        changed_at: Joi.number().allow(null).required(),
        created_at: Joi.number().required(),
        updated_at: Joi.number().required(),
        roles: Joi.array()
          .items(
            Joi.object({
              id: Joi.number().required(),
              remote_id: Joi.string().allow(null).required(),
              name: Joi.string().required(),
              organization_id: Joi.number().required(),
              default: Joi.boolean().required(),
              can_see_private_data: Joi.boolean().required(),
              created_at: Joi.number().allow(null).required(),
              updated_at: Joi.number().allow(null).required(),
            })
          )
          .required(),
      })
    )
    .required(),
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
    out_of_range: Joi.boolean().required(),
  }).required(),
});

/**
 * Schema for Affiliation Role Object (GET response)
 * Used when getting user affiliations
 */
export const affiliationRoleGetSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  role_id: Joi.number().integer().positive().required(),
  creator_user_id: Joi.number().integer().positive().allow(null).required(),
  created_at: Joi.number().integer().positive().required(),
  updated_at: Joi.number().integer().positive().required(),
  role: Joi.object({
    id: Joi.number().integer().positive().required(),
    remote_id: Joi.string().allow('').max(255).required(),
    organization_id: Joi.number().integer().positive().required(),
    name: Joi.string().allow(null).max(255).required(),
    default: Joi.boolean().allow(null).required(),
    can_see_private_data: Joi.boolean().required(),
  }).required(),
});

/**
 * Schema for Affiliation Role Object (POST/PUT/PATCH response)
 * Used when creating/updating affiliations
 */
export const affiliationRoleSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  affiliation_id: Joi.number().integer().positive().required(),
  creator_user_id: Joi.number().integer().positive().allow(null).required(),
  user_id: Joi.number().integer().positive().required(),
  created_at: Joi.number().integer().positive().required(),
  updated_at: Joi.number().integer().positive().required(),
  role: Joi.object({
    id: Joi.number().integer().positive().required(),
    remote_id: Joi.string().allow('').max(255).required(),
    organization_id: Joi.number().integer().positive().required(),
    name: Joi.string().allow(null).max(255).required(),
    default: Joi.boolean().allow(null).required(),
    can_see_private_data: Joi.boolean().required(),
    created_at: Joi.number().integer().positive().required(),
    updated_at: Joi.number().integer().positive().required(),
  }).required(),
});

/**
 * Schema for Organization in Affiliation
 */
export const affiliationOrganizationSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  name: Joi.string().max(255).required(),
  slug: Joi.string().max(255).required(),
  sso_method: Joi.string().valid('disabled', 'saml', 'oauth').allow(null).required(),
});

/**
 * Schema for Affiliation Object (GET response)
 * Used when getting user affiliations
 */
export const affiliationGetSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  organization_id: Joi.number().integer().positive().required(),
  remote_user_id: Joi.any().allow(null).required(),
  contact_id: Joi.any().allow(null).required(),
  legacy_user_id: Joi.any().allow(null).required(),
  organization: affiliationOrganizationSchema.required(),
  created_at: Joi.number().integer().positive().required(),
  updated_at: Joi.number().integer().positive().required(),
  affiliation_roles: Joi.array().items(affiliationRoleGetSchema).required(),
});

/**
 * Schema for Affiliation Object (POST/PUT/PATCH response)
 * Used when creating/updating affiliations
 */
export const affiliationSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  user_id: Joi.number().integer().positive().required(),
  remote_user_id: Joi.any().allow(null).required(),
  contact_id: Joi.any().allow(null).required(),
  legacy_user_id: Joi.any().allow(null).required(),
  organization: affiliationOrganizationSchema.required(),
  created_at: Joi.number().integer().positive().required(),
  updated_at: Joi.number().integer().positive().required(),
  affiliation_roles: Joi.array().items(affiliationRoleSchema).required(),
});

/**
 * Schema for array of affiliations (GET response)
 */
export const affiliationsArraySchema = Joi.array().items(affiliationGetSchema).min(0);

/**
 * Schema for Affiliation Request Object (PENDING status)
 * Used when creating a new request or listing pending requests
 */
export const affiliationRequestPendingSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  data: Joi.object().allow(null).required(),
  committed: Joi.boolean().required(),
  status: Joi.string().valid('PENDING').required(),
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
    updated_at: Joi.number().integer().positive().required(),
  }).required(),
  moderator: Joi.any().allow(null).required(),
  moderated_at: Joi.any().allow(null).required(),
  created_at: Joi.number().integer().positive().required(),
  updated_at: Joi.number().integer().positive().required(),
});

/**
 * Schema for Affiliation Request Object (APPROVED status)
 * Used when request is approved by moderator
 */
export const affiliationRequestApprovedSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  data: Joi.object().allow(null).required(),
  committed: Joi.boolean().required(),
  status: Joi.string().valid('APPROVED').required(),
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
    updated_at: Joi.number().integer().positive().required(),
  }).required(),
  moderator: Joi.object({
    id: Joi.number().integer().positive().required(),
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    has_linkedin_identities: Joi.boolean().required(),
    saml_user_id: Joi.any().allow(null).required(),
    changed_at: Joi.number().integer().positive().required(),
    confirmed_at: Joi.number().integer().positive().required(),
    created_at: Joi.number().integer().positive().required(),
    mfa_enabled_at: Joi.any().allow(null).required(),
    updated_at: Joi.number().integer().positive().required(),
  }).required(),
  moderated_at: Joi.number().integer().positive().required(),
  affiliation: affiliationSchema.required(),
  created_at: Joi.number().integer().positive().required(),
  updated_at: Joi.number().integer().positive().required(),
});

/**
 * Schema for Affiliation Request Object (Generic)
 * For backwards compatibility - use specific schemas when possible
 */
export const affiliationRequestSchema = affiliationRequestPendingSchema;

/**
 * Schema for array of affiliation requests
 * Can contain requests with different statuses
 */
export const affiliationRequestsArraySchema = Joi.array()
  .items(Joi.alternatives().try(affiliationRequestPendingSchema, affiliationRequestApprovedSchema))
  .min(0);

/**
 * Schema for Affiliation Invitation Object (POST response)
 * Used when creating a new invitation
 */
export const affiliationInvitationPostSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  invited_by: Joi.number().integer().positive().required(),
  email: Joi.string().email().required(),
  name: Joi.string().allow(null).required(),
  contact_id: Joi.number().integer().positive().allow(null).required(),
  role_ids: Joi.array().items(Joi.string()).min(1).required(),
  affiliation_id: Joi.number().integer().positive().allow(null).required(),
  application_name: Joi.string().required(),
  saml_user_id: Joi.string().allow(null).required(),
  created_at: Joi.number().integer().positive().required(),
  updated_at: Joi.number().integer().positive().required(),
  accepted_at: Joi.number().integer().positive().allow(null).required(),
  invite_email_sent_at: Joi.number().integer().positive().allow(null).required(),
});

/**
 * Schema for Affiliation Invitation Object (GET response)
 * Used when retrieving invitation details
 */
export const affiliationInvitationGetSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  name: Joi.string().allow(null).required(),
  contact_id: Joi.number().integer().positive().allow(null).required(),
  status: Joi.string().required(),
  created_at: Joi.number().integer().positive().required(),
  updated_at: Joi.number().integer().positive().required(),
  accepted_at: Joi.number().integer().positive().allow(null).required(),
  inviter: Joi.object({
    id: Joi.number().integer().positive().required(),
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    has_linkedin_identities: Joi.boolean().required(),
    saml_user_id: Joi.string().allow(null).required(),
    changed_at: Joi.number().integer().positive().required(),
    confirmed_at: Joi.number().integer().positive().required(),
    created_at: Joi.number().integer().positive().required(),
    mfa_enabled_at: Joi.number().integer().positive().allow(null).required(),
    updated_at: Joi.number().integer().positive().required(),
  }).required(),
  application: Joi.object({
    id: Joi.number().integer().positive().required(),
    name: Joi.string().required(),
    key: Joi.string().required(),
    created_at: Joi.number().integer().positive().required(),
    updated_at: Joi.number().integer().positive().required(),
    admin_only: Joi.boolean().required(),
    super_user_id: Joi.number().integer().positive().required(),
  }).required(),
  role_ids: Joi.array().items(Joi.string()).min(1).required(),
  organization: Joi.object({
    id: Joi.number().integer().positive().required(),
    name: Joi.string().required(),
    slug: Joi.string().required(),
    sso_method: Joi.string().allow(null).required(),
    mfa_required: Joi.boolean().required(),
    created_at: Joi.number().integer().positive().required(),
    updated_at: Joi.number().integer().positive().required(),
  }).required(),
});

/**
 * Schema for Affiliation Invitation Object (Generic)
 * For backwards compatibility - use specific schemas when possible
 */
export const affiliationInvitationSchema = affiliationInvitationPostSchema;

/**
 * Schema for array of affiliation invitations (GET list)
 * List endpoint returns GET-style objects
 */
export const affiliationInvitationsArraySchema = Joi.array().items(affiliationInvitationGetSchema).min(0);

/**
 * Schema for School Division Department Object
 * Used by affiliation attributes to group users into departments
 * Note: GET list doesn't include created_at/updated_at, but GET by ID and POST/PATCH/PUT do
 */
export const schoolDivisionDepartmentSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  value: Joi.string().required(),
  created_at: Joi.number().integer().positive().optional(),
  updated_at: Joi.number().integer().positive().optional(),
  organization: Joi.object({
    id: Joi.number().integer().positive().required(),
    name: Joi.string().required(),
    slug: Joi.string().required(),
    sso_method: Joi.string().allow(null).optional(),
    mfa_required: Joi.boolean().optional(),
    created_at: Joi.number().integer().positive().optional(),
    updated_at: Joi.number().integer().positive().optional(),
  }).required(),
});

/**
 * Schema for School Division Department Object (Minimal)
 * Used in GET list - without timestamps
 */
export const schoolDivisionDepartmentMinimalSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  value: Joi.string().required(),
  organization: Joi.object({
    id: Joi.number().integer().positive().required(),
    name: Joi.string().required(),
    slug: Joi.string().required(),
  }).required(),
});

/**
 * Schema for GET /school_division_departments - List departments
 */
export const schoolDivisionDepartmentsListSchema = Joi.array().items(schoolDivisionDepartmentSchema).min(0);

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
  url: Joi.string().uri().required(),
});

/**
 * Schema for GET /csv_invites - List all CSV invites
 */
export const csvInvitesListSchema = Joi.object({
  csv_invites: Joi.array().items(csvInviteSchema).min(0).required(),
});

/**
 * Schema for GET /csv_invite/:id - Get single CSV invite
 */
export const csvInviteSingleSchema = Joi.object({
  csv_invite: csvInviteSchema.required(),
});

/**
 * Schema for POST /csv_invite - Create CSV invite
 */
export const csvInviteCreateSchema = Joi.object({
  csv_invite: csvInviteSchema.required(),
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
  nps_score_date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .allow(null)
    .required(), // Format: YYYY-MM-DD
  created_at: Joi.string().isoDate().required(), // ISO date string for POST/PATCH
  updated_at: Joi.string().isoDate().required(), // ISO date string for POST/PATCH
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
  nps_score_date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .allow(null)
    .required(), // Format: YYYY-MM-DD
  created_at: Joi.number().integer().positive().required(), // Unix timestamp in milliseconds
  updated_at: Joi.number().integer().positive().required(), // Unix timestamp in milliseconds
  affiliation: Joi.object({
    id: Joi.number().integer().positive().required(),
    user_id: Joi.number().integer().positive().required(),
    remote_user_id: Joi.string().allow(null).required(),
    contact_id: Joi.number().integer().positive().allow(null).required(),
    legacy_user_id: Joi.number().integer().positive().allow(null).required(),
    created_at: Joi.number().integer().positive().required(),
    updated_at: Joi.number().integer().positive().required(),
    organization: Joi.object({
      id: Joi.number().integer().positive().required(),
      name: Joi.string().required(),
      slug: Joi.string().required(),
      sso_method: Joi.string().allow(null).required(),
      mfa_required: Joi.boolean().required(),
      created_at: Joi.number().integer().positive().required(),
      updated_at: Joi.number().integer().positive().required(),
    }).required(),
    affiliation_roles: Joi.array()
      .items(
        Joi.object({
          id: Joi.number().integer().positive().required(),
          affiliation_id: Joi.number().integer().positive().required(),
          creator_user_id: Joi.number().integer().positive().required(),
          user_id: Joi.number().integer().positive().required(),
          created_at: Joi.number().integer().positive().required(),
          updated_at: Joi.number().integer().positive().required(),
          role: Joi.object({
            id: Joi.number().integer().positive().required(),
            remote_id: Joi.string().required(),
            name: Joi.string().required(),
            organization_id: Joi.number().integer().positive().required(),
            default: Joi.boolean().required(),
            can_see_private_data: Joi.boolean().required(),
            created_at: Joi.number().integer().positive().required(),
            updated_at: Joi.number().integer().positive().required(),
          }).required(),
        })
      )
      .required(),
  }).required(),
  school_division_department: Joi.object({
    id: Joi.number().integer().positive().required(),
    value: Joi.string().required(),
    organization: Joi.object({
      id: Joi.number().integer().positive().required(),
      name: Joi.string().required(),
      slug: Joi.string().required(),
    }).required(),
  })
    .allow(null)
    .required(),
});

/**
 * Schema for GET /auth/affiliation_attributes - List affiliation attributes
 */
export const affiliationAttributesListSchema = Joi.object({
  affiliation_attributes: Joi.array().items(affiliationAttributeSchema).min(0).required(),
});

/**
 * Schema for GET /auth/affiliation_attributes/:id - Get single affiliation attribute
 */
export const affiliationAttributeSingleSchema = Joi.object({
  affiliation_attribute: affiliationAttributeSchema.required(),
});

/**
 * Schema for Persona Object
 */
export const personaSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  value: Joi.string().required(),
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
  value: Joi.string().required(),
});

/**
 * Schema for GET /auth/seniorities - List seniorities
 */
export const senioritiesListSchema = Joi.array().items(senioritySchema).min(0);

/**
 * Schema for Application Object
 */
export const applicationSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  name: Joi.string().required(),
  key: Joi.string().required(),
  created_at: Joi.number().integer().positive().required(),
  updated_at: Joi.number().integer().positive().required(),
});

/**
 * Schema for GET /auth/applications - List all applications (super-admin only)
 */
export const applicationsListSchema = Joi.array().items(applicationSchema).min(0);

/**
 * Schema for Identity Provider Object
 */
export const identityProviderSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  name: Joi.string().required(),
  primary_domain_suffix: Joi.string().required(),
  federation_xml_url: Joi.string().uri().allow(null).required(),
  organization_id: Joi.number().integer().positive().required(),
  created_at: Joi.alternatives()
    .try(Joi.number().integer().positive(), Joi.string().isoDate(), Joi.any().allow(null))
    .required(),
  updated_at: Joi.alternatives()
    .try(Joi.number().integer().positive(), Joi.string().isoDate(), Joi.any().allow(null))
    .required(),
});

/**
 * Schema for GET /auth/identity_providers - List all identity providers
 */
export const identityProvidersListSchema = Joi.array().items(identityProviderSchema).min(0);

/**
 * Schema for POST /auth/identity_providers - Create identity provider
 * Wrapped in identity_provider object
 */
export const identityProviderCreateSchema = Joi.object({
  identity_provider: identityProviderSchema.required(),
});

/**
 * Schema for GET /auth/identity_providers/:id - Show single identity provider
 */
export const identityProviderSingleSchema = identityProviderSchema;

/**
 * Schema for Identity Provider Search Response
 * Returns organization info that matches the email domain
 * Can return either an array or an object with organizations array
 */
export const identityProviderSearchSchema = Joi.alternatives().try(
  Joi.array()
    .items(
      Joi.object({
        id: Joi.number().integer().positive().required(),
        name: Joi.string().required(),
        slug: Joi.string().required(),
        sso_method: Joi.string().valid('disabled', 'saml', 'oauth').allow(null).required(),
      })
    )
    .min(0),
  Joi.object({
    organizations: Joi.array()
      .items(
        Joi.object({
          id: Joi.number().integer().positive().required(),
          name: Joi.string().required(),
          slug: Joi.string().required(),
          sso_method: Joi.string().valid('disabled', 'saml', 'oauth').allow(null).required(),
        })
      )
      .min(0)
      .required(),
  })
);

/**
 * Schema for User Identity Object
 */
export const userIdentitySchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  user_id: Joi.number().integer().positive().required(),
  identity_provider_id: Joi.number().integer().positive().allow(null).required(),
  key: Joi.string().required(),
  created_at: Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().isoDate()).required(),
  updated_at: Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().isoDate()).required(),
});

/**
 * Schema for GET /auth/identities/unmatched - List unmatched identities
 * Returns array of identity objects
 */
export const unmatchedIdentitiesSchema = Joi.array().items(userIdentitySchema).min(0);

/**
 * Schema for GET /auth/identities/{key} - Identity lookup by key
 * Returns array of complex objects with user and affiliation data
 */
export const identityLookupSchema = Joi.array()
  .items(
    Joi.object({
      identity: Joi.object({
        id: Joi.number().integer().positive().required(),
        user_id: Joi.number().integer().positive().required(),
        identity_provider_id: Joi.number().integer().positive().allow(null).required(),
        key: Joi.string().required(),
        created_at: Joi.number().integer().positive().required(),
        updated_at: Joi.number().integer().positive().required(),
      }).required(),
      user: Joi.object().unknown(true).required(), // Complex nested structure
    })
  )
  .min(0);

/**
 * Schema for User object in registration response
 */
export const registrationUserSchema = Joi.object({
  id: Joi.number().required(),
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  super_user: Joi.boolean().required(),
  created_at: Joi.number().required(),
  updated_at: Joi.number().required(),
  affiliations: Joi.array().required(),
  affiliation_requests: Joi.array().required(),
});

/**
 * Schema for Session object in registration response WITHOUT Device-ID
 * When no Device-ID is provided, prime_token field is not returned
 */
export const registrationSessionWithoutDeviceSchema = Joi.object({
  expire_at: Joi.number().required(),
  token: Joi.string().required(),
  created_at: Joi.number().required(),
  updated_at: Joi.number().required(),
});

/**
 * Schema for Session object in registration response WITH Device-ID
 * When Device-ID is provided, prime_token is included
 */
export const registrationSessionWithDeviceSchema = Joi.object({
  expire_at: Joi.number().required(),
  prime_token: Joi.string().required(),
  token: Joi.string().required(),
  created_at: Joi.number().required(),
  updated_at: Joi.number().required(),
});

/**
 * Schema for POST /auth/registrations - User Registration WITHOUT Device-ID
 * Returns user and session objects (no prime_token)
 */
export const registrationSchema = Joi.object({
  user: registrationUserSchema.required(),
  session: registrationSessionWithoutDeviceSchema.required(),
});

/**
 * Schema for POST /auth/registrations with Device-ID
 * Session includes prime_token
 */
export const registrationWithDeviceSchema = Joi.object({
  user: registrationUserSchema.required(),
  session: Joi.object({
    expire_at: Joi.number().required(),
    prime_token: Joi.string().required(),
    token: Joi.string().required(),
    created_at: Joi.number().required(),
    updated_at: Joi.number().required(),
  }).required(),
});

/**
 * Schema for POST /auth/registrations/password - Request password reset
 * Response includes only a message (for security - prevents email enumeration)
 */
export const passwordResetRequestSchema = Joi.object({
  message: Joi.string().required(),
});

/**
 * Schema for GET /users/password/policy - Get password policy
 * Returns most restrictive policy if user belongs to multiple orgs
 */
export const passwordPolicySchema = Joi.object({
  email: Joi.string().email().required(),
  display_text: Joi.string().required(),
  password_policy: Joi.object({
    min_length: Joi.number().integer().positive().required(),
    max_length: Joi.number().integer().positive().required(),
  }).required(),
});

/**
 * Schema for restriction object
 */
export const restrictionSchema = Joi.object({
  id: Joi.number().required(),
  organization_id: Joi.number().required(),
  application_id: Joi.number().required(),
  type: Joi.string().required(),
  identity_provider_id: Joi.number().required(),
  created_at: Joi.number().required(),
  updated_at: Joi.number().required(),
});

/**
 * Schema for GET /auth/restrictions - Get all restrictions
 */
export const restrictionsArraySchema = Joi.array().items(restrictionSchema).required();

/**
 * Schema for integration authentication object
 */
const integrationAuthenticationSchema = Joi.object({
  refresh_token: Joi.string().required(),
  refresh_token_expires_on: Joi.number().required(),
  access_token: Joi.string().required(),
  access_token_expires_on: Joi.number().required(),
  user_id: Joi.string().required(),
  email: Joi.string().email().required(),
});

/**
 * Schema for integration object
 */
export const integrationSchema = Joi.object({
  id: Joi.number().required(),
  organization_id: Joi.number().required(),
  platform: Joi.string().required(),
  account_id: Joi.any().allow(null).required(),
  authentication: integrationAuthenticationSchema.required(),
  created_at: Joi.number().required(),
  updated_at: Joi.number().required(),
});

/**
 * Schema for GET /auth/integrations - Get all integrations
 */
export const integrationsArraySchema = Joi.array().items(integrationSchema).required();

/**
 * Schema for manager object
 */
export const managerSchema = Joi.object({
  id: Joi.number().required(),
  employee_id: Joi.number().required(),
  manager_id: Joi.number().required(),
  created_at: Joi.number().required(),
  updated_at: Joi.number().required(),
});

/**
 * Schema for GET /auth/managers - Get all managers
 */
export const managersArraySchema = Joi.array().items(managerSchema).required();

/**
 * Schema for version object
 */
export const versionSchema = Joi.object({
  id: Joi.number().required(),
  item_type: Joi.string().required(),
  item_id: Joi.number().required(),
  event: Joi.string().required(),
  whodunnit: Joi.string().allow(null).required(),
  app: Joi.any().allow(null).required(),
  oid: Joi.number().allow(null).required(),
  user_affected: Joi.number().allow(null).required(),
  user_agent: Joi.string().allow(null).required(),
  object_before: Joi.any().allow(null).required(),
  object_changes: Joi.any().allow(null).required(),
});

/**
 * Schema for GET /auth/versions - Get all versions (returns object with versions array)
 */
export const versionsResponseSchema = Joi.object({
  versions: Joi.array().items(versionSchema).required(),
});
