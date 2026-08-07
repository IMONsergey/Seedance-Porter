# Seedance Porter — Source Universe

This document defines the discovery universe for Case Intelligence. X is only one creator-signal channel; it is not the canonical source of industry quality.

## Evidence layers

1. **Awarded work** — D&AD, Cannes Lions, The One Club, Clio, Awwwards, FWA, CSS Design Awards.
2. **Motion / design case studies** — Behance, Vimeo, Stash, Motionographer, Directors Library, BP&O, The Brand Identity, Creative Boom, It’s Nice That, Dribbble.
3. **Commercial production breakdowns** — LBBOnline, shots, Campaign, Adweek, Ads of the World, production-company and agency case pages.
4. **Official model / platform showcases** — BytePlus, Adobe Firefly, Google Flow/Veo, Runway, Luma, Higgsfield, Krea, Pika and other first-party galleries.
5. **Creator / prompt signals** — X, LinkedIn, YouTube, TikTok, Instagram, Threads, Reddit and public newsletters/blogs.

A case can be discovered on one platform and use another platform as its preferred in-page video player. Example: a Stash production breakdown can be paired with the director’s Vimeo film.

## Platform families

### Awards / elite case archives
- D&AD
- Cannes Lions
- Clio / Ads of the World
- The One Club / One Show
- Awwwards
- The FWA
- CSS Design Awards

### Motion / film / design archives
- Vimeo
- Behance
- Stash
- Motionographer
- Directors Library
- Dribbble
- ArtStation
- BP&O
- The Brand Identity
- It’s Nice That
- Creative Boom
- Designboom
- Creative Review

### Advertising / production press
- LBBOnline
- shots
- Campaign
- Adweek
- Ads of the World
- Little Black Book work archive
- Agency and production-company case pages

### Product / digital references
- Awwwards
- FWA
- Godly
- SiteInspire
- Land-book
- Mobbin
- Figma Community
- Layers
- LottieFiles

### Creator / social
- LinkedIn
- YouTube
- TikTok
- Instagram
- X
- Threads
- Reddit
- Medium / Substack / personal blogs

### First-party AI / model showcases
- BytePlus / Seedance
- Adobe Firefly
- Google Flow / Veo
- Runway
- Luma Dream Machine
- Higgsfield
- Krea
- Pika

## Embed policy

Preferred order:
1. direct official video player from the source host;
2. canonical Vimeo / YouTube / Cloudflare Stream player linked by the case source;
3. official project/post embed (Behance, X, LinkedIn, Instagram, TikTok);
4. poster + source fallback only when the publisher explicitly does not expose an embeddable surface.

Known supported patterns:
- Cloudflare Stream: `https://<customer>.cloudflarestream.com/<uid>/iframe`
- Vimeo: `https://player.vimeo.com/video/<id>`
- YouTube: `https://www.youtube.com/embed/<id>`
- Behance public project: `https://www.behance.net/embed/project/<projectId>?ilo0=1`
- X public post: official embedded-post surface
- Instagram public post/reel: official `/embed` surface
- LinkedIn public posts: official LinkedIn embed when a public embed URN is available
- TikTok: official player/embed surface when a public post ID is available

## Case admission rules

A case is admitted when it has enough evidence to teach a reusable production pattern. Exact prompts are **not** mandatory outside prompt-first sources. We distinguish:

- `prompt-case`: exact or source-authored prompt is public;
- `workflow-case`: creator/studio describes production approach but not exact prompt;
- `award-case`: outcome and strategy are documented, exact generation recipe may be private;
- `motion-reference`: excellent visual/motion language worth transferring even if not AI-native;
- `official-example`: first-party model/platform example with prompt or workflow guidance.

Porter must never invent an “original prompt” for a workflow or award case. It should show `Prompt not published by source` and provide only the independently written Porter Adaptation.
