# Dokploy Deployment

This app is a Vite React single-page application. The production build is static files in `dist/`.

## Recommended Dokploy Settings

Create an `Application` from the Git provider.

```text
Build Type: Nixpacks
Build Path: /
Publish Directory: ./dist
Static SPA / isStaticSpa: enabled
Domain Port: 80
Auto Deploy: enabled for the target branch
```

Dokploy should run the existing `npm run build` script. No custom start command is required when `Publish Directory` is set, because Dokploy serves the built files with its optimized NGINX static image.

`Static SPA / isStaticSpa` must stay enabled so direct visits and Supabase Auth redirects to `/update-password` fall back to `index.html` instead of returning 404.

## Deployment Log Probes

`npm run build` emits `[novel-studio:deploy]` lines before and after the Vite build. These lines record the build phase, the `./dist` publish directory, whether `dist/index.html` exists, and the expected static container listen port.

For the recommended Dokploy static deployment, the expected listen port is:

```text
expected_static_listen_port=80
```

If you use `npm run preview` for a manual smoke test instead of Dokploy static hosting, the preview script logs the actual preview host and port. Dokploy production domains should still use container port `80` when `Publish Directory` is configured.

## Environment Variables

Set these on the Dokploy application. Vite embeds `VITE_*` variables at build time, so changing any of them requires a new deployment, not just a container restart.

For Supabase Hosted:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

For self-hosted Supabase:

```env
VITE_SUPABASE_URL=https://supabase.example.com
VITE_SUPABASE_ANON_KEY=your-anon-key
```

The app accepts either `VITE_SUPABASE_PUBLISHABLE_KEY` or `VITE_SUPABASE_ANON_KEY`. To migrate from Supabase Hosted to self-hosted, update the Supabase URL and public key in Dokploy, then redeploy once.

## Supabase Auth Redirects

In the Supabase project, include the Dokploy domain in Auth redirect URLs:

```text
https://your-domain.com/**
https://your-domain.com/update-password
```

Preview deployments need their own redirect URL or a wildcard that matches the preview domain.

## Current AI Note

The writing AI panel still uses a browser-side OpenAI client. Do not put a private OpenAI key into Dokploy for production. Move writing AI to Supabase Edge Functions before enabling production AI.
