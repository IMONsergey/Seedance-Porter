# Porter Studio

Run:

```bash
npm run studio
```

Open `http://127.0.0.1:4173`.

The Studio is intentionally local-first. It provides:

- project JSON editor;
- provider selector;
- model list;
- zero-cost Compile action;
- explicit Generate action with a credit-spend confirmation;
- JSON result inspection;
- generated video preview when the provider returns a URL.

## HTTP API

The same process exposes:

- `GET /api/health`
- `GET /api/models`
- `POST /api/compile`
- `POST /api/generate`
- `POST /api/score`

This makes Porter easy to call from n8n, a custom frontend or another local automation layer.

By default it binds to `127.0.0.1`. If you deliberately expose it to a network, set `PORTER_STUDIO_TOKEN` and pass `Authorization: Bearer <token>` on API calls. Do not expose an unauthenticated generation endpoint containing paid provider credentials.
