# AGENTS instructions for AI-да-Секретарь

## Scope
These rules apply to the entire repository.

## Stage boundaries
- Implement only stage 1 requirements unless the user explicitly asks for stage 2.
- Do not add team roles, external enterprise integrations, mobile client, video diarization, or large-pilot analytics in stage 1.

## Safety and state
- Always read current project state before changing architecture: `README.md`, `docs/PROJECT_STATE.md`, `docs/AI_CONTRACT.md`, and `CHANGELOG.md`.
- Preserve existing user-visible behavior and user-edited data.
- Apply database migrations forward without reset/drop for upgrades.
- Never hardcode secrets, shared passwords, or fake production credentials.

## Regression discipline
- Keep auth, ownership isolation, and persisted processing runs intact.
- Run typecheck/lint/tests for touched areas when possible and report blockers honestly.
- Distinguish verified behavior from planned/not-verified behavior.