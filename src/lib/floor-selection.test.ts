import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FLOOR_VIEWPORT_WIDTH,
  getMaxFloorSelections,
} from './floor-selection';

describe('floor selection responsiveness', () => {
  it('uses a stable SSR-safe default width', () => {
    expect(DEFAULT_FLOOR_VIEWPORT_WIDTH).toBe(1024);
  });

  it('limits comparison cards by viewport width', () => {
    expect(getMaxFloorSelections(375)).toBe(2);
    expect(getMaxFloorSelections(1024)).toBe(4);
  });
});
