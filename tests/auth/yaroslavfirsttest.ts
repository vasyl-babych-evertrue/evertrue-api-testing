import { test, expect } from '@playwright/test';
import { config, getAppKey } from '../../config/env.config';
import { expectSchema } from '../../helpers/schema-validator';
import { createSessionSchema, userPickerSchema } from '../../schemas/auth.schemas';

/**
 * Auth API Tests - LinkedIn Access Token Authentication
 * Tests for LinkedIn OAuth 2.0 integration
 * Based on documentation: LinkedinAccessToken strategy
 *
 * Credentials: vasyl.babych@evertrue.com / p0o9P)O(p0o9P)O(
 *
 * LinkedIn Authentication Flow:
 * 1. User authenticates with LinkedIn OAuth 2.0
 * 2. Get LinkedIn Access Token from LinkedIn
 * 3. Activate token through LIDS: PUT /lids/auth/association/activate
 * 4. Use activated token with Auth API: POST /auth/session
 */
test.describe('Auth API - LinkedIn Access Token Authentication', () => {})