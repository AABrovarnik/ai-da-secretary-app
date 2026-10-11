# Тестовый контур (просмотр и оценка)

## Что уже есть
- Интерактивный UI-контур в `apps/frontend/src/App.tsx`:
  - регистрация/вход
  - создание встречи
  - загрузка текста и запуск обработки
  - загрузка аудио (`.ogg`) и запуск ASR+LLM обработки
  - просмотр статуса `ProcessingRun`
- CLI smoke-контур в `scripts/smoke-audio.ps1` для end-to-end прогона.

## Как запустить вручную
1. Подготовить `.env` (минимум: `DATABASE_URL`, `SESSION_SECRET`, `OPENAI_API_KEY`).
2. Запустить backend и frontend.
3. В UI пройти сценарий: login → create meeting → upload `.ogg` → process audio.

## Автоматизированный smoke
```powershell
pwsh -File .\scripts\smoke-audio.ps1 -AudioPath "C:\Users\aabro\Downloads\audio_2026-10-06_16-15-16.ogg"
```

Скрипт выполняет:
- register/login
- create meeting
- multipart upload audio
- start `process-latest-audio`
- polling до `succeeded|failed|cancelled`

## Что считается успешной оценкой
- run доходит до `succeeded`
- у run есть `resultCandidates`
- в `Material.contentText` сохранена транскрипция
- ошибки возвращаются честно (без фиктивных ответов), если нет ключа/квоты