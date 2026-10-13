# Trace

A social-handle research app with public API receipts and honest coverage. Plain JavaScript, Node 22+, Express, responsive vanilla frontend.

## Run

```sh
npm ci
npm test
npm start
```

Open http://localhost:3000. PORT can override the port. No API keys or billing required.

Live app: https://trace-1r05.onrender.com/

## Coverage

- GitHub, Bluesky, GitLab, DEV: unauthenticated public profile APIs. Name, bio, profile URL, public counts and self-linked websites when supplied.
- Bare Bluesky handles use `.bsky.social`; domain handles are supported.
- X/Twitter, Instagram, Facebook, YouTube, TikTok, Telegram and Threads: attempt logged-out public HTML metadata only, labelled Limited when exact metadata is exposed. No login gates are bypassed.
- Reddit: public about endpoint, where readable. Public-page restrictions remain Blocked/Unavailable.
- Self-declared outgoing links get separate source receipts. They are declarations, not verified ownership. No anonymous-account unmasking or identity scoring.
- An account found is not a verified person. Identical handles are not evidence of common ownership. Location fields are self-reported profile text, never live location.
- API failures, timeouts and access restrictions remain unavailable, not absent. Bluesky unresolved-handle HTTP 400 responses remain unavailable.

## API

`POST /api/lookup` with JSON `{ "handle": "octocat", "platforms": ["github", "bluesky"] }`.

Returns normalized public profile fields, source endpoints, timestamps, coverage status and manual links. `GET /health` is the health check.

## Privacy and safety

No login, private scraping, hidden emails, phone numbers, breach data, geolocation, tracking or identity scoring. No database, analytics, saved search history or automated recurring searches. Public responses are cached in memory for ten minutes, at most 200 entries. Standard hosting request logs may persist separately. Source APIs receive the requested handle and the server IP.

Fixed provider origins prevent arbitrary URL fetching; redirects are rejected, requests time out after eight seconds, input is validated, JSON bodies are limited to 2KB, untrusted profile text is rendered with textContent, outbound URLs are checked, and security headers include CSP. Per-IP limit: ten lookups per five minutes. Global limit: sixty per minute. Limits are in memory and reset on restart; multi-instance deployments need a shared limiter. No credentials are used for upstream access. Provider rate limits still apply.

Use for your own digital footprint or consent-based research. Do not use for harassment or unwanted contact.

## Deploy

The included Render blueprint requests the free web-service plan. Free services can sleep; cold starts and shared-IP provider quotas affect availability. Review current provider terms, free-plan limits and billing state before deploying. No paid plan is required by this code.

## Tests

`npm test` checks handle validation, fixed destinations, blocked/error status semantics, removal of private contact fields, safe links, custom Bluesky handles, exact GitLab username matching, social login gates and access restrictions. Live source availability is separate from unit tests.

## Source references

- https://docs.github.com/en/rest/users/users
- https://docs.bsky.app/docs/tutorials/viewing-profiles
- https://docs.gitlab.com/api/users/
- https://developers.forem.com/api/v1#tag/users
