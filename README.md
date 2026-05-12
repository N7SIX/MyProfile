# Sean | N7SIX

Personal profile site for Sean, callsign N7SIX, a licensed amateur radio operator in the Philippines, contributor to the UV-K series firmware, and professional in the automotive industry.

Published at https://n7six.github.io/MyProfile

## Usage Monitoring (IP, Country, Counter)

You can monitor usage from a static GitHub Pages site by sending events to a small backend endpoint.

This repository now includes a starter backend in [monitoring/cloudflare-worker.js](monitoring/cloudflare-worker.js) with D1 schema in [monitoring/schema.sql](monitoring/schema.sql).

### What it captures


### Setup

1. Install Wrangler and login:

	```bash
	npm install -g wrangler
	wrangler login
	```

2. Create a D1 database and apply schema:

	```bash
	wrangler d1 create uvtools-usage
	wrangler d1 execute uvtools-usage --file=./monitoring/schema.sql
	```

3. Copy [monitoring/wrangler.toml.example](monitoring/wrangler.toml.example) to `monitoring/wrangler.toml` and set your `database_id`.

4. Add worker secrets:
```bash
wrangler secret put WRITE_KEY
wrangler secret put ADMIN_TOKEN
wrangler secret put ALLOWED_ORIGINS
```
Example `ALLOWED_ORIGINS` value:
`https://n7six.github.io,https://n7six.github.io/MyProfile`
	```bash
	wrangler secret put WRITE_KEY
	wrangler secret put ADMIN_TOKEN
	wrangler secret put ALLOWED_ORIGINS
	```

	Example `ALLOWED_ORIGINS` value:
	`https://n7six.github.io,https://n7six.github.io/MyProfile`

5. Deploy worker:

	```bash
	cd monitoring
	wrangler deploy
	```

	If you are in the repo root, a full one-shot command flow is:

	```bash
	npm install -g wrangler && \
	wrangler login && \
	wrangler d1 create uvtools-usage && \
	wrangler d1 execute uvtools-usage --file=./monitoring/schema.sql
	```

	Then set secrets:

	```bash
	wrangler secret put WRITE_KEY
	wrangler secret put ADMIN_TOKEN
	wrangler secret put ALLOWED_ORIGINS
	```

	Then deploy:

	```bash
	cd monitoring
	wrangler deploy
	```

6. Update tracker config in [script.js](script.js):
	- `USAGE_TRACKER.eventEndpoint`
	- `USAGE_TRACKER.publicCountEndpoint`
	- `USAGE_TRACKER.publicTrendEndpoint`
	- `USAGE_TRACKER.publicCountriesEndpoint`
	- `USAGE_TRACKER.writeKey`
	- `USAGE_TRACKER.site`
	- `USAGE_TRACKER.countRefreshMs` (optional counter auto-refresh interval)
	- `USAGE_TRACKER.trendHours` (public trend window, default 24)
	- `USAGE_TRACKER.countriesLimit` (how many top countries to display)


Automatic mode is available using [usage-tracker-config.js](usage-tracker-config.js), which is loaded by [index.html](index.html).
Edit this file once and the website tracker uses those values automatically.

Code organization:

- [usage-monitoring.js](usage-monitoring.js) contains monitoring/counter logic for the main site
- [script.js](script.js) contains site interaction/animation/social UI logic

7. Track specific usage actions by adding attributes on elements:

	```html
	<button data-track-event="flash_start_click" data-track-label="Flash Start">Flash</button>
	```

	Every click on an element with `data-track-event` sends an event record.

### Fetch stats

Call:

```bash
curl "https://<your-worker>.workers.dev/stats?site=uvtools-multi-firmware-web-flasher&token=<ADMIN_TOKEN>"
```

Public counter endpoint (no admin token):

```bash
curl "https://<your-worker>.workers.dev/count?site=n7six-myprofile-website"
```

Public trend endpoint (no admin token, aggregated counts only):

```bash
curl "https://<your-worker>.workers.dev/trend?site=n7six-myprofile-website&hours=24"
```


The response includes:

- Total events
- Unique IP count
- Country breakdown
- Event breakdown (by event name)
- Recent usage records

To get counts per action, run this query on D1:

```sql
SELECT event, COUNT(*) as count
FROM usage_events
WHERE site = 'uvtools-multi-firmware-web-flasher'
GROUP BY event
ORDER BY count DESC;
Dashboard automatic mode:
- [usage-dashboard.html](usage-dashboard.html) loads [usage-monitor-config.js](usage-monitor-config.js)
- Set `workerUrl`, `siteId`, and `adminToken` there
- With `autoLoad: true`, stats load automatically on page open
	`usage-dashboard.html?worker=https://...workers.dev&site=uvtools-multi-firmware-web-flasher&token=...`
- Add `&showTokenField=1` to force-show the token input when needed


It renders:

- Total events
- Unique IPs
- Event counters
- Country counters
---

## License
This project is licensed under the [MIT License](LICENSE).

## Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Contact
[Sean (N7SIX)](https://github.com/N7SIX)
### Important note

IP addresses are personal data in many jurisdictions. Add a privacy notice to your site and comply with local laws (for example GDPR/CCPA where applicable).

Security note:

- Set `ALLOWED_ORIGINS` so only your domains can send events.
- `WRITE_KEY` is optional in this setup. If set, the client must send the same key.