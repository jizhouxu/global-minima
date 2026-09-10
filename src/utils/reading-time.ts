/**
 * Estimates reading time from raw markdown/MDX body text.
 * Average adult reading speed: ~200 words per minute.
 */
export function readingTime(body: string): number {
  const words = body.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

/** Strip .md / .mdx extension from a Content Layer entry id to get a URL slug. */
export function getSlug(id: string): string {
  return id.replace(/\.(mdx?)$/, '');
}

type DatedPost = { id: string; data: { pubDate: Date } };

/** Newest publication first, with a consistent content-ID order for equal dates. */
export function comparePostsNewestFirst(a: DatedPost, b: DatedPost): number {
  const dateOrder = b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
  if (dateOrder !== 0) return dateOrder;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  });
}

/** Human-readable route segments; tag pages check for collisions at build time. */
export function tagSlug(tag: string): string {
  return tag.normalize('NFKC').toLowerCase()
    .replaceAll('#', '-sharp').replaceAll('+', '-plus')
    .replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '')
    || Array.from(tag, (char) => char.codePointAt(0)!.toString(16)).join('-');
}

export function tagPath(tag: string): string {
  return `/tags/${encodeURIComponent(tagSlug(tag))}`;
}
