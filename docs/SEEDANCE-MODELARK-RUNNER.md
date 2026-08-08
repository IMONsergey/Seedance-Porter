# Seedance ModelArk Generation Runner

The ModelArk Runner turns a `ready:true` Prompt Studio Seedance provider export into an actual external generation lifecycle without moving provider credentials into the browser.

It is a Node-only execution surface. GitHub Pages / Prompt Studio do not import or execute it.

## Official ModelArk lifecycle

Verified against current BytePlus ModelArk documentation on 2026-08-08:

1. `POST /api/v3/contents/generations/tasks` creates an asynchronous video generation task and returns an ID.
2. `GET /api/v3/contents/generations/tasks/{id}` retrieves current task state and, after success, `content.video_url`.
3. Current task lifecycle includes `queued`, `running`, `succeeded`, `failed`, `cancelled`, and `expired`.
4. `DELETE /api/v3/contents/generations/tasks/{id}` can cancel a `queued` task. A `running` task cannot be deleted/cancelled.
5. BytePlus also permits deletion of some terminal task records, but Seedance Porter deliberately refuses that destructive behavior from its `cancel` command.

Official sources:
- `https://docs.byteplus.com/en/docs/ModelArk/1520757`
- `https://docs.byteplus.com/en/docs/ModelArk/1521309`
- `https://docs.byteplus.com/en/docs/ModelArk/1521720`
- `https://docs.byteplus.com/api/docs/ModelArk/2298881`

## Credential boundary

The Runner reads only:

```bash
ARK_API_KEY=...
```

from the process environment.

There is intentionally no `--api-key` CLI option. This prevents credentials from being copied into shell history, process arguments, job files, result files, Prompt Studio projects or GitHub Pages assets.

Before execution the engine verifies that:
- the provider export is `ready:true`;
- provider/adapter are exactly `byteplus-modelark` / `seedance-2.0`;
- the create endpoint is the pinned official ModelArk task endpoint;
- the export policy still says no browser submission / no embedded API key / external execution required;
- the actual `ARK_API_KEY` value does not appear anywhere inside the export JSON.

Provider responses are treated as untrusted. If an upstream error or metadata string ever echoes the API key value, that value is replaced with `[REDACTED]` before it can reach an exception message or persisted job state.

## Commands

Run through npm:

```bash
npm run seedance:runner -- <command> ...
```

### Submit

```bash
ARK_API_KEY=... npm run seedance:runner -- submit project-seedance2-export.json --out project.job.json
```

Submits the verified provider payload and creates a resumable job manifest.

### Status

```bash
ARK_API_KEY=... npm run seedance:runner -- status project.job.json
```

Retrieves one current provider state and updates the job file.

### Wait

```bash
ARK_API_KEY=... npm run seedance:runner -- wait project.job.json --poll 10 --timeout 3600 --result project.result.json
```

Polls until a terminal state. The job file is rewritten after every poll, so interruption does not discard the provider task ID or last known state.

### Cancel

```bash
ARK_API_KEY=... npm run seedance:runner -- cancel project.job.json
```

The Runner first performs a status GET. It sends DELETE only if the provider currently reports `queued`.

It refuses:
- `running` — ModelArk does not allow cancellation then;
- `succeeded`, `failed`, `cancelled`, `expired` — even when ModelArk allows deleting some terminal records, the Runner will not turn a cancel command into destructive record deletion.

### Download

```bash
npm run seedance:runner -- download project.job.json --out project.mp4
```

Requires a succeeded job. The signed generated-video URL is downloaded without the ModelArk Authorization header. `ARK_API_KEY` is never forwarded to the output CDN URL.

### Run end-to-end

```bash
ARK_API_KEY=... npm run seedance:runner -- run project-seedance2-export.json \
  --job project.job.json \
  --result project.result.json \
  --video project.mp4 \
  --poll 10 \
  --timeout 3600
```

This executes submit → poll → terminal result → MP4 download. Job state remains resumable throughout polling.

## Job protocol

Schema:
`schemas/prompt-studio-generation-job.schema.json`

The job manifest deliberately does **not** contain the raw prompt/provider payload. It stores:
- provider + adapter;
- task ID;
- current status;
- pinned create/retrieve endpoints;
- SHA-256 of the provider export;
- non-sensitive export summary (model, resolution, ratio, duration, media counts);
- timestamps;
- normalized provider metadata/usage/error;
- output URLs after success;
- a policy declaring `secretPersisted:false` and `apiKeySource:"environment"`.

The SHA-256 links the execution record back to the exact export that was submitted without duplicating potentially sensitive creative payload into every job state file.

## Result protocol

Schema:
`schemas/prompt-studio-generation-result.schema.json`

A result is written only for a terminal state:
- `succeeded`
- `failed`
- `cancelled`
- `expired`

It contains final status, export hash, normalized output/usage/error/provider metadata and timestamps. It never contains credentials.

## Failure behavior

The Runner fails closed when:
- export is blocked or malformed;
- provider/adapter/endpoint/policy do not match the verified contract;
- `ARK_API_KEY` is missing;
- the API key value is detected inside the export/job;
- provider response is non-JSON when JSON is expected;
- provider returns non-2xx;
- task ID is missing after submit;
- wait timeout is exceeded;
- download is requested before success;
- succeeded task does not provide an HTTPS video URL.

No retry is hidden inside submit. Polling is explicit and bounded by `--poll` / `--timeout`.

## Tests and CI

`validate-seedance-modelark-runner.mjs` uses injected mock requesters only. It proves:
- blocked/secret-bearing exports execute zero network calls;
- submit uses the environment key only in the outbound Authorization header;
- job/result JSON never contains the key or Authorization;
- queued → running → succeeded polling;
- failed-response secret redaction;
- queued-only cancellation;
- running cancellation refusal;
- terminal record deletion refusal;
- generated-media download without provider Authorization.

`seedance-modelark-runner-ci.yml` runs on Node 20/22/24 and also revalidates the v6 provider export baseline and exact-100 browser invariant.
