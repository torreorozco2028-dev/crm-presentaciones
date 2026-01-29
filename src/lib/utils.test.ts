import { describe, expect, it } from 'vitest';
import { cn, createSlugText, isUUID, verifyTitle, toCamelCase } from './utils';

describe('cn (class name utility)', () => {
  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
    expect(cn('foo', { bar: true })).toBe('foo bar');
    expect(cn('foo', { bar: false })).toBe('foo');
  });

  it('should handle conditional classes', () => {
    const condition = true;
    expect(cn('foo', condition && 'bar')).toBe('foo bar');
    expect(cn('foo', !condition && 'bar')).toBe('foo');
  });
});

describe('createSlugText', () => {
  it('should convert string to slug format', () => {
    expect(createSlugText('Hello World')).toBe('hello-world');
    expect(createSlugText('Test String')).toBe('test-string');
  });

  it('should handle empty string', () => {
    expect(createSlugText('')).toBe('');
  });
});

describe('isUUID', () => {
  it('should validate correct UUID format', () => {
    expect(isUUID('123e4567-e89b-4d3a-8a3d-a2e63f135abc')).toBe(true);
    expect(isUUID('987fcdeb-51a2-4321-9b78-0123456789ab')).toBe(true);
  });

  it('should reject invalid UUID format', () => {
    expect(isUUID('not-a-uuid')).toBe(false);
    expect(isUUID('123e4567-e89b-1d3a-8a3d-a2e63f135abc')).toBe(false);
    expect(isUUID('')).toBe(false);
  });
});

describe('verifyTitle', () => {
  it('should return empty string for UUID', () => {
    expect(verifyTitle('123e4567-e89b-4d3a-8a3d-a2e63f135abc')).toBe('');
  });

  it('should return original string for non-UUID', () => {
    expect(verifyTitle('Hello World')).toBe('Hello World');
    expect(verifyTitle('Test Title')).toBe('Test Title');
  });
});

describe('toCamelCase', () => {
  it('should convert string to camelCase', () => {
    expect(toCamelCase('hello world')).toBe('helloWorld');
    expect(toCamelCase('test string here')).toBe('testStringHere');
  });

  it('should handle single word', () => {
    expect(toCamelCase('hello')).toBe('hello');
  });

  it('should handle already camelCase string', () => {
    expect(toCamelCase('helloWorld')).toBe('helloworld');
  });
});
