import { test, expect } from '../../fixtures/global-api-tracking.fixture';
import { config } from '../../config/env.config';
import { expectSchema } from '../../helpers/schema-validator';
import { contactsSearchResponseSchema, contactNoteSearchResponseSchema } from '../../schemas/search.schemas';

// Search API - Positive Flow (mirrors Postman collection requests)

test.describe('Search API - Positive Flow', () => {
  const OID = '463';
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    const resp = await request.post('/auth/session', {
      headers: {
        'Application-Key': config.headers.applicationKey,
        'Authorization-Provider': config.headers.authorizationProvider,
        'Authorization': `Basic ${config.auth.superAdminToken}`,
      },
    });
    expect(resp.status()).toBe(201);
    const body = await resp.json();
    authToken = body.token;
  });

  // 1. Single Field Query
  test('Single Field Query', async ({ request }) => {
    const payload = { must: [{ name_last: { match: 'Davis' } }] };
    const response = await request.post('/search/v2/contacts/search', {
      params: { oid: OID, auth: authToken, app_key: config.headers.applicationKey },
      data: payload,
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expectSchema(data, contactsSearchResponseSchema);
  });

  // 2. Multiple Single Field Queries (AND)
  test('Multiple Single Field Queries (AND)', async ({ request }) => {
    const payload = { must: [{ name_last: { match: 'Morris' } }, { name_first: { match: 'Kerry' } }] };
    const response = await request.post('/search/v2/contacts/search', {
      params: { oid: OID, auth: authToken, app_key: config.headers.applicationKey, 'must[]': 'name_first,name_nick:in:Kerry,Morris' },
      data: payload,
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expectSchema(data, contactsSearchResponseSchema);
  });

  // 3. Multifield OR query
  test("Multifield 'OR' query with arbitrary terms matching", async ({ request }) => {
    const payload = { must: [{ name_first: { in: ['Amanda', 'Harrison'] }, name_nick: { in: ['Amanda', 'Harrison'] } }] };
    const response = await request.post('/search/v2/contacts/search', {
      params: { oid: OID, auth: authToken, app_key: config.headers.applicationKey, 'must[]': 'name_first,name_nick:in:Amanda,Harrison' },
      data: payload,
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expectSchema(data, contactsSearchResponseSchema);
  });

  // 4. Single field with OR
  test("Single field with 'OR'", async ({ request }) => {
    const payload = { must: [{ 'addresses.city': { in: ['Lopezstad'] } }] };
    const response = await request.post('/search/v2/contacts/search', {
      params: { oid: OID, auth: authToken, app_key: config.headers.applicationKey, 'must[]': 'addresses.city:in:Lopezstad' },
      data: payload,
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expectSchema(data, contactsSearchResponseSchema);
  });

  // 5. Single field with comparators
  test('Single field with comparators', async ({ request }) => {
    const payload = { must: [{ 'educations.year': { gte: 2005, lte: 2010 } }] };
    const response = await request.post('/search/v2/contacts/search', {
      params: { oid: OID, auth: authToken, app_key: config.headers.applicationKey, 'must[]': 'educations.year:gte:2005:lte:2010' },
      data: payload,
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expectSchema(data, contactsSearchResponseSchema);
  });

  // 6. Relative Date Range Queries
  test('Relative Date Range Queries', async ({ request }) => {
    const payload = { must: [{ 'giving.largest_gift_date': { gte: 'now-15y' } }] };
    const response = await request.post('/search/v2/contacts/search', {
      params: { oid: '158', auth: authToken, app_key: config.headers.applicationKey },
      data: payload,
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expectSchema(data, contactsSearchResponseSchema);
  });

  // 7. Range Comparators with coerce value
  test('Range Comparators with coerce value', async ({ request }) => {
    const payload = { must: [{ 'educations.year': { lte: 2010, coerce: 0 } }] };
    const response = await request.post('/contacts/v2/search', {
      params: { oid: OID, auth: authToken, app_key: config.headers.applicationKey, 'must[]': 'educations.year:lte:2010:coerce' },
      data: payload,
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expectSchema(data, contactsSearchResponseSchema);
  });

  // 8. Geo Box
  test('Geo Box', async ({ request }) => {
    const payload = {
      must: [
        {
          addresses: {
            instance: {
              type: { in: ['Home', 'Other'] },
              location: { north: '38.85891', south: '35.13109', east: '-91.37793', west: '-95.48132' },
            },
          },
        },
      ],
      sort: [],
    };
    const response = await request.post('/contacts/v2/search', {
      params: { oid: OID, auth: authToken, app_key: config.headers.applicationKey },
      data: payload,
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expectSchema(data, contactsSearchResponseSchema);
  });

  // 9. Geo Distance
  test('Geo Distance', async ({ request }) => {
    const payload = {
      must: [
        { year: { gte: '1950', lte: '2025' } },
        { addresses: { instance: { location: { north: '43.95421', south: '29.02848', east: '-76.36652', west: '-92.78010' } } } },
      ],
      geo_cluster: [{ field: 'addresses.location', precision: 3 }],
    };
    const response = await request.post('/search/v2/contacts/search', {
      params: { oid: OID, auth: authToken, app_key: config.headers.applicationKey },
      data: payload,
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expectSchema(data, contactsSearchResponseSchema);
  });

  // 10. Geo Box Clustering for maps
  test('Geo Box Clustering for maps', async ({ request }) => {
    const payload = {
      must: [
        { year: { gte: '1950', lte: '2025' } },
        { 'addresses.location': { east: -72.12475430220366, west: -89.99000005424023, north: 44.064245419576764, south: 29.849999947473407 } },
      ],
    };
    const response = await request.post('/contacts/v2/search', {
      params: { oid: OID, auth: authToken, app_key: config.headers.applicationKey },
      data: payload,
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expectSchema(data, contactsSearchResponseSchema);
  });

  // 11. GeoCode and Bounding Box for LI locations
  test('GeoCode and Bounding Box for LI locations', async ({ request }) => {
    const payload = { linkedin_location_names: ['Greater Boston Area', 'Washington D.C. Metro Area'] };
    const response = await request.post('/search/v2/contacts/search', {
      params: { oid: OID, auth: authToken, app_key: config.headers.applicationKey },
      data: payload,
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expectSchema(data, contactsSearchResponseSchema);
  });

  // 12. Testing for field existence
  test('Testing for field existence', async ({ request }) => {
    const payload = { must: [{ deceased: { exists: true } }] };
    const response = await request.post('/search/v2/contacts/search', {
      params: { oid: OID, auth: authToken, app_key: config.headers.applicationKey },
      data: payload,
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expectSchema(data, contactsSearchResponseSchema);
  });

  // 13. Testing for non-existence field
  test('Testing for non-existence field', async ({ request }) => {
    const payload = { must: [{ 'giving.assignee': { exists: false } }] };
    const response = await request.post('/search/v2/contacts/search', {
      params: { oid: OID, auth: authToken, app_key: config.headers.applicationKey },
      data: payload,
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expectSchema(data, contactsSearchResponseSchema);
  });

  // 14. Multifield with multiple optionalities
  test('Multifield with multiple optionalities', async ({ request }) => {
    const payload = {
      must: [
        { 'addresses.location': { lat: 64.33732499999999, lon: -149.198445, radius: '50mi' } },
        { name_prefix: { match: 'Ms.' } },
        { name_first: { match: 'Amanda' } },
      ],
      sort: [],
      should: [],
      must_not: [{ year: { gt: 1959 } }],
    };
    const response = await request.post('/search/v2/contacts/search', {
      params: { oid: OID, auth: authToken, app_key: config.headers.applicationKey },
      data: payload,
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expectSchema(data, contactsSearchResponseSchema);
  });

  // 15. Sorting
  test('Sorting', async ({ request }) => {
    const payload = {
      must: [],
      sort: [
        { 'giving_annual_donations.amount': { operation: 'avg', order: 'desc' } },
        { 'facebook.like_count': { order: 'asc', missing: '_first' } },
        { 'addresses.location': { lat: 12.34, lon: 56.78, operation: 'min', order: 'desc' } },
      ],
    };
    const response = await request.post('/search/v2/contacts/search', {
      params: { oid: OID, auth: authToken, app_key: config.headers.applicationKey, 'sort[]': 'giving_annual_donations.amount:avg:asc' },
      data: payload,
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expectSchema(data, contactsSearchResponseSchema);
  });

  // 16. Sorting Copy (score sort)
  test('Sorting Copy', async ({ request }) => {
    const payload = {
      query: {
        has_child: {
          type: 'social',
          score_mode: 'max',
          query: { range: { 'engagement.created_at': { gte: 'now-4M' } } },
        },
      },
      sort: [{ _score: { order: 'desc' } }],
    };
    const response = await request.post('/search/v2/contacts/search', {
      params: { oid: OID, auth: authToken, app_key: config.headers.applicationKey, 'must[]': '…', 'sort[]': 'giving_annual_donations.amount:avg:asc' },
      data: payload,
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expectSchema(data, contactsSearchResponseSchema);
  });

  // 17. Find documents similar to other(s)
  test('Find documents similar to other(s)', async ({ request }) => {
    const payload = { like: [321, 456] };
    const response = await request.post('/search/v2/contacts/search/search', {
      params: { oid: OID, auth: authToken, app_key: config.headers.applicationKey, 'like[]': ['123', '456'] as any },
      data: payload,
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expectSchema(data, contactsSearchResponseSchema);
  });

  // 18. Nested field, matching against a single instance
  test('Nested field, matching against a single instance', async ({ request }) => {
    const payload = { must: [{ giving_annual_donations: { instance: { fiscal_year: { match: 2017 }, amount: { gt: 0 } } } }] };
    const response = await request.post('/search/v2/contacts/search', {
      params: { oid: OID, auth: authToken, app_key: config.headers.applicationKey, 'must[]': 'giving_annual_donations.(fiscal_year:2014;amount:gt:0)' },
      data: payload,
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expectSchema(data, contactsSearchResponseSchema);
  });

  // 19. Stats & Bucketing
  test('Stats & Bucketing', async ({ request }) => {
    const payload = { stats: [{ 'giving.lifetime_amount': { bucket_by: 'linkedin_positions.company_name.untouched', include_percentiles: true, shardSize: 1000, size: 100 } }] };
    const response = await request.post('/search/v2/contacts/search', {
      params: { oid: OID, auth: authToken, app_key: config.headers.applicationKey, 'stats[]': 'giving.lifetime_amount:group_by:linkedin_positions.company_name.untouched' },
      data: payload,
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expectSchema(data, contactsSearchResponseSchema);
  });

  // 20. Querying Child Documents
  test('Querying Child Documents', async ({ request }) => {
    const payload = {
      must: [{ 'giving.lifetime_amount': { gte: 0, lte: 30000 } }],
      has_child: [{ type: 'social', query: { must: [{ 'engagement.compound_id': { match: 'facebook-693111801_like_8497127539_421309307539' } }] } }],
    } as any;
    const response = await request.post('/search/v2/contacts/search', {
      params: { oid: OID, auth: authToken, app_key: config.headers.applicationKey },
      data: payload,
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expectSchema(data, contactsSearchResponseSchema);
  });

  // 21. Querying Parent Documents
  test('Querying Parent Documents', async ({ request }) => {
    const payload = {
      query: {
        bool: {
          must: [
            { range: { 'engagement.created_at': { gte: 'now-4M' } } },
            { has_parent: { parent_type: 'contact', query: { bool: { must: [{ range: { 'giving.lifetime_amount': { gte: 10, lte: 50 } } }] } } } },
          ],
        },
      },
    };
    const response = await request.post('/search/v2/contacts/search', {
      params: { oid: OID, auth: authToken, app_key: config.headers.applicationKey },
      data: payload,
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expectSchema(data, contactsSearchResponseSchema);
  });

  // 22. Wildcard Search
  test('Wildcard Search', async ({ request }) => {
    const payload = { must: [{ name_last: { wildcard: 'Blai*' } }] };
    const response = await request.post('/contacts/v2/search', {
      params: { oid: OID, auth: authToken, app_key: config.headers.applicationKey },
      data: payload,
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expectSchema(data, contactsSearchResponseSchema);
  });

  // 23. Scrolling
  test('Scrolling', async ({ request }) => {
    const payload = {
      must: [
        {
          name_first: { multi_match: 'eric los' },
          name_last: { multi_match: 'eric los' },
          name_middle: { multi_match: 'eric los' },
          name_nick: { multi_match: 'eric los' },
          name_maiden: { multi_match: 'eric los' },
        },
      ],
    };
    const response = await request.post('/search/v2/contacts/search', {
      params: { scroll: 'true', limit: '5', oid: OID, auth: authToken, app_key: config.headers.applicationKey },
      data: payload,
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expectSchema(data, contactsSearchResponseSchema);
  });

  // 24. Scrolling by ID
  test('Scrolling by ID', async ({ request }) => {
    const payload = { scroll_id: '5:cXVlcnlBbmRGZXRjaDsxOzEwMzk0MDQ3MTc6VnFjTmx2QlRRN09tZVVhTFpJbnJDQTswOw==' };
    const response = await request.post('/search/v2/contacts/search', {
      params: { scroll: 'true', limit: '5', oid: OID, auth: authToken, app_key: config.headers.applicationKey },
      data: payload,
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expectSchema(data, contactsSearchResponseSchema);
  });

  // 25. Highlighting (contact notes)
  test('Highlighting', async ({ request }) => {
    const payload = {
      must: [{ text: { match: 'test' } }],
      highlight: { fields: { text: { pre_tags: ['<i>'], post_tags: ['</i>'] } } },
    };
    const response = await request.post('/search/v2/contact_note/search', {
      params: { oid: OID, auth: authToken, app_key: config.headers.applicationKey },
      data: payload,
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expectSchema(data, contactNoteSearchResponseSchema);
  });
});
