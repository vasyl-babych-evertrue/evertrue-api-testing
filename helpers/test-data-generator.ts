/**
 * Test Data Generator - прості функції для тестових даних
 */

import { faker } from '@faker-js/faker';

// === УНІКАЛЬНІ ДАНІ (з timestamp) ===

export function generateEmail(domain: string = 'example.com'): string {
  return `test.${Date.now()}@${domain}`;
}

export function generateUsername(): string {
  return `user_${Date.now()}`;
}

export function generateSlug(base: string = 'test'): string {
  return `${base}-${Date.now()}`;
}

// === РЕАЛІСТИЧНІ ДАНІ (через Faker) ===

export function generateFirstName(): string {
  return faker.person.firstName();
}

export function generateLastName(): string {
  return faker.person.lastName();
}

export function generateFullName(): string {
  return faker.person.fullName();
}

export function generatePhone(): string {
  return faker.phone.number();
}

export function generateCompanyName(): string {
  return faker.company.name();
}

export function generateStreet(): string {
  return faker.location.streetAddress();
}

export function generateCity(): string {
  return faker.location.city();
}

export function generateState(): string {
  return faker.location.state();
}

// === UTILITY ===

export function randomNumber(min: number = 1, max: number = 1000): number {
  return faker.number.int({ min, max });
}

export function randomPick<T>(array: T[]): T {
  return faker.helpers.arrayElement(array);
}
