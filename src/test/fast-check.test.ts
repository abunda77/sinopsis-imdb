import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

describe('Fast-check Property-Based Testing Setup', () => {
  it('should run property-based tests with fast-check', () => {
    // Property: reversing a string twice should return the original string
    fc.assert(
      fc.property(fc.string(), (str) => {
        const reversed = str.split('').reverse().join('');
        const doubleReversed = reversed.split('').reverse().join('');
        return doubleReversed === str;
      }),
      { numRuns: 100 }
    );
  });

  it('should generate random integers', () => {
    fc.assert(
      fc.property(fc.integer(), (num) => {
        return typeof num === 'number';
      }),
      { numRuns: 100 }
    );
  });
});
