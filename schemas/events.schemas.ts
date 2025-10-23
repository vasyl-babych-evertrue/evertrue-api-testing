/**
 * Joi schemas for Events API
 * Contains validation schemas for all event-related requests and responses
 */

import Joi from 'joi';

/**
 * Schema for location object
 */
export const locationSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  remote_id: Joi.string().allow(null),
  source: Joi.string().allow(null),
  name: Joi.string().allow(null),
  city: Joi.string().allow(null, '').required(),
  country: Joi.string().allow(null, '').required(),
  state: Joi.string().allow(null, '').required(),
  street: Joi.string().allow(null, '').required(),
  zip: Joi.string().allow(null, '').required(),
  created_at: Joi.number().integer().allow(null),
  updated_at: Joi.number().integer().allow(null),
  latitude: Joi.number().allow(null).required(),
  longitude: Joi.number().allow(null).required()
});

/**
 * Schema for event object
 */
export const eventSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  oid: Joi.number().integer().positive().required(),
  name: Joi.string().required(),
  description: Joi.string().allow(null, '').required(),
  locationId: Joi.number().integer().positive().allow(null),
  locationName: Joi.string().allow(null),
  startTime: Joi.number().integer().required(),
  endTime: Joi.number().integer().required(),
  source: Joi.string().required(),
  remoteId: Joi.string().allow(null, '').required(),
  payload: Joi.object().required(),
  createdAt: Joi.number().integer().required(),
  updatedAt: Joi.number().integer().required(),
  location: locationSchema.allow(null)
});

/**
 * Schema for creating a new event
 */
export const createEventSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow(null, '').required(),
  startTime: Joi.number().integer().required(),
  endTime: Joi.number().integer().required(),
  location: Joi.object({
    name: Joi.string().required(),
    city: Joi.string().required(),
    country: Joi.string().required(),
    state: Joi.string().required(),
    street: Joi.string().required(),
    zip: Joi.string().required(),
    latitude: Joi.number().required(),
    longitude: Joi.number().required()
  }),
  remoteId: Joi.string().optional()
});

/**
 * Schema for Facebook event creation
 */
export const facebookEventSchema = Joi.object({
  id: Joi.string().required(),
  start_time: Joi.string().isoDate().required(),
  end_time: Joi.string().isoDate().required(),
  name: Joi.string().required(),
  description: Joi.string().required(),
  place: Joi.object({
    name: Joi.string().required(),
    location: Joi.object({
      city: Joi.string().required(),
      country: Joi.string().required(),
      state: Joi.string().required(),
      street: Joi.string().required(),
      zip: Joi.string().required(),
      latitude: Joi.number().required(),
      longitude: Joi.number().required()
    }).required(),
    id: Joi.string().required()
  }).required()
});

/**
 * Schema for Eventbrite venue
 */
export const eventbriteVenueSchema = Joi.object({
  name: Joi.string().required(),
  address: Joi.object({
    address_1: Joi.string().required(),
    city: Joi.string().required(),
    region: Joi.string().required(),
    country: Joi.string().required(),
    latitude: Joi.string().required(),
    longitude: Joi.string().required()
  }).required()
});
/**
 * Schema for Eventbrite event
 */
export const eventbriteEventSchema = Joi.object({
  id: Joi.string().required(),
  name: Joi.object({ text: Joi.string().required() }).required(),
  description: Joi.object({ text: Joi.string().required() }).required(),
  start: Joi.object({ timezone: Joi.string().required(), utc: Joi.string().required() }).required(),
  end: Joi.object({ timezone: Joi.string().required(), utc: Joi.string().required() }).required(),
  venue_id: Joi.string().required(),
  logo: Joi.object({ id: Joi.string().required(), url: Joi.string().uri().required() }).required(),
  status: Joi.string().required()
});
/**
 * Schema for event engagement
 */
export const eventEngagementSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  oid: Joi.number().integer().positive().required(),
  name: Joi.string().required(),
  contactId: Joi.number().integer().positive().required(),
  eventId: Joi.number().integer().positive().required(),
  engagementAction: Joi.string().required(),
  engagedAt: Joi.number().integer().required(),
  createdAt: Joi.number().integer().required(),
  updatedAt: Joi.number().integer().required()
});

/**
 * Schema for paginated list of events
 */
export const paginatedEventsSchema = Joi.object({
  limit: Joi.number().integer().min(1).required(),
  offset: Joi.number().integer().min(0).required(),
  total: Joi.number().integer().min(0).required(),
  items: Joi.array().items(eventSchema).required()
});

/**
 * Schema for paginated list of event engagements
 */
export const paginatedEngagementsSchema = Joi.object({
  limit: Joi.number().integer().min(1).required(),
  offset: Joi.number().integer().min(0).required(),
  total: Joi.number().integer().min(0).required(),
  items: Joi.array().items(eventEngagementSchema).required()
});

/**
 * Schema for eventbrite profile
 */
export const eventbriteProfileSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  oid: Joi.number().integer().positive().required(),
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  contact_id: Joi.number().integer().positive().required(),
  match_status: Joi.string().valid('MATCHED', 'MATCH_QUEUED').required(),
  engaged_at: Joi.string().isoDate().required(),
  createdAt: Joi.number().integer().required(),
  updatedAt: Joi.number().integer().required()
});

/**
 * Schema for paginated list of eventbrite profiles
 */
export const paginatedEventbriteProfilesSchema = Joi.object({
  limit: Joi.number().integer().min(1).required(),
  offset: Joi.number().integer().min(0).required(),
  total: Joi.number().integer().min(0).required(),
  items: Joi.array().items(eventbriteProfileSchema).required()
});

