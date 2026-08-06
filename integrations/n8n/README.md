# n8n integration

The simplest robust n8n integration is Porter's local HTTP API rather than a provider-specific community node.

1. Run `npm run studio` on the machine/container that has provider credentials.
2. Use an n8n HTTP Request node.
3. `POST http://127.0.0.1:4173/api/compile` before any paid generation.
4. After approval, `POST /api/generate` with `{ "project": {...}, "provider": "byteplus", "wait": true }`.
5. Persist returned `videoPath`, `manifestPath` and task ID in the workflow record.

If n8n runs on another host, bind Porter deliberately and protect it with `PORTER_STUDIO_TOKEN` plus network controls. Never expose the paid generation API openly to the internet.
