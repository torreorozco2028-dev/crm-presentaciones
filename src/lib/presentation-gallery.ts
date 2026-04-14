function toImageUrl(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (value && typeof value === 'object') {
    const possibleUrl = (value as { url?: unknown }).url;
    return typeof possibleUrl === 'string' ? possibleUrl.trim() : '';
  }
  return '';
}

export function parseImageBatch(raw: unknown): string[] {
  if (!raw) return [];

  const parsed = (() => {
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
      try {
        const value = JSON.parse(raw);
        return Array.isArray(value) ? value : [value];
      } catch {
        return [raw];
      }
    }
    return [raw];
  })();

  return parsed.map(toImageUrl).filter(Boolean);
}

export function getPresentationGalleryImages(
  selectedModel:
    | {
        prymary_image?: string;
        batch_images?: unknown;
      }
    | null
    | undefined,
  distributionImage: unknown
) {
  if (!selectedModel) {
    return parseImageBatch(distributionImage);
  }

  const primary = (selectedModel.prymary_image || '').trim();
  const normalizedBatch = parseImageBatch(selectedModel.batch_images);

  return [...new Set([primary, ...normalizedBatch].filter(Boolean))];
}
