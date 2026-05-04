# Site Activity Tracking Setup Guide

This guide walks you through deploying the Cloudflare Worker backend for live usage monitoring.

## Prerequisites

- A Cloudflare account (free tier works)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) installed globally
- Node.js 18+

## Step 1: Install Wrangler (if not already done)

```bash
npm install -g wrangler
```

Verify installation:
```bash
wrangler --version
```

## Step 2: Authenticate with Cloudflare

```bash
wrangler login
```

This will open a browser to authorize your Cloudflare account.

## Step 3: Create a D1 Database

```bash
wrangler d1 create uvtools-usage
```

This will output something like:
```
✓ Successfully created DB 'uvtools-usage' in region wnam
Database ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**Save the Database ID** — you'll need it for the next step.

## Step 4: Create wrangler.toml

Copy the example config and add your database ID:

```bash
cp monitoring/wrangler.toml.example wrangler.toml
```

Edit `wrangler.toml` and replace `REPLACE_WITH_YOUR_D1_DATABASE_ID` with the Database ID from Step 3.

Then add environment variables at the end of `wrangler.toml`:

```toml
[env.production]
vars = { ALLOWED_ORIGINS = "https://yourdomain.com,https://www.yourdomain.com" }
vars.WRITE_KEY = "your-secret-write-key-here"
vars.ADMIN_TOKEN = "your-admin-token-here"
```

Replace:
- `https://yourdomain.com` with your actual domain(s)
- `your-secret-write-key-here` with a random string (for event tracking)
- `your-admin-token-here` with a random string (for viewing stats)

Example (replace content after line `database_id =`):
```bash
# Generate keys
write_key=$(openssl rand -hex 16)
admin_token=$(openssl rand -hex 16)
echo "Generated Write Key: $write_key"
echo "Generated Admin Token: $admin_token"
```

## Step 5: Initialize the Database with Schema

```bash
wrangler d1 execute uvtools-usage --file monitoring/schema.sql
```

This creates the necessary tables and indexes for tracking events.

## Step 6: Deploy the Worker

```bash
wrangler deploy --env production
```

Wrangler will output your worker URL. It should look like:
```
Uploaded uvtools-usage-monitor (X.XXs)
Published uvtools-usage-monitor@XXXXXXX
  https://uvtools-usage-monitor.yourusername.workers.dev
```

**Save this Worker URL** — you'll need it next.

## Step 7: Update Configuration Files

Update [usage-tracker-config.js](usage-tracker-config.js):

```javascript
window.USAGE_TRACKER_CONFIG = {
  eventEndpoint: 'https://uvtools-usage-monitor.yourusername.workers.dev/event',
  publicCountEndpoint: 'https://uvtools-usage-monitor.yourusername.workers.dev/count',
  publicTrendEndpoint: 'https://uvtools-usage-monitor.yourusername.workers.dev/trend',
  publicCountriesEndpoint: 'https://uvtools-usage-monitor.yourusername.workers.dev/countries',
  site: 'n7six-myprofile-website',
  writeKey: 'your-secret-write-key-here',
  countRefreshMs: 60000,
  trendHours: 24,
  countriesLimit: 6,
};
```

Replace:
- Worker URL with your actual Worker URL from Step 6
- `writeKey` with the key from Step 4

## Step 8: Deploy Your Site

Commit and push changes to deploy:

```bash
git add usage-tracker-config.js
git commit -m "Configure usage tracking endpoints"
git push
```

## Step 9: Test It

1. Visit your live site
2. Let the page load (Site Activity section will fetch data)
3. After a minute, refresh or check the Site Activity section

You should see:
- **Total Uses**: Count of page views
- **Last 24h Trend**: Graph showing usage by hour
- **Top Countries**: Countries by visitor count

## Accessing Admin Stats

To view detailed stats, visit:
```
https://your-worker-url/stats?site=n7six-myprofile-website&token=your-admin-token-here
```

This shows:
- Total events and unique IPs
- Breakdown by country
- Breakdown by event type
- Last 100 recent events

## Troubleshooting

- **"Source: --" in Site Activity**: Worker endpoint is still a placeholder or unreachable
- **No data appearing**: Check that `writeKey` in config matches `WRITE_KEY` in wrangler.toml
- **CORS errors**: Ensure `ALLOWED_ORIGINS` in wrangler.toml includes your site domain

## Updating Your Worker

After any changes to `cloudflare-worker.js`:

```bash
wrangler deploy --env production
```

No need to redeploy configuration files unless you change the endpoints.
