import { describe, expect, it } from 'vitest';
import getNavbarBrand from './get-navbar-brand';

describe('getNavbarBrand', () => {
  it('should extract the last path segment', () => {
    expect(getNavbarBrand('/dashboard')).toBe('dashboard');
  });

  it('should handle nested paths', () => {
    expect(getNavbarBrand('/users/settings/profile')).toBe('profile');
  });

  it('should replace hyphens with spaces', () => {
    expect(getNavbarBrand('/unit-costs')).toBe('unit costs');
  });

  it('should handle paths with locale', () => {
    expect(getNavbarBrand('/en/dashboard')).toBe('dashboard');
  });

  it('should handle empty path', () => {
    expect(getNavbarBrand('')).toBe('');
  });

  it('should handle path with trailing slash', () => {
    expect(getNavbarBrand('/settings/')).toBe('');
  });

  it('should trim whitespace', () => {
    expect(getNavbarBrand('/  spaces  ')).toBe('spaces');
  });
});
