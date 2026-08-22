# NF3D Auto Bot

Public, Etsy-first social publishing dashboard for NewForest3D.

The application selects live products from the public NewForest3D Etsy catalogue and publishes platform-specific organic posts to Instagram, Pinterest, Facebook, X and TikTok. It uses deterministic SEO templates, so daily runs do not consume ChatGPT or Codex credits.

## What is included

- One-click **Run** button for every social platform.
- A **Run all platforms** button.
- Plus/minus controls for 1–20 posts per platform.
- Platform enable/disable switches.
- Daily 09:00 Europe/London scheduler.
- Live Etsy prices, descriptions, product types, URLs, tags and primary images.
- Avoidance of recently posted products when Supabase is connected.
- Persistent run and publication records.
- No credentials committed to this public repository.

## Important

The dashboard code is complete, but social networks will reject live publications until their developer applications, permissions and access tokens are configured. Never put API credentials in this repository or in browser-side code.

TikTok requires Content Posting API approval, the `video.publish` scope and a verified domain or URL prefix. Unaudited TikTok applications can only publish privately.

## Local setup

1. Install Node.js 20.9 or newer and pnpm.
2. Copy `.env.example` to `.env.local`.
3. Fill in the Etsy and platform credentials.
4. Run `supabase/schema.sql` in a Supabase project.
5. Install and start:

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Public deployment

Deploy this repository to a server platform that supports Next.js server routes, such as Vercel. A static GitHub Pages deployment is deliberately not used because API secrets must never be sent to visitors' browsers.

Set every value from `.env.example` in the deployment's encrypted environment settings. Set `NEXT_PUBLIC_APP_URL` to the production domain.

In this GitHub repository, add these Actions secrets:

- `AUTOBOT_URL`: the public deployment URL, without a trailing slash.
- `CRON_SECRET`: the same long random value configured in the deployment.

The GitHub Actions workflow triggers at both UTC times that can correspond to 09:00 UK time. The secured API checks `Europe/London`, so only the correct daylight-saving run publishes.

## Required developer access

| Service | Requirement |
| --- | --- |
| Etsy | Seller App API key and numeric shop ID |
| Instagram | Professional account, Meta app, content publishing permission and IG user ID |
| Facebook | Meta app, Page access token and Page ID |
| Pinterest | Approved app, `pins:write` access token and destination board ID |
| X | Developer project with write access and OAuth 1.0a user credentials; API usage charges may apply |
| TikTok | Audited Content Posting API app, `video.publish`, account authorisation and verified image domain |

## Security

- The public status endpoint reports only whether configuration exists, never secret values.
- Manual publishing requires `DASHBOARD_KEY` in the `x-dashboard-key` header.
- Scheduled publishing requires `CRON_SECRET` as a bearer token.
- Supabase uses its service-role key only on the server.
- Row-level security is enabled on campaign tables.

## Source-of-truth rules

Etsy is the sole product source. Each run uses active listings returned by Etsy's official API, then fetches the primary Etsy image. Failed publications are recorded as failures and are not treated as successful posts.
