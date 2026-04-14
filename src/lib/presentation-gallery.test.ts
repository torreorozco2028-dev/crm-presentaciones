import { describe, expect, it } from 'vitest';
import { getPresentationGalleryImages } from './presentation-gallery';

describe('getPresentationGalleryImages', () => {
  it('returns the distribution image as a clickable gallery when no model is selected', () => {
    expect(
      getPresentationGalleryImages(null, 'https://example.com/distribution.jpg')
    ).toEqual(['https://example.com/distribution.jpg']);
  });

  it('returns primary and batch images without duplicates for a selected model', () => {
    expect(
      getPresentationGalleryImages(
        {
          prymary_image: 'https://example.com/a.jpg',
          batch_images: JSON.stringify([
            'https://example.com/a.jpg',
            'https://example.com/b.jpg',
          ]),
        },
        'https://example.com/distribution.jpg'
      )
    ).toEqual(['https://example.com/a.jpg', 'https://example.com/b.jpg']);
  });
});
