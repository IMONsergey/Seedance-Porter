# Security

## Secrets

Keep provider keys in environment variables. `.env` is ignored. `.porter.json` manifests must never include keys.

## Untrusted repositories

Do not execute installers from repositories merely because their name contains ByteDance or Seedance. In particular, avoid `curl | bash`, unknown DMGs/EXEs and binaries without a verifiable vendor/release chain.

## Reference media

A generation provider receives every uploaded/referenced asset. Before using client material, confirm the provider/account terms match the project's confidentiality requirements. Prefer controlled storage URLs over public temporary upload services for production work.

## Rights

Porter does not grant rights to a face, voice, song, character, brand asset or reference video. Keep a project-level rights map for commercial work. Do not use technical tricks intended to bypass provider safety or identity checks.

## Paid generation safety

Porter blocks identical deterministic paid requests for ten minutes by default. This is protection against agent retries and double clicks, not a billing guarantee. Use provider-side spend limits as well.
