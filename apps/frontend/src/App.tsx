import { ChangeEvent, FormEvent, useMemo, useState } from "react";

type LoginResponse = {
  accessToken: string;
  user: { id: string; email: string; displayName: string | null };
};

type Meeting = {
  id: string;
  title: string;
};

type ProcessingRun = {
  id: string;
  status: string;
  errorMessage: string | null;
  resultCandidates: Array<{ id: string; summary: string }>;
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:4000";

async function apiFetch(path: string, init?: RequestInit, token?: string) {
  const headers = new Headers(init?.headers ?? {});
  if (!(init?.body instanceof FormData)) {
    headers.set("content-type", "application/json");
  }

  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error ?? `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export function App() {
  const [email, setEmail] = useState("demo@example.com");
  const [password, setPassword] = useState("demo12345");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [meetingTitle, setMeetingTitle] = useState("Планёрка");
  const [materialText, setMaterialText] = useState("Согласовали обновить FAQ. Ирина готовит черновик до пятницы.");
  const [modelOverride, setModelOverride] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [run, setRun] = useState<ProcessingRun | null>(null);
  const [message, setMessage] = useState<string>("");

  const isAuthed = Boolean(accessToken);
  const selectedMeeting = useMemo(
    () => meetings.find((item) => item.id === selectedMeetingId) ?? null,
    [meetings, selectedMeetingId]
  );

  const refreshMeetings = async () => {
    if (!accessToken) {
      return;
    }
    const response = await apiFetch("/api/meetings", {}, accessToken);
    setMeetings(response.items);
    if (!selectedMeetingId && response.items[0]) {
      setSelectedMeetingId(response.items[0].id);
    }
  };

  const handleRegister = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, displayName: "Demo User" })
      });
      setMessage("Пользователь создан. Теперь войдите.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ошибка регистрации");
    }
  };

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const data = (await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      })) as LoginResponse;
      setAccessToken(data.accessToken);
      setMessage(`Вход выполнен: ${data.user.email}`);
      await refreshMeetings();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ошибка входа");
    }
  };

  const handleCreateMeeting = async (event: FormEvent) => {
    event.preventDefault();
    if (!accessToken) {
      return;
    }

    try {
      const response = await apiFetch(
        "/api/meetings",
        {
          method: "POST",
          body: JSON.stringify({ title: meetingTitle, timeZone: "Europe/Moscow" })
        },
        accessToken
      );

      setSelectedMeetingId(response.item.id);
      await refreshMeetings();
      setMessage("Встреча создана");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ошибка создания встречи");
    }
  };

  const pollRun = async (runId: string) => {
    if (!accessToken) {
      return;
    }

    let lastRun: ProcessingRun | null = null;
    for (let index = 0; index < 30; index += 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const statusResp = await apiFetch(`/api/meetings/processing/${runId}`, {}, accessToken);
      lastRun = statusResp.item as ProcessingRun;
      setRun(lastRun);
      if (["succeeded", "failed", "cancelled"].includes(lastRun.status)) {
        break;
      }
    }

    if (lastRun?.status === "failed") {
      setMessage(`Обработка завершилась ошибкой: ${lastRun.errorMessage ?? "unknown"}`);
    } else if (lastRun?.status === "succeeded") {
      setMessage("Обработка завершена успешно");
    }
  };

  const buildProcessRunBody = () => {
    const trimmed = modelOverride.trim();
    return trimmed.length > 0 ? { modelOverride: trimmed } : {};
  };

  const handleProcessText = async (event: FormEvent) => {
    event.preventDefault();
    if (!accessToken || !selectedMeetingId) {
      return;
    }

    try {
      await apiFetch(
        `/api/meetings/${selectedMeetingId}/materials/text`,
        {
          method: "POST",
          body: JSON.stringify({ contentText: materialText, kind: "note" })
        },
        accessToken
      );

      const runStart = await apiFetch(
        `/api/meetings/${selectedMeetingId}/process-latest-text`,
        {
          method: "POST",
          body: JSON.stringify(buildProcessRunBody())
        },
        accessToken
      );

      setMessage(`Text run запущен: ${runStart.runId}`);
      await pollRun(runStart.runId);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ошибка обработки текста");
    }
  };

  const handleUploadAudio = async (event: FormEvent) => {
    event.preventDefault();
    if (!accessToken || !selectedMeetingId || !audioFile) {
      return;
    }

    try {
      const formData = new FormData();
      formData.set("audio", audioFile);

      await apiFetch(
        `/api/meetings/${selectedMeetingId}/materials/audio`,
        {
          method: "POST",
          body: formData
        },
        accessToken
      );

      setMessage(`Аудио загружено: ${audioFile.name}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ошибка загрузки аудио");
    }
  };

  const handleProcessAudio = async () => {
    if (!accessToken || !selectedMeetingId) {
      return;
    }

    try {
      const runStart = await apiFetch(
        `/api/meetings/${selectedMeetingId}/process-latest-audio`,
        {
          method: "POST",
          body: JSON.stringify(buildProcessRunBody())
        },
        accessToken
      );

      setMessage(`Audio run запущен: ${runStart.runId}`);
      await pollRun(runStart.runId);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ошибка обработки аудио");
    }
  };

  const handleAudioSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setAudioFile(file);
  };

  return (
    <main style={{ maxWidth: 860, margin: "24px auto", fontFamily: "Inter, sans-serif", padding: "0 12px" }}>
      <h1>AI-да-Секретарь</h1>
      <p>Тестовый контур: auth → meeting → model override → text/audio → processing run.</p>

      <section style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8, marginBottom: 12 }}>
        <h2>1) Доступ</h2>
        <form onSubmit={handleRegister} style={{ display: "grid", gap: 8, marginBottom: 8 }}>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" />
          <button type="submit">Регистрация</button>
        </form>
        <form onSubmit={handleLogin} style={{ display: "grid", gap: 8 }}>
          <button type="submit">Войти</button>
        </form>
      </section>

      {isAuthed && (
        <>
          <section style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8, marginBottom: 12 }}>
            <h2>2) Встречи</h2>
            <form onSubmit={handleCreateMeeting} style={{ display: "flex", gap: 8 }}>
              <input
                value={meetingTitle}
                onChange={(event) => setMeetingTitle(event.target.value)}
                placeholder="Название встречи"
                style={{ flex: 1 }}
              />
              <button type="submit">Создать</button>
              <button type="button" onClick={() => void refreshMeetings()}>
                Обновить список
              </button>
            </form>
            <ul>
              {meetings.map((meeting) => (
                <li key={meeting.id}>
                  <button type="button" onClick={() => setSelectedMeetingId(meeting.id)}>
                    {meeting.title}
                  </button>
                </li>
              ))}
            </ul>
            <p>Выбрана: {selectedMeeting?.title ?? "—"}</p>
          </section>

          <section style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8, marginBottom: 12 }}>
            <h2>3) Модель LLM (optional override)</h2>
            <p style={{ marginTop: 0, color: "#555" }}>
              Пусто = backend default (`OPENAI_MODEL`). Для конкретного run можно указать override, например `gpt-6-luna` или `gpt-6.1-sol`.
            </p>
            <input
              value={modelOverride}
              onChange={(event) => setModelOverride(event.target.value)}
              placeholder="Опционально: gpt-6-luna / gpt-6.1-sol"
              style={{ width: "100%" }}
            />
          </section>

          <section style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8, marginBottom: 12 }}>
            <h2>4) Текст</h2>
            <form onSubmit={handleProcessText} style={{ display: "grid", gap: 8 }}>
              <textarea
                value={materialText}
                onChange={(event) => setMaterialText(event.target.value)}
                rows={7}
                placeholder="Текст встречи"
              />
              <button type="submit" disabled={!selectedMeetingId}>
                Загрузить + обработать текст
              </button>
            </form>
          </section>

          <section style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8, marginBottom: 12 }}>
            <h2>5) Аудио (.ogg)</h2>
            <form onSubmit={handleUploadAudio} style={{ display: "grid", gap: 8 }}>
              <input type="file" accept="audio/*,.ogg" onChange={handleAudioSelect} />
              <button type="submit" disabled={!selectedMeetingId || !audioFile}>
                Загрузить аудио
              </button>
            </form>
            <button type="button" onClick={() => void handleProcessAudio()} disabled={!selectedMeetingId}>
              Обработать последнее аудио
            </button>
          </section>

          <section style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8, marginBottom: 12 }}>
            <h2>6) Статус run</h2>
            <pre style={{ whiteSpace: "pre-wrap", background: "#f7f7f7", padding: 8, borderRadius: 8 }}>
              {run ? JSON.stringify(run, null, 2) : "Пока нет processing run"}
            </pre>
          </section>
        </>
      )}

      <p style={{ color: "#444" }}>{message}</p>
    </main>
  );
}