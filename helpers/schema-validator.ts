/**
 * Joi-based schema validation helpers for API responses
 */

import Joi from 'joi';

/**
 * Validates a response against a Joi schema
 */
export function validateSchema(data: any, schema: Joi.ObjectSchema | Joi.ArraySchema): { valid: boolean; errors: string[] } {
  const result = schema.validate(data, { 
    abortEarly: false,
    allowUnknown: true, // Allow additional fields not defined in schema
    stripUnknown: false // Keep unknown fields in the result
  });

  if (result.error) {
    const errors = result.error.details.map(detail => detail.message);
    return {
      valid: false,
      errors
    };
  }

  return {
    valid: true,
    errors: []
  };
}

/**
 * Chainable schema validator for additional assertions
 */
class SchemaValidator {
  constructor(private data: any) {}

  /**
   * Validate additional fields with custom Joi schema
   */
  expectFields(fieldsSchema: Record<string, Joi.Schema>): SchemaValidator {
    const schema = Joi.object(fieldsSchema);
    const result = schema.validate(this.data, {
      abortEarly: false,
      allowUnknown: true
    });

    if (result.error) {
      const errors = result.error.details.map(detail => detail.message);
      throw new Error(`Additional field validation failed:\n${errors.join('\n')}`);
    }

    return this;
  }

  /**
   * Validate specific field matches expected value
   */
  expectField(fieldPath: string, expectedValue: any): SchemaValidator {
    const fieldValue = this.getNestedValue(fieldPath);
    
    if (fieldValue !== expectedValue) {
      throw new Error(`Field "${fieldPath}" validation failed: expected ${JSON.stringify(expectedValue)}, got ${JSON.stringify(fieldValue)}`);
    }

    return this;
  }

  /**
   * Validate field with custom Joi schema
   */
  expectFieldSchema(fieldPath: string, schema: Joi.Schema): SchemaValidator {
    const fieldValue = this.getNestedValue(fieldPath);
    const result = schema.validate(fieldValue);

    if (result.error) {
      throw new Error(`Field "${fieldPath}" schema validation failed: ${result.error.message}`);
    }

    return this;
  }

  private getNestedValue(path: string): any {
    return path.split('.').reduce((obj, key) => obj?.[key], this.data);
  }
}

/**
 * Expect helper for schema validation in tests
 * Returns chainable validator for additional assertions
 */
export function expectSchema(data: any, schema: Joi.ObjectSchema | Joi.ArraySchema): SchemaValidator {
  const result = validateSchema(data, schema);
  if (!result.valid) {
    throw new Error(`Schema validation failed:\n${result.errors.join('\n')}`);
  }
  
  return new SchemaValidator(data);
}
