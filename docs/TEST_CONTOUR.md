# Тестовый контур (просмотр и оценка)

## Что уже есть
- Интерактивный UI-контур в `apps/frontend/src/App.tsx`:
  - регистрация/вход
  - создание встречи
  - загрузка текста и запуск обработки
  - загрузка аудио (`.ogg`) и запуск ASR+LLM обработки
  - просмотр статуса `ProcessingRun`
  - редактирование AI-черновика и approve/reject каждого пункта
  - просмотр подтверждённых решений/поручений и архива проверок
- CLI smoke-контур в `scripts/smoke-audio.ps1` для end-to-end прогона.

## Как запустить вручную
1. Подготовить `.env` (минимум: `DATABASE_URL`, `SESSION_SECRET`, `OPENAI_API_KEY`).
2. Запустить backend и frontend.
3. В UI пройти сценарий: login → create meeting → upload `.ogg` → process audio.
4. В review-screen отредактировать один пункт, подтвердить нужные пункты, один пункт отклонить и завершить проверку.
5. Убедиться, что подтверждённые решения/поручения появились в итогах, а кандидат — в архиве.
6. Обновить страницу и убедиться, что результат и история сохранились.

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
- после review создаются только одобренные `Decision` и `Assignment`
- повторный PUT review того же кандидата возвращает `409`
- другой пользователь не получает доступ к встрече или кандидату владельца
- ошибки возвращаются честно (без фиктивных ответов), если нет ключа/квоты
