import { describe, it, expect } from 'vitest';
import { generateVariants } from '../variants';
import { generate } from '../../exercises/attention/cancellation';

describe('generateVariants', () => {
  it('returns the requested number of variants', () => {
    const variants = generateVariants(generate, 1, 100, 5);
    expect(variants).toHaveLength(5);
  });

  it('each variant has the correct level and an incrementing seed', () => {
    const variants = generateVariants(generate, 2, 200, 3);
    variants.forEach((v, i) => {
      expect(v.level).toBe(2);
      expect(v.seed).toBe(200 + i);
    });
  });

  it('is fully deterministic — same inputs produce identical variants', () => {
    const a = generateVariants(generate, 3, 42, 4);
    const b = generateVariants(generate, 3, 42, 4);
    a.forEach((va, i) => {
      expect(va.stimuli.symbols).toEqual(b[i]!.stimuli.symbols);
    });
  });

  it('different seeds produce different content', () => {
    const a = generateVariants(generate, 1, 1, 1);
    const b = generateVariants(generate, 1, 999, 1);
    expect(a[0]!.stimuli.symbols).not.toEqual(b[0]!.stimuli.symbols);
  });

  it('all variants within the same batch have unique grids', () => {
    const variants = generateVariants(generate, 2, 0, 10);
    const serialized = variants.map((v) => JSON.stringify(v.stimuli.symbols));
    const unique = new Set(serialized);
    expect(unique.size).toBe(10);
  });
});
