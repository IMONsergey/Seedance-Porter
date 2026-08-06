# Install and first run

Requirements: Node.js 20+.

```bash
git clone https://github.com/IMONsergey/Seedance-Porter.git
cd Seedance-Porter
npm install
cp .env.example .env
npm run check
npm test
```

Configure at least one provider key in `.env`.

## BytePlus — recommended

```env
BYTEPLUS_API_KEY=ark-...
```

Then:

```bash
npm run porter -- doctor
npm run porter -- models
npm run porter -- compile examples/product-film.json
```

Replace `https://example.com/...` references with real URLs or local files. BytePlus can inline local image/audio files; reference video currently needs a URL.

Generate:

```bash
npm run porter -- generate examples/product-film.json --provider byteplus
```

## Seedance 2.5 preview

Configure `MUAPI_API_KEY`, switch the project model to `seedance-2.5-preview`, and use `--provider muapi`. This is explicitly an experimental third-party route until a stable official 2.5 contract is verified.

## MCP

Run:

```bash
npm run mcp
```

Use `examples/mcp-config.json` as a starting point for Codex/Cursor/another MCP client, replacing `cwd` with the repository's absolute path.
