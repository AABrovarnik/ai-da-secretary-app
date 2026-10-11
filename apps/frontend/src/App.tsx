import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { formatAssignmentDeadline } from "./deadline";
import { ReviewPanel } from "./ReviewPanel";
import type { MeetingDetail, MeetingListItem, ProcessingRun, ResultCandidate, ReviewRequest } from "./types";

type LoginResponse = {
  accessToken: string;
  user: { id: string; email: string; displayName: string | null };
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:4000";

async function apiFetch(path: string, init?: RequestInit, token?: string) {
  const headers = new Headers(init?.headers ?? {});
  if (!(init?.body instanceof FormData)) headers.set("content-type", "application/json");
  if (token) headers.set("authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(typeof payload.error === "string" ? payload.error : `HTTP ${response.status}`);
  }
  return response.status === 204 ? null : response.json();
}

export function App() {
  const [email, setEmail] = useState("demo@example.com");
  const [password, setPassword] = useState("demo12345");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [meetingTitle, setMeetingTitle] = useState("Планёрка");
  const [materialText, setMaterialText] = useState("Согласовали обновить FAQ. Ирина готовит черновик до пятницы.");
  const [modelOverride, setModelOverride] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [meetings, setMeetings] = useState<MeetingListItem[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [meetingDetail, setMeetingDetail] = useState<MeetingDetail | null>(null);
  const [run, setRun] = useState<ProcessingRun | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const selectedMeeting = useMemo(
    () => meetings.find((item) => item.id === selectedMeetingId) ?? null,
    [meetings, selectedMeetingId]
  );

  const pendingCandidate = useMemo<ResultCandidate | null>(() => {
    if (!meetingDetail) return null;
    for (const processingRun of meetingDetail.processingRuns) {
      const candidate = processingRun.resultCandidates.find((item) => item.reviewStatus === "pending");
      if (candidate) return candidate;
    }
    return null;
  }, [meetingDetail]);

  const loadMeeting = async (meetingId: string, token = accessToken) => {
    if (!token) return;
    const response = await apiFetch(`/api/meetings/${meetingId}`, {}, token);
    setMeetingDetail(response.item as MeetingDetail);
  };

  const refreshMeetings = async (token = accessToken, preferredMeetingId?: string) => {
    if (!token) return;
    const response = await apiFetch("/api/meetings", {}, token);
    const items = response.items as MeetingListItem[];
    setMeetings(items);
    const nextId = preferredMeetingId ?? selectedMeetingId ?? items[0]?.id ?? null;
    setSelectedMeetingId(nextId);
    if (nextId) await loadMeeting(nextId, token);
  };

  useEffect(() => {
    if (accessToken && selectedMeetingId) void loadMeeting(selectedMeetingId);
  }, [accessToken, selectedMeetingId]);

  const withBusy = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Неизвестная ошибка");
    } finally {
      setBusy(false);
    }
  };

  const register = () => {
    void withBusy(async () => {
      await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, displayName: "Demo User" })
      });
      setMessage("Пользователь создан. Теперь войдите.");
    });
  };

  const login = (event: FormEvent) => {
    event.preventDefault();
    void withBusy(async () => {
      const data = (await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      })) as LoginResponse;
      setAccessToken(data.accessToken);
      setMessage(`Вход выполнен: ${data.user.email}`);
      await refreshMeetings(data.accessToken);
    });
  };

  const logout = () => {
    if (!accessToken) return;
    void withBusy(async () => {
      await apiFetch("/api/auth/logout", { method: "POST" }, accessToken);
      setAccessToken(null);
      setMeetings([]);
      setMeetingDetail(null);
      setSelectedMeetingId(null);
      setRun(null);
      setMessage("Вы вышли из аккаунта");
    });
  };

  const createMeeting = (event: FormEvent) => {
    event.preventDefault();
    if (!accessToken) return;
    void withBusy(async () => {
      const response = await apiFetch(
        "/api/meetings",
        { method: "POST", body: JSON.stringify({ title: meetingTitle, timeZone: "Europe/Moscow" }) },
        accessToken
      );
      await refreshMeetings(accessToken, response.item.id);
      await loadMeeting(response.item.id, accessToken);
      setMessage("Встреча создана");
    });
  };

  const pollRun = async (runId: string) => {
    if (!accessToken) return;
    let lastRun: ProcessingRun | null = null;
    for (let index = 0; index < 120; index += 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const response = await apiFetch(`/api/meetings/processing/${runId}`, {}, accessToken);
      lastRun = response.item as ProcessingRun;
      setRun(lastRun);
      if (["succeeded", "failed", "cancelled"].includes(lastRun.status)) break;
    }
    if (lastRun?.status === "failed") throw new Error(`Обработка завершилась ошибкой: ${lastRun.errorMessage ?? "unknown"}`);
    if (lastRun?.status === "succeeded" && selectedMeetingId) {
      await loadMeeting(selectedMeetingId, accessToken);
      setMessage("Обработка завершена. Проверьте найденные пункты.");
    }
  };

  const processBody = () => {
    const model = modelOverride.trim();
    return model ? { modelOverride: model } : {};
  };

  const processText = (event: FormEvent) => {
    event.preventDefault();
    if (!accessToken || !selectedMeetingId) return;
    void withBusy(async () => {
      await apiFetch(
        `/api/meetings/${selectedMeetingId}/materials/text`,
        { method: "POST", body: JSON.stringify({ contentText: materialText, kind: "note" }) },
        accessToken
      );
      const started = await apiFetch(
        `/api/meetings/${selectedMeetingId}/process-latest-text`,
        { method: "POST", body: JSON.stringify(processBody()) },
        accessToken
      );
      setMessage("Обрабатываем текст…");
      await pollRun(started.runId);
    });
  };

  const uploadAudio = (event: FormEvent) => {
    event.preventDefault();
    if (!accessToken || !selectedMeetingId || !audioFile) return;
    void withBusy(async () => {
      const formData = new FormData();
      formData.set("audio", audioFile);
      await apiFetch(`/api/meetings/${selectedMeetingId}/materials/audio`, { method: "POST", body: formData }, accessToken);
      await loadMeeting(selectedMeetingId, accessToken);
      setMessage(`Аудио загружено: ${audioFile.name}`);
    });
  };

  const processAudio = () => {
    if (!accessToken || !selectedMeetingId) return;
    void withBusy(async () => {
      const started = await apiFetch(
        `/api/meetings/${selectedMeetingId}/process-latest-audio`,
        { method: "POST", body: JSON.stringify(processBody()) },
        accessToken
      );
      setMessage("Распознаём и анализируем аудио…");
      await pollRun(started.runId);
    });
  };

  const reviewCandidate = async (review: ReviewRequest) => {
    if (!accessToken || !selectedMeetingId || !pendingCandidate) return;
    await withBusy(async () => {
      const response = await apiFetch(
        `/api/meetings/${selectedMeetingId}/candidates/${pendingCandidate.id}/review`,
        { method: "PUT", body: JSON.stringify(review) },
        accessToken
      );
      await loadMeeting(selectedMeetingId, accessToken);
      setMessage(`Проверка сохранена: решений ${response.created.decisions}, поручений ${response.created.assignments}`);
    });
  };

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Stage 1 · человек подтверждает результат</p>
          <h1>AI-да-Секретарь</h1>
          <p>Материал встречи → AI-черновик → проверка → подтверждённые решения и поручения.</p>
        </div>
        {accessToken && <button className="secondary-button" type="button" onClick={logout} disabled={busy}>Выйти</button>}
      </header>

      {message && <p className="message" role="status">{message}</p>}

      {!accessToken ? (
        <section className="panel stack auth-panel">
          <h2>Вход</h2>
          <form className="stack" onSubmit={login}>
            <label>Email<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" /></label>
            <label>Пароль<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" /></label>
            <div className="row">
              <button className="secondary-button" type="button" onClick={register} disabled={busy}>Регистрация</button>
              <button className="primary-button" type="submit" disabled={busy}>Войти</button>
            </div>
          </form>
        </section>
      ) : (
        <div className="workspace">
          <aside className="sidebar">
            <section className="panel">
              <h2>Встречи</h2>
              <form className="stack" onSubmit={createMeeting}>
                <input value={meetingTitle} onChange={(event) => setMeetingTitle(event.target.value)} placeholder="Название" />
                <button className="primary-button" type="submit" disabled={busy}>Создать встречу</button>
              </form>
              <ul className="meeting-list">
                {meetings.map((meeting) => (
                  <li key={meeting.id}>
                    <button type="button" className={meeting.id === selectedMeetingId ? "meeting-button active" : "meeting-button"} onClick={() => setSelectedMeetingId(meeting.id)}>{meeting.title}</button>
                  </li>
                ))}
              </ul>
            </section>
            <section className="panel stack">
              <h3>Модель</h3>
              <p className="muted">Оставьте пустым для серверной модели по умолчанию.</p>
              <input value={modelOverride} onChange={(event) => setModelOverride(event.target.value)} placeholder="Например, gpt-4o-mini" />
            </section>
          </aside>

          <div className="content">
            <section className="panel stack">
              <div className="review-header">
                <div><p className="eyebrow">Выбрана встреча</p><h2>{selectedMeeting?.title ?? "Выберите встречу"}</h2></div>
                <button className="secondary-button" type="button" onClick={() => void refreshMeetings()} disabled={busy}>Обновить</button>
              </div>
              <form className="stack" onSubmit={processText}>
                <label>Текст встречи<textarea value={materialText} onChange={(event) => setMaterialText(event.target.value)} rows={6} /></label>
                <button className="primary-button" type="submit" disabled={busy || !selectedMeetingId}>Загрузить и обработать текст</button>
              </form>
              <form className="stack" onSubmit={uploadAudio}>
                <label>Аудиофайл<input type="file" accept="audio/*,.ogg" onChange={(event: ChangeEvent<HTMLInputElement>) => setAudioFile(event.target.files?.[0] ?? null)} /></label>
                <div className="row">
                  <button className="secondary-button" type="submit" disabled={busy || !audioFile}>Загрузить аудио</button>
                  <button className="primary-button" type="button" onClick={processAudio} disabled={busy || !selectedMeetingId}>Обработать последнее аудио</button>
                </div>
              </form>
            </section>

            {run && <section className="panel run-status"><strong>Последняя обработка</strong><span className={`status-badge ${run.status}`}>{run.status}</span></section>}

            {pendingCandidate ? (
              <ReviewPanel candidate={pendingCandidate} busy={busy} onSubmit={reviewCandidate} />
            ) : (
              <section className="panel empty-state">{meetingDetail ? "Нет черновиков, ожидающих проверки." : "Выберите встречу для просмотра результатов."}</section>
            )}

            {meetingDetail && (meetingDetail.decisions.length > 0 || meetingDetail.assignments.length > 0) && (
              <section className="panel">
                <h2>Подтверждённые результаты</h2>
                <div className="confirmed-grid">
                  <div><h3>Решения</h3><ul className="confirmed-list">{meetingDetail.decisions.map((item) => <li key={item.id}>{item.text}{item.sourceQuote && <div className="source-note">«{item.sourceQuote}»</div>}</li>)}</ul></div>
                  <div><h3>Поручения</h3><ul className="confirmed-list">{meetingDetail.assignments.map((item) => <li key={item.id}>{item.description} · {item.assigneeName ?? "исполнитель не указан"} · {formatAssignmentDeadline(item)}<div className="source-note">Статус: {item.status}</div></li>)}</ul></div>
                </div>
              </section>
            )}

            {meetingDetail?.processingRuns.some((item) => item.resultCandidates.some((candidate) => candidate.reviewStatus !== "pending")) && (
              <section className="panel">
                <h2>Архив проверок</h2>
                <div className="archive-list">
                  {meetingDetail.processingRuns.flatMap((item) => item.resultCandidates).filter((candidate) => candidate.reviewStatus !== "pending").map((candidate) => (
                    <article className="archive-card" key={candidate.id}>
                      <div className="review-header">
                        <strong>{candidate.summary}</strong>
                        <span className={`status-badge ${candidate.reviewStatus}`}>{candidate.reviewStatus}</span>
                      </div>
                      <p className="source-note">
                        Решения: {candidate.payloadJson.decisions.length}; поручения: {candidate.payloadJson.assignments.length}; вопросы: {candidate.payloadJson.questions.length}; информация: {candidate.payloadJson.information.length}
                      </p>
                      {candidate.history?.[0] && <p className="source-note">{candidate.history[0].comment ?? "Проверено пользователем"}</p>}
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
