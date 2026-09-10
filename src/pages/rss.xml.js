import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { getSlug, comparePostsNewestFirst } from '../utils/reading-time';

export async function GET(context) {
  const posts = (await getCollection('blog', ({ data }) => !data.draft)).sort(
    comparePostsNewestFirst
  );

  return rss({
    title: 'Global Minima',
    description: 'Personal essays and technical writing.',
    site: context.site,
    trailingSlash: false,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `${import.meta.env.BASE_URL.replace(/\/$/, '')}/blog/${getSlug(post.id)}`,
    })),
    customData: `<language>en-us</language>`,
  });
}
