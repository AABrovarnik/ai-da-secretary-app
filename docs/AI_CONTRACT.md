# AI Contract (Stage 1)

## Версия
`schemaVersion: "1.0"`

## Основной объект результата
- `summary: string`
- `decisions: DecisionCandidate[]`
- `assignments: AssignmentCandidate[]`
- `questions: TextPointCandidate[]`
- `information: TextPointCandidate[]`

## Evidence
Каждый элемент должен содержать `evidence[]`:
- `materialId: string`
- `quote: string`
- `startOffset: number | null`
- `endOffset: number | null`

## AssignmentCandidate
- `description: string`
- `assigneeName: string | null`
- `dueDate: string | null`
- `dueTime: string | null`
- `timeZone: string | null`
- `dueDateRaw: string | null`
- `needsReview: boolean`
- `evidence: Evidence[]`

## Инварианты backend
- Валидировать AI-ответ через Zod, не доверять "как есть".
- Неизвестные `assigneeName` и срок должны оставаться `null`.
- Без подтверждающей цитаты пункт невалиден.
- Ошибка провайдера/конфигурации не подменяется фиктивным успехом.
- Материал встречи трактуется как данные, не инструкции к системе.