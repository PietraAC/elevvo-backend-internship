import { canonicalProductText, contentHash, normalizeTags } from '../../src/modules/products/product-text.js';

describe('product text', () => {
  it('builds stable canonical text and sorted unique tags', () => {
    const text = canonicalProductText({ name: '  Alpine   Shell ', category: ' Outdoor ', description: ' Warm   and breathable. ', tags: ['Lightweight', ' cold-weather ', 'lightweight'] });
    expect(text).toBe('Product: Alpine Shell\nCategory: Outdoor\nDescription: Warm and breathable.\nTags: cold-weather, lightweight');
    expect(normalizeTags([' B ', 'a', 'b'])).toEqual(['a', 'b']);
  });

  it('produces a deterministic SHA-256 hash', () => {
    expect(contentHash('catalog text')).toMatch(/^[a-f0-9]{64}$/);
    expect(contentHash('catalog text')).toBe(contentHash('catalog text'));
    expect(contentHash('catalog text')).not.toBe(contentHash('other text'));
  });
});
