# Global Minima

A static site for sharing ideas and views on science, technology, markets, and occasionally life reflections and random topics.

Built with [Astro](https://astro.build/) and MDX, and deployed on [Vercel](https://vercel.com/).

## Structure

```text
public/               Static assets
src/
  content/writing/    Essays in Markdown and MDX
  pages/              Routes and RSS
  layouts/            Page and article layouts
  components/         Shared components
  styles/             Typography and themes
  utils/              Content helpers
tests/                Unit, generated-site and rendering checks
astro.config.mjs      Site and build configuration
vercel.json           Deployment redirects
```

## Commands

Use Node 24 and npm. The supported minimum is Node 22.12.

| Command | Purpose |
| --- | --- |
| `npm ci` | Install dependencies |
| `npm run dev` | Start the site at `localhost:4321` |
| `npm run build` | Build the static site into `dist/` |
| `npm run preview` | Preview the production build |
| `npm run verify` | Run diagnostics, tests and a production build |

## Deployment

On Vercel, use `npm run build` and the `dist/` output directory. Set `SITE_URL` to the production origin in the deployment environment or shell; it supplies canonical, RSS and sitemap URLs. It defaults to Vercel's production URL, then `http://localhost:4321` locally. GitHub Actions runs verification on Node 22.12 and 24.

## License

- All writing: [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/).
- Code and code snippets: MIT.

See [LICENSE](LICENSE) for details.
