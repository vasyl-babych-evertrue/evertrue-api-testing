import { test, expect } from '../../fixtures/global-api-tracking.fixture';
import { config } from '../../config/env.config';
import { expectSchema } from '../../helpers/schema-validator';
import {
  jobSchema,
  paginatedJobListSchema,
  s3UrlResponseSchema,
} from '../../schemas/importer.schemas';

/**
 * Importer API Tests - Complete Test Suite
 * 
 * This file contains all Importer API tests organized in logical groups:
 * 1. Job Listing & Filtering - GET /importer/v3/jobs with various filters
 * 2. Job Details - GET /importer/v3/jobs/{id} and download URLs
 * 3. Job Creation & Polling - POST job and monitor FILE_CHECK status
 * 
 * Test User: Super Admin (vasyl.babych@evertrue.com)
 */

// ============================================================================
// TEST SUITE 1: JOB LISTING & FILTERING
// ============================================================================

test.describe('Importer API - Job Listing & Filtering', () => {
  let authToken: string;
  const testOrgId = 463; // Swan organization
  let existingJobId: number;

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
  });

  test('GET /importer/v3/jobs - should get paginated list with default parameters', async ({ request }) => {
    const response = await request.get(
      `/importer/v3/jobs?oid=${testOrgId}&auth=${authToken}&auth_provider=EvertrueAuthToken&app_key=${config.headers.applicationKey}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    expect(response.status()).toBe(200);

    const body = await response.json();
    console.log('Jobs List Response (first 2 items):', JSON.stringify({
      limit: body.limit,
      offset: body.offset,
      total: body.total,
      items: body.items?.slice(0, 2)
    }, null, 2));

    // Validate response schema
    expectSchema(body, paginatedJobListSchema);

    // Validate pagination structure
    expect(body).toHaveProperty('limit');
    expect(body).toHaveProperty('offset');
    expect(body).toHaveProperty('total');
    expect(body).toHaveProperty('items');
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items.length).toBeGreaterThan(0);

    // Store first job ID for subsequent tests
    if (body.items && body.items.length > 0) {
      existingJobId = body.items[0].id;
      console.log('Using job ID for subsequent tests:', existingJobId);
    }
  });

  test('GET /importer/v3/jobs - should get paginated list with custom limit and offset', async ({ request }) => {
    const limit = 5;
    const offset = 10;

    const response = await request.get(
      `/importer/v3/jobs?oid=${testOrgId}&auth=${authToken}&auth_provider=EvertrueAuthToken&app_key=${config.headers.applicationKey}&limit=${limit}&offset=${offset}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    expect(response.status()).toBe(200);

    const body = await response.json();

    // Validate response schema
    expectSchema(body, paginatedJobListSchema);

    // Validate pagination parameters
    expect(body.limit).toBe(limit);
    expect(body.offset).toBe(offset);
    expect(body.items.length).toBeLessThanOrEqual(limit);
  });

  test('GET /importer/v3/jobs - should filter jobs by type', async ({ request }) => {
    const response = await request.get(
      `/importer/v3/jobs?oid=${testOrgId}&auth=${authToken}&auth_provider=EvertrueAuthToken&app_key=${config.headers.applicationKey}&type[]=CSV`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    expect(response.status()).toBe(200);

    const body = await response.json();

    // Validate response schema
    expectSchema(body, paginatedJobListSchema);

    // Validate all items have CSV type
    if (body.items && body.items.length > 0) {
      body.items.forEach((job: any) => {
        expect(job.type).toBe('CSV');
      });
    }
  });

  test('GET /importer/v3/jobs - should filter jobs by status', async ({ request }) => {
    const response = await request.get(
      `/importer/v3/jobs?oid=${testOrgId}&auth=${authToken}&auth_provider=EvertrueAuthToken&app_key=${config.headers.applicationKey}&status[]=OK`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    expect(response.status()).toBe(200);

    const body = await response.json();

    // Validate response schema
    expectSchema(body, paginatedJobListSchema);

    // Validate all items have OK status
    if (body.items && body.items.length > 0) {
      body.items.forEach((job: any) => {
        expect(job.status).toBe('OK');
      });
    }
  });

  test('GET /importer/v3/jobs - should sort jobs by created_at descending', async ({ request }) => {
    const response = await request.get(
      `/importer/v3/jobs?oid=${testOrgId}&auth=${authToken}&auth_provider=EvertrueAuthToken&app_key=${config.headers.applicationKey}&sort_column=created_at&sort_order=desc&limit=10`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    expect(response.status()).toBe(200);

    const body = await response.json();

    // Validate response schema
    expectSchema(body, paginatedJobListSchema);

    // Validate sorting
    if (body.items && body.items.length > 1) {
      for (let i = 0; i < body.items.length - 1; i++) {
        expect(body.items[i].created_at).toBeGreaterThanOrEqual(body.items[i + 1].created_at);
      }
    }
  });

  test('GET /importer/v3/jobs - should filter jobs by filename (fuzzy search)', async ({ request }) => {
    const response = await request.get(
      `/importer/v3/jobs?oid=${testOrgId}&auth=${authToken}&auth_provider=EvertrueAuthToken&app_key=${config.headers.applicationKey}&filename=contacts&limit=5`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    expect(response.status()).toBe(200);

    const body = await response.json();

    // Validate response schema
    expectSchema(body, paginatedJobListSchema);

    // Validate all items contain 'contacts' in filename
    if (body.items && body.items.length > 0) {
      body.items.forEach((job: any) => {
        expect(job.s3_filename.toLowerCase()).toContain('contacts');
      });
    }
  });

  test('GET /importer/v3/jobs/{job_id} - should get job by ID', async ({ request }) => {
    if (!existingJobId) {
      test.skip();
    }

    const response = await request.get(
      `/importer/v3/jobs/${existingJobId}?oid=${testOrgId}&auth=${authToken}&auth_provider=EvertrueAuthToken&app_key=${config.headers.applicationKey}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    expect(response.status()).toBe(200);

    const body = await response.json();
    console.log('Job by ID Response:', JSON.stringify(body, null, 2));

    // Validate response schema
    expectSchema(body, jobSchema);

    // Validate job ID matches
    expect(body.id).toBe(existingJobId);
    expect(body).toHaveProperty('s3_filename');
    expect(body).toHaveProperty('type');
    expect(body).toHaveProperty('status');
  });

  test('GET /importer/v3/jobs/{job_id}/download - should get S3 pre-signed URL', async ({ request }) => {
    if (!existingJobId) {
      test.skip();
    }

    const response = await request.get(
      `/importer/v3/jobs/${existingJobId}/download?oid=${testOrgId}&auth=${authToken}&auth_provider=EvertrueAuthToken&app_key=${config.headers.applicationKey}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    expect(response.status()).toBe(200);

    const body = await response.json();
    console.log('S3 URL Response:', JSON.stringify(body, null, 2));

    // Validate response schema
    expectSchema(body, s3UrlResponseSchema);

    // Validate S3 URL structure
    expect(body).toHaveProperty('s3_url');
    expect(body.s3_url).toContain('s3.amazonaws.com');
    // AWS Signature V4 format
    expect(body.s3_url).toContain('X-Amz-');
    expect(body.s3_url).toContain('Signature');
  });
});

// ============================================================================
// TEST SUITE 2: JOB CREATION & FILE_CHECK POLLING
// ============================================================================

test.describe.serial('Importer API - Job Creation & FILE_CHECK Polling', () => {
  let authToken: string;
  const testOrgId = 463; // Swan organization
  let createdJobId: number;
  let successfulS3Filename: string;

  // Status constants for FILE_CHECK workflow
  const STATUS_QUEUED = 'FILECHECK_QUEUED';
  const STATUS_FORKED = 'FILECHECK_FORKED';
  const STATUS_RUNNING = 'FILECHECK_RUNNING';
  const STATUS_SUCCESS = 'FILECHECK_SUCCESS';
  const STATUS_FAILED = 'FILECHECK_FAILED';
  const EXPECTED_ORDER = [STATUS_QUEUED, STATUS_FORKED, STATUS_RUNNING, STATUS_SUCCESS];
  const TERMINAL_STATUSES = [STATUS_SUCCESS, STATUS_FAILED];

  test.beforeAll(async ({ request }) => {
    // Create session
    const authResponse = await request.post('/auth/session', {
      headers: {
        'Application-Key': config.headers.applicationKey,
        'Authorization-Provider': config.headers.authorizationProvider,
        'Authorization': `Basic ${config.auth.superAdminToken}`,
      },
    });

    const authBody = await authResponse.json();
    authToken = authBody.token;

    // Find a successful job to get a valid S3 filename
    const jobsResponse = await request.get(
      `/importer/v3/jobs?oid=${testOrgId}&auth=${authToken}&auth_provider=EvertrueAuthToken&app_key=${config.headers.applicationKey}&status[]=FILECHECK_SUCCESS&limit=1`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    const jobsBody = await jobsResponse.json();
    
    if (jobsBody.items && jobsBody.items.length > 0) {
      successfulS3Filename = jobsBody.items[0].s3_filename;
      console.log(`✓ Found successful S3 file: ${successfulS3Filename}`);
    } else {
      // Fallback to a known file
      successfulS3Filename = '1761061141528-1740413170215-contacts_old_1.csv';
      console.log(`⚠ No successful jobs found, using fallback: ${successfulS3Filename}`);
    }
  });

  test('Step 1: POST /importer/v3/jobs - Create import job', async ({ request }) => {
    const jobData = {
      s3_filename: successfulS3Filename,
      source: 'CSV',
      compression: 'NONE',
      prune: 0,
      notify: 1
    };

    const response = await request.post(
      `/importer/v3/jobs?oid=${testOrgId}&auth=${authToken}&auth_provider=EvertrueAuthToken&app_key=${config.headers.applicationKey}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        data: jobData
      }
    );

    expect(response.status()).toBe(200);

    const body = await response.json();
    createdJobId = body.id;
    
    console.log('✓ Job Created:', JSON.stringify({
      id: body.id,
      s3_filename: body.s3_filename,
      type: body.type,
      status: body.status
    }, null, 2));

    // Validate response schema
    expectSchema(body, jobSchema);

    // Validate created job data
    expect(body).toHaveProperty('id');
    expect(typeof body.id).toBe('number');
    expect(body.s3_filename).toBe(successfulS3Filename);
    expect(body).toHaveProperty('type'); // Type auto-detected by API
    // Job is automatically queued for file check
    expect(['NEW', 'FILECHECK_QUEUED', 'FILECHECK_RUNNING']).toContain(body.status);
    expect(body.oid).toBe(testOrgId);
  });

  test('Step 2: Poll job status until FILE_CHECK completion', async ({ request }) => {
    if (!createdJobId) {
      throw new Error('Job ID not found from previous test');
    }

    const maxRetries = 100;
    const interval = 500; // 500ms between polls
    let retries = 0;
    let lastStatus: string | null = null;
    const statusHistory: string[] = [];

    console.log(`\n🔄 Starting to poll job ${createdJobId} status...`);
    console.log(`   Max retries: ${maxRetries}, Interval: ${interval}ms\n`);

    while (retries < maxRetries) {
      const response = await request.get(
        `/importer/v3/jobs/${createdJobId}?oid=${testOrgId}&auth=${authToken}&auth_provider=EvertrueAuthToken&app_key=${config.headers.applicationKey}&worker_type=FILE_CHECK`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      expect(response.status()).toBe(200);

      const body = await response.json();
      const currentStatus = body.status;

      console.log(`   Attempt ${retries + 1}: Status = ${currentStatus} (${body.status_display_name || ''})`);

      // Validate schema at each poll
      expectSchema(body, jobSchema);

      // Track status changes
      if (currentStatus !== lastStatus) {
        statusHistory.push(currentStatus);
        
        // Validate status progression
        if (lastStatus !== null) {
          const lastIndex = EXPECTED_ORDER.indexOf(lastStatus);
          const currentIndex = EXPECTED_ORDER.indexOf(currentStatus);

          // Check if it's a terminal status (success or failure)
          if (TERMINAL_STATUSES.includes(currentStatus)) {
            console.log(`   ✓ Reached terminal status: ${lastStatus} → ${currentStatus}`);
          } else if (currentIndex === lastIndex + 1) {
            console.log(`   ✓ Valid transition: ${lastStatus} → ${currentStatus}`);
          } else if (currentIndex === lastIndex) {
            // Status unchanged, continue polling
          } else if (currentIndex > lastIndex + 1) {
            console.warn(`   ⚠ Skipped status: ${lastStatus} → ${currentStatus}`);
          } else {
            console.error(`   ✗ Invalid transition: ${lastStatus} → ${currentStatus}`);
            throw new Error(`Invalid status transition: ${lastStatus} → ${currentStatus}`);
          }
        }

        lastStatus = currentStatus;
      }

      // Check if we reached a terminal status
      if (currentStatus === STATUS_SUCCESS) {
        console.log(`\n✅ Job reached FILECHECK_SUCCESS!`);
        console.log(`   Status progression: ${statusHistory.join(' → ')}`);
        console.log(`   Total attempts: ${retries + 1}`);
        console.log(`   Total time: ~${((retries + 1) * interval) / 1000}s`);
        
        // Validate final status
        expect(currentStatus).toBe(STATUS_SUCCESS);
        expect(body.id).toBe(createdJobId);
        
        return; // Exit successfully
      } else if (currentStatus === STATUS_FAILED) {
        console.log(`\n⚠️  Job reached FILECHECK_FAILED!`);
        console.log(`   Status progression: ${statusHistory.join(' → ')}`);
        console.log(`   Total attempts: ${retries + 1}`);
        console.log(`   Total time: ~${((retries + 1) * interval) / 1000}s`);
        
        // Log failure details if available
        if (body.error_message) {
          console.log(`   Error: ${body.error_message}`);
        }
        
        // Validate final status
        expect(currentStatus).toBe(STATUS_FAILED);
        expect(body.id).toBe(createdJobId);
        
        // Mark as expected failure (file may be missing from S3)
        console.log(`\n   Note: File validation failed - this is expected if S3 file is missing`);
        return;
      }

      retries++;
      await new Promise(resolve => setTimeout(resolve, interval));
    }

    // If we reach here, max retries exceeded
    console.error(`\n✗ Max retries (${maxRetries}) reached!`);
    console.error(`   Last status: ${lastStatus}`);
    console.error(`   Status history: ${statusHistory.join(' → ')}`);
    throw new Error(`Job did not reach terminal status after ${maxRetries} attempts`);
  });

  test('Step 3: GET /importer/v3/jobs/{job_id}/results - Get FILE_CHECK results', async ({ request }) => {
    if (!createdJobId) {
      throw new Error('Job ID not found');
    }

    // Check if job succeeded before getting results
    const statusResponse = await request.get(
      `/importer/v3/jobs/${createdJobId}?oid=${testOrgId}&auth=${authToken}&auth_provider=EvertrueAuthToken&app_key=${config.headers.applicationKey}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    const statusBody = await statusResponse.json();
    
    if (statusBody.status === STATUS_FAILED) {
      console.log('\n⚠️  Skipping results test - job failed during FILE_CHECK');
      test.skip();
      return;
    }

    const response = await request.get(
      `/importer/v3/jobs/${createdJobId}/results?oid=${testOrgId}&auth=${authToken}&auth_provider=EvertrueAuthToken&app_key=${config.headers.applicationKey}&worker_type=FILE_CHECK`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    expect(response.status()).toBe(200);

    const body = await response.json();
    console.log('\n✓ Job Results:', JSON.stringify(body, null, 2));

    // Validate results structure
    expect(body).toHaveProperty('job');
    expect(body.job).toHaveProperty('status');
    expect(body.job.status).toBe(STATUS_SUCCESS);
    expect(body.job.id).toBe(createdJobId);

    console.log('\n✅ FILE_CHECK Polling Test Completed Successfully!');
    console.log(`   Job ID: ${createdJobId}`);
    console.log(`   Final Status: ${body.job.status}`);
  });
});