/**
 * Schema for eventbrite attendee
 */
export const eventbriteAttendeeSchema = Joi.object({
  id: Joi.string().required(),
  profile: Joi.object({
    email: Joi.string().email().required(),
    name: Joi.string().required()
  }).required(),
  status: Joi.string().required(),
  event_id: Joi.string().required()
});

// Full event response schema (Postman example: create event)
export const createEventFullResponseSchema = Joi.object({
  id: Joi.number().required(),
  oid: Joi.number().required(),
  name: Joi.string().required(),
  description: Joi.string().allow('', null),
  locationId: Joi.number().required(),
  locationName: Joi.any().allow(null, ''),
  pageId: Joi.number().allow(0, null),
  pageRemoteId: Joi.any().allow(null, ''),
  startTime: Joi.number().required(),
  endTime: Joi.number().required(),
  source: Joi.string().required(),
  remoteId: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
  coverPhotoUrl: Joi.any().allow(null, ''),
  pictureUrl: Joi.any().allow(null, ''),
  payload: Joi.object().required(),
  createdAt: Joi.number().required(),
  updatedAt: Joi.number().required(),
  location: Joi.object({
    id: Joi.number().required(),
    remote_id: Joi.any().allow(null),
    source: Joi.string().required(),
    name: Joi.any().allow(null, ''),
    city: Joi.string().required(),
    country: Joi.string().required(),
    state: Joi.string().required(),
    street: Joi.string().required(),
    zip: Joi.string().required(),
    created_at: Joi.number().required(),
    updated_at: Joi.number().required(),
    latitude: Joi.number().required(),
    longitude: Joi.number().required(),
  }).required(),
  engagements: Joi.any().allow(null),
  startTimeZone: Joi.string().allow('UTC', null, ''),
  endTimeZone: Joi.string().allow('UTC', null, ''),
});

/**
 * Additional schemas for Event Engagement API
 */
export const singleEngagementResponseSchema = eventEngagementSchema;

// Postman collections for posting engagements do not define a strict response schema.
// We keep them permissive but typed as objects to allow validation and future tightening.
export const postFacebookEngagementsResponseSchema = Joi.alternatives().try(Joi.object(), Joi.array());
export const postEventbriteEngagementsResponseSchema = Joi.alternatives().try(Joi.object(), Joi.array());
export const postEventbriteEngagementsByRemoteIdResponseSchema = Joi.alternatives().try(Joi.object(), Joi.array());
export const getEventEngagementsResponseSchema = paginatedEngagementsSchema;

// Delete engagement responses and profile engagements
export const deleteEngagementResponseSchema = Joi.alternatives().try(Joi.object(), Joi.array());
export const getEventbriteProfileEngagementsResponseSchema = Joi.alternatives().try(Joi.object(), Joi.array());

// Eventbrite Profiles specific schemas
export const createEventbriteProfileResponseSchema = Joi.object(); // observed API returns object with variable fields
export const getEventbriteProfilesResponseSchema = paginatedEventbriteProfilesSchema; // paginated list
export const eventbriteMatchedContactIdsResponseSchema = Joi.alternatives().try(Joi.object(), Joi.array());
export const eventbriteMatchedContactIdByEventResponseSchema = Joi.alternatives().try(Joi.object(), Joi.array(), Joi.string(), Joi.number(), Joi.any());
export const getEventbriteProfileResponseSchema = Joi.object();
export const getEventbriteProfileByEmailResponseSchema = Joi.object();

// Manual matching responses
export const manualMatchResponseSchema = Joi.alternatives().try(Joi.object(), Joi.array());
export const manualUnmatchResponseSchema = Joi.alternatives().try(Joi.object(), Joi.array());

// Eventbrite OAuth related schemas
export const oauth2TokenResponseSchema = Joi.object();
export const getUsersResponseSchema = Joi.alternatives().try(Joi.object(), Joi.array());
export const eventbriteReportResponseSchema = Joi.array().items(
  Joi.object({
    oid: Joi.number().required(),
    email: Joi.string().email().required(),
    event_count: Joi.number().required(),
    eng_count: Joi.number().required(),
    matched_count: Joi.number().required(),
  })
);

export default {
  locationSchema,
  eventSchema,
  createEventSchema,
  facebookEventSchema,
  eventbriteVenueSchema,
  eventbriteEventSchema,
  createEventFullResponseSchema,
  eventEngagementSchema,
  paginatedEventsSchema,
  paginatedEngagementsSchema,
  eventbriteProfileSchema,
  paginatedEventbriteProfilesSchema,
  eventbriteAttendeeSchema,
  singleEngagementResponseSchema,
  postFacebookEngagementsResponseSchema,
  postEventbriteEngagementsResponseSchema,
  postEventbriteEngagementsByRemoteIdResponseSchema,
  getEventEngagementsResponseSchema,
  deleteEngagementResponseSchema,
  getEventbriteProfileEngagementsResponseSchema,
  createEventbriteProfileResponseSchema,
  getEventbriteProfilesResponseSchema,
  eventbriteMatchedContactIdsResponseSchema,
  eventbriteMatchedContactIdByEventResponseSchema,
  getEventbriteProfileResponseSchema,
  getEventbriteProfileByEmailResponseSchema,
  manualMatchResponseSchema,
  manualUnmatchResponseSchema,
  oauth2TokenResponseSchema,
  getUsersResponseSchema,
  eventbriteReportResponseSchema
};
