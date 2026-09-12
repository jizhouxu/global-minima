import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const writing = defineCollection({
  // The Content Layer glob loader supplies entries and validates frontmatter.
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/writing' }),
  schema: z.object({
    title: z.string(),
    pubDate: z.coerce.date(),
    description: z.string(),
    tags: z.array(z.string().trim().min(1)).default([]),
    ogImage: z.string().optional(),
  }),
});

export const collections = { writing };
