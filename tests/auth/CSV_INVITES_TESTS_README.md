# CSV Invites API Tests - Documentation

## Overview
Comprehensive positive test suite for CSV Invites endpoints based on the official API documentation.

CSV invites are used to bulk invite users to the core platform using a standard set of headers. This functionality was rewritten from a bulk user creation page to a CSV import for better performance and maintainability.

## Test File
- **Location**: `tests/auth/auth-csv-invites.positive.spec.ts`
- **Schemas**: `schemas/auth.schemas.ts` (added CSV invite schemas)

## Endpoints Covered

### 1. GET /csv_invites
**Description**: List all CSV invites for the authenticated organization

**Test Cases**:
- ✅ Should get list of CSV invites with valid token and return 200
- ✅ Should return empty array when no CSV invites exist

**Validations**:
- Response status: 200
- Response structure: `{ csv_invites: [...] }`
- Schema validation using Joi
- Array structure validation
- Individual invite object properties
- Data type validation
- URL format validation

---

### 2. POST /csv_invite
**Description**: Create a new CSV invite by uploading base64-encoded CSV data

**Request Body**:
```json
{
  "data": "<base64 string>"
}
```

**Test Cases**:
- ✅ Should create CSV invite with valid base64 data and return 200
- ✅ Should create CSV invite with minimal valid CSV data
- ✅ Should create CSV invite with multiple users

**CSV Format Examples**:
```csv
email,first_name,last_name,role_id
test.user1@example.com,Test,User1,1
test.user2@example.com,Test,User2,1
```

**Validations**:
- Response status: 200
- Response structure: `{ csv_invite: {...} }`
- Schema validation
- All required fields present
- File size > 0
- URL format validation
- S3 URL contains 'bulk_invites'

---

### 3. GET /csv_invite/:id
**Description**: Get a specific CSV invite by ID

**Test Cases**:
- ✅ Should get CSV invite by ID with valid token and return 200
- ✅ Should verify CSV invite data consistency between create and get

**Validations**:
- Response status: 200
- Response structure: `{ csv_invite: {...} }`
- Schema validation
- ID matches requested ID
- Data consistency with created invite
- All fields match between create and retrieve

---

### 4. DELETE /csv_invite/:id
**Description**: Delete a CSV invite by ID

**Test Cases**:
- ✅ Should delete CSV invite by ID and return 200
- ✅ Should verify CSV invite is deleted and not retrievable

**Validations**:
- Delete response status: 200
- Subsequent GET returns 404/400/422
- Invite no longer accessible after deletion

---

### 5. CRUD Workflow
**Description**: Complete end-to-end workflow test

**Test Case**:
- ✅ Should complete full CRUD workflow: Create → Read → Delete

**Workflow Steps**:
1. **CREATE**: Upload CSV and create invite
2. **READ (by ID)**: Retrieve created invite by ID
3. **READ (in list)**: Verify invite appears in list
4. **DELETE**: Remove the invite
5. **VERIFY**: Confirm invite is no longer accessible

---

## Response Schema

### CSV Invite Object
```typescript
{
  id: number;                    // Unique identifier
  organization_id: number;       // Organization ID
  csv_file_name: string;         // Original filename
  csv_content_type: string;      // MIME type (e.g., "application/octet-stream")
  csv_file_size: number;         // File size in bytes
  created_at: string;            // ISO 8601 timestamp
  updated_at: string;            // ISO 8601 timestamp
  url: string;                   // S3 URL for the CSV file
}
```

### Example Response
```json
{
  "csv_invite": {
    "id": 2,
    "organization_id": 248,
    "csv_file_name": "invite2.csv",
    "csv_content_type": "application/octet-stream",
    "csv_file_size": 1024,
    "created_at": "2019-07-29T19:36:59.000Z",
    "updated_at": "2019-07-29T19:36:59.000Z",
    "url": "https://s3.amazonaws.com/auth.stage.evertrue.com/bulk_invites/<org_slug>/2"
  }
}
```

---

