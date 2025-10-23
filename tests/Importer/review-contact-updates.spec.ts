import { test, expect } from '@playwright/test';
import { config } from '../../config/env.config';
import { expectSchema } from '../../helpers/schema-validator';
import {
  contactDataSearchSchema,
  exportApprovedSuggestionsSchema,
} from '../../schemas/suggestions.schemas';

/**
 * Review Contact Updates Tests
 * 
 * This file contains tests for reviewing and exporting contact data updates
 * through the Suggestions API.
 * 
 * Test User: Super Admin (vasyl.babych@evertrue.com)
 */

test.describe('Review Contact Updates', () => {
  let authToken: string;
  const testOrgId = 463; // Swan organization

  test.beforeAll(async ({ request }) => {
    // Create session with Super Admin credentials
    const response = await request.post('/auth/session', {
      headers: {
        'Application-Key': config.headers.applicationKey,
        'Authorization-Provider': config.headers.authorizationProvider,
        'Authorization': `Basic ${config.auth.superAdminToken}`,
      },
    });

    const body = await response.json();
    authToken = body.token;
    console.log('✓ Authentication successful');
  });

  test('POST /suggestions/v1/submissions/search - Review Contact Data Updates', async ({ request }) => {
    const searchQuery = {
      has_child: [
        {
          type: 'suggestion',
          query: {
            must: [
              {
                is_approved: {
                  exists: false
                }
              }
            ]
          }
        }
      ],
      must: [],
      sort: [
        {
          created_at: {
            order: 'asc'
          }
        }
      ]
    };

    const response = await request.post(
      `/suggestions/v1/submissions/search?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}&limit=10&offset=0`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        data: searchQuery
      }
    );

    console.log('Search Response Status:', response.status());

    if (response.status() !== 200) {
      const errorBody = await response.text();
      console.log('Search Error Response:', errorBody);
    }

    expect(response.status()).toBe(200);

    const body = await response.json();
    console.log('Contact Data Search Response:', JSON.stringify({
      total: body.total,
      limit: body.limit,
      offset: body.offset,
      items_count: body.items?.length || 0
    }, null, 2));

    // Validate response schema
    expectSchema(body, contactDataSearchSchema);

    // Validate response structure
    expect(body).toHaveProperty('total');
    expect(body).toHaveProperty('items');
    expect(Array.isArray(body.items)).toBe(true);
    expect(typeof body.total).toBe('number');

    // Log sample data if available
    if (body.items && body.items.length > 0) {
      console.log('\nFirst submission:', JSON.stringify(body.items[0], null, 2));
      
      // Validate that unapproved suggestions exist
      const hasUnapprovedSuggestions = body.items.some((submission: any) => {
        return submission.suggestions?.some((suggestion: any) => 
          suggestion.is_approved === undefined || suggestion.is_approved === false
        );
      });
      
      if (hasUnapprovedSuggestions) {
        console.log('✓ Found unapproved suggestions');
      } else {
        console.log('⚠ No unapproved suggestions found (this is OK if all are reviewed)');
      }
    } else {
      console.log('⚠ No submissions found (this is OK if no pending updates)');
    }
  });

  test('POST /suggestions/v1/submissions/search - Search with different filters', async ({ request }) => {
    // Search for approved suggestions from last week
    const searchQuery = {
      must: [
        {
          is_approved: {
            match: true
          }
        },
        {
          updated_at: {
            gte: 'now-1w'
          }
        }
      ],
      sort: [
        {
          updated_at: {
            order: 'desc'
          }
        }
      ]
    };

    const response = await request.post(
      `/suggestions/v1/submissions/search?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}&limit=5&offset=0`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        data: searchQuery
      }
    );

    expect(response.status()).toBe(200);

    const body = await response.json();
    console.log('\nApproved Suggestions (last week):', JSON.stringify({
      total: body.total,
      items_count: body.items?.length || 0
    }, null, 2));

    // Validate response schema
    expectSchema(body, contactDataSearchSchema);

    // Validate pagination
    expect(body.items.length).toBeLessThanOrEqual(5);
  });

  test('POST /suggestions/v1/submissions/search - Pagination test', async ({ request }) => {
    const searchQuery = {
      must: [],
      sort: [
        {
          created_at: {
            order: 'desc'
          }
        }
      ]
    };

    // Get first page
    const response1 = await request.post(
      `/suggestions/v1/submissions/search?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}&limit=5&offset=0`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        data: searchQuery
      }
    );

    expect(response1.status()).toBe(200);
    const body1 = await response1.json();

    // Get second page
    const response2 = await request.post(
      `/suggestions/v1/submissions/search?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}&limit=5&offset=5`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        data: searchQuery
      }
    );

    expect(response2.status()).toBe(200);
    const body2 = await response2.json();

    console.log('\nPagination Test:');
    console.log(`  Page 1: ${body1.items?.length || 0} items`);
    console.log(`  Page 2: ${body2.items?.length || 0} items`);
    console.log(`  Total: ${body1.total}`);

    // Validate both pages have same total
    expect(body1.total).toBe(body2.total);

    // Validate items are different (if enough data exists)
    if (body1.items?.length > 0 && body2.items?.length > 0) {
      const firstPageIds = body1.items.map((item: any) => item.id);
      const secondPageIds = body2.items.map((item: any) => item.id);
      
      // Check that pages don't overlap
      const overlap = firstPageIds.some((id: string) => secondPageIds.includes(id));
      expect(overlap).toBe(false);
    }
  });

  test('POST /exporter/v1/submit/suggestion - Export Approved Suggestions', async ({ request }) => {
    const exportRequest = {
      name: 'approved_suggestions',
      search: {
        must: [
          {
            is_approved: {
              match: true
            }
          },
          {
            updated_at: {
              gte: 'now-1w'
            }
          }
        ]
      }
    };

    const response = await request.post(
      `/exporter/v1/submit/suggestion?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}&export_guid=true`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        data: exportRequest
      }
    );

    console.log('\nExport Response Status:', response.status());

    if (response.status() !== 200) {
      const errorBody = await response.text();
      console.log('Export Error Response:', errorBody);
    }

    expect(response.status()).toBe(200);

    const body = await response.json();
    console.log('Export Approved Suggestions Response:', JSON.stringify(body, null, 2));

    // Validate response schema
    expectSchema(body, exportApprovedSuggestionsSchema);

    // Validate export ID exists
    expect(body).toHaveProperty('id');
    expect(typeof body.id).toBe('number');
    expect(body.id).toBeGreaterThan(0);

    // Validate export details
    expect(body.file_name).toBe('approved_suggestions');
    expect(body.type).toBe('suggestion');
    expect(body.oid).toBe(testOrgId);

    console.log(`✓ Export initiated with ID: ${body.id}`);
  });

  test('POST /exporter/v1/submit/suggestion - Export with custom date range', async ({ request }) => {
    const exportRequest = {
      name: 'approved_suggestions_custom',
      search: {
        must: [
          {
            is_approved: {
              match: true
            }
          },
          {
            updated_at: {
              gte: 'now-30d',
              lte: 'now'
            }
          }
        ]
      }
    };

    const response = await request.post(
      `/exporter/v1/submit/suggestion?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}&export_guid=true`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        data: exportRequest
      }
    );

    expect(response.status()).toBe(200);

    const body = await response.json();
    console.log('\nCustom Date Range Export:', JSON.stringify({
      id: body.id,
      file_name: body.file_name,
      type: body.type
    }, null, 2));

    // Validate response schema
    expectSchema(body, exportApprovedSuggestionsSchema);

    expect(body).toHaveProperty('id');
    expect(body.file_name).toBe('approved_suggestions_custom');
  });
});
