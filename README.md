# Trace

Public evidence research from a social handle. Choose the actual platform first; the dossier presents what that account says about its owner, without merging strangers who share a username.

**Live:** https://trace-1r05.onrender.com/

## What v2 does

- Dossier-first page: public display name, bio, stated location, join date, counts, evidence level and timestamped receipts when the source supplies them.
- Up to 30 original Bluesky posts, DEV articles, Reddit submissions or GitHub public events. Unsupported or blocked feeds show their limit, not invented posts.
- Repeated-word summary and observed UTC posting histogram, with sample size and date window. Not personality analysis or timezone inference.
- Explicit bio/website link trail, one hop to supported public platform endpoints. Other sites remain manual links; no arbitrary crawling.
- Internet Archive availability check for the selected profile and its most recent accessible snapshot.
- Exact handle-text mentions in Hacker News's public index. This is not whole-web search or verified attribution. Manual exact-handle web search is available.
- 120 curated public username checks using Sherlock community rules and nonexistent-name controls. A successful check is a candidate, never a verified account of the person.
- JSON export and print/save-to-PDF view. Mobile-first graphite/green interface.

## Run

```sh
npm ci
npm test
npm start
```

Node 22+, Express 5, vanilla JavaScript. No API keys, paid APIs or card. Render free instances may sleep and cold-start. Upstream restrictions vary by provider and server IP.

## Sources and limits

Supported profile sources: X/Twitter, Instagram, Facebook, Reddit, YouTube, TikTok, Telegram, Threads, GitHub, Bluesky, GitLab and DEV. Logged-out public endpoints only. X, Instagram and Facebook may expose only page metadata or nothing; they have no supported free logged-out post feed here.

A profile's real-world owner may not be publicly established. No face matching, stylometry, phone/address/email harvesting, login bypass or anonymous-account unmasking. Profile fields stay self-reported. Contact-like strings are filtered from displayed text, not collected. Same username does not mean same person.

Username detection rules can age. Redirects, access walls, timeouts, oversized responses and unclear negative controls stay unknown. Ten concurrent source checks; maximum two scans active; one scan per IP per five minutes. Regular lookups: ten per five minutes per IP. Temporary reports use a bounded ten-minute in-memory cache; no database, analytics or saved history. Hosting-provider request logs may persist.

## Data credit

Curated detection data derives from [Sherlock](https://github.com/sherlock-project/sherlock), MIT License, Copyright (c) 2019 Sherlock Project. Full MIT notice is preserved in `research.js` as `datasetCredit`. No NSFW or private-contact sources are included in this subset.

API references: [Bluesky feeds](https://docs.bsky.app/docs/tutorials/viewing-feeds), [DEV](https://developers.forem.com/api/v1), [Internet Archive](https://archive.org/help/wayback_api.php), [Hacker News search](https://hn.algolia.com/api).

Use for your own footprint or consent-based public research. Never treat a lead as an identity fact.