## Authentication
All endpoints require:
- **Authorization**: `<auth_token>` (Super Admin token)
- **Authorization-Provider**: `EvertrueAuthToken`
- **Application-Key**: `<app_key>`
- **Content-Type**: `application/json` (for POST)

**Test User**: Super Admin (vasyl.babych@evertrue.com)

---

## CSV File Format

### Required Headers
The CSV file should contain standard headers for user invitation:

**Minimal Format**:
```csv
email,first_name,last_name
user@example.com,First,Last
```

**Extended Format**:
```csv
email,first_name,last_name,role_id
user1@example.com,First,Last,1
user2@example.com,Another,User,2
```

### Base64 Encoding
The CSV content must be base64-encoded before sending:

```typescript
const csvContent = `email,first_name,last_name
test@example.com,Test,User`;

const base64Data = Buffer.from(csvContent).toString('base64');
```

---

## Running the Tests

### Run all CSV Invites tests:
```bash
npx playwright test tests/auth/auth-csv-invites.positive.spec.ts
```

### Run with detailed output:
```bash
npx playwright test tests/auth/auth-csv-invites.positive.spec.ts --reporter=list
```

### Run specific test:
```bash
npx playwright test tests/auth/auth-csv-invites.positive.spec.ts -g "should get list of CSV invites"
```

### Run with trace:
```bash
npx playwright test tests/auth/auth-csv-invites.positive.spec.ts --trace=on
```

### View HTML report:
```bash
npx playwright show-report
```

---

## Test Statistics

- **Total Test Cases**: 10
- **Endpoint Coverage**: 4/4 (100%)
- **Test Categories**:
  - List operations: 2 tests
  - Create operations: 3 tests
  - Read operations: 2 tests
  - Delete operations: 2 tests
  - Workflow tests: 1 test

---

## Schema Validation

All responses are validated using Joi schemas defined in `schemas/auth.schemas.ts`:

- `csvInviteSchema` - Base CSV invite object
- `csvInvitesListSchema` - List response wrapper
- `csvInviteSingleSchema` - Single invite response wrapper
- `csvInviteCreateSchema` - Create response wrapper

---

## Notes

1. **Permissions**: CSV invite operations require Super Admin privileges
2. **Organization Context**: CSV invites are scoped to the authenticated user's organization
3. **S3 Storage**: Files are stored in S3 with organization-specific paths
4. **File Processing**: The POST request creates the invite and sends invitations
5. **Cleanup**: Tests create and delete invites to maintain clean state

---

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: Ensure you're using Super Admin credentials
2. **404 Not Found**: Verify the endpoint URL and CSV invite ID
3. **400 Bad Request**: Check base64 encoding and CSV format
4. **504 Gateway Timeout**: API may be processing large CSV files

### Debug Commands

```bash
# Run with debug output
DEBUG=pw:api npx playwright test tests/auth/auth-csv-invites.positive.spec.ts

# Run single test with trace
npx playwright test tests/auth/auth-csv-invites.positive.spec.ts -g "should create CSV invite" --trace=on

# View trace file
npx playwright show-trace test-results/.../trace.zip
```

---

## Future Enhancements

Potential additions to the test suite:

1. **Negative Tests**:
   - Invalid base64 data
   - Malformed CSV format
   - Missing required headers
   - Invalid email addresses
   - Unauthorized access attempts
   - Non-existent CSV invite IDs

2. **Edge Cases**:
   - Very large CSV files
   - Special characters in CSV data
   - Duplicate email addresses
   - Empty CSV files
   - CSV with only headers

3. **Performance Tests**:
   - Bulk creation timing
   - Large file upload performance
   - Concurrent operations

---

## Related Documentation

- [Auth Users Tests](./auth-users.positive.spec.ts)
- [Affiliation Invitations Tests](./auth-affiliation-invitations.positive.spec.ts)
- [API Documentation](../../docs/API_DOCUMENTATION.md)

---

**Created**: 2025-01-20  
**Last Updated**: 2025-01-20  
**Author**: QA Automation Team
