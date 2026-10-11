import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from "react";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";
async function apiFetch(path, init, token) {
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
    const [accessToken, setAccessToken] = useState(null);
    const [meetingTitle, setMeetingTitle] = useState("Планёрка");
    const [materialText, setMaterialText] = useState("Согласовали обновить FAQ. Ирина готовит черновик до пятницы.");
    const [modelOverride, setModelOverride] = useState("");
    const [audioFile, setAudioFile] = useState(null);
    const [meetings, setMeetings] = useState([]);
    const [selectedMeetingId, setSelectedMeetingId] = useState(null);
    const [run, setRun] = useState(null);
    const [message, setMessage] = useState("");
    const isAuthed = Boolean(accessToken);
    const selectedMeeting = useMemo(() => meetings.find((item) => item.id === selectedMeetingId) ?? null, [meetings, selectedMeetingId]);
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
    const handleRegister = async (event) => {
        event.preventDefault();
        try {
            await apiFetch("/api/auth/register", {
                method: "POST",
                body: JSON.stringify({ email, password, displayName: "Demo User" })
            });
            setMessage("Пользователь создан. Теперь войдите.");
        }
        catch (error) {
            setMessage(error instanceof Error ? error.message : "Ошибка регистрации");
        }
    };
    const handleLogin = async (event) => {
        event.preventDefault();
        try {
            const data = (await apiFetch("/api/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password })
            }));
            setAccessToken(data.accessToken);
            setMessage(`Вход выполнен: ${data.user.email}`);
            await refreshMeetings();
        }
        catch (error) {
            setMessage(error instanceof Error ? error.message : "Ошибка входа");
        }
    };
    const handleCreateMeeting = async (event) => {
        event.preventDefault();
        if (!accessToken) {
            return;
        }
        try {
            const response = await apiFetch("/api/meetings", {
                method: "POST",
                body: JSON.stringify({ title: meetingTitle, timeZone: "Europe/Moscow" })
            }, accessToken);
            setSelectedMeetingId(response.item.id);
            await refreshMeetings();
            setMessage("Встреча создана");
        }
        catch (error) {
            setMessage(error instanceof Error ? error.message : "Ошибка создания встречи");
        }
    };
    const pollRun = async (runId) => {
        if (!accessToken) {
            return;
        }
        let lastRun = null;
        for (let index = 0; index < 30; index += 1) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            const statusResp = await apiFetch(`/api/meetings/processing/${runId}`, {}, accessToken);
            lastRun = statusResp.item;
            setRun(lastRun);
            if (["succeeded", "failed", "cancelled"].includes(lastRun.status)) {
                break;
            }
        }
        if (lastRun?.status === "failed") {
            setMessage(`Обработка завершилась ошибкой: ${lastRun.errorMessage ?? "unknown"}`);
        }
        else if (lastRun?.status === "succeeded") {
            setMessage("Обработка завершена успешно");
        }
    };
    const buildProcessRunBody = () => {
        const trimmed = modelOverride.trim();
        return trimmed.length > 0 ? { modelOverride: trimmed } : {};
    };
    const handleProcessText = async (event) => {
        event.preventDefault();
        if (!accessToken || !selectedMeetingId) {
            return;
        }
        try {
            await apiFetch(`/api/meetings/${selectedMeetingId}/materials/text`, {
                method: "POST",
                body: JSON.stringify({ contentText: materialText, kind: "note" })
            }, accessToken);
            const runStart = await apiFetch(`/api/meetings/${selectedMeetingId}/process-latest-text`, {
                method: "POST",
                body: JSON.stringify(buildProcessRunBody())
            }, accessToken);
            setMessage(`Text run запущен: ${runStart.runId}`);
            await pollRun(runStart.runId);
        }
        catch (error) {
            setMessage(error instanceof Error ? error.message : "Ошибка обработки текста");
        }
    };
    const handleUploadAudio = async (event) => {
        event.preventDefault();
        if (!accessToken || !selectedMeetingId || !audioFile) {
            return;
        }
        try {
            const formData = new FormData();
            formData.set("audio", audioFile);
            await apiFetch(`/api/meetings/${selectedMeetingId}/materials/audio`, {
                method: "POST",
                body: formData
            }, accessToken);
            setMessage(`Аудио загружено: ${audioFile.name}`);
        }
        catch (error) {
            setMessage(error instanceof Error ? error.message : "Ошибка загрузки аудио");
        }
    };
    const handleProcessAudio = async () => {
        if (!accessToken || !selectedMeetingId) {
            return;
        }
        try {
            const runStart = await apiFetch(`/api/meetings/${selectedMeetingId}/process-latest-audio`, {
                method: "POST",
                body: JSON.stringify(buildProcessRunBody())
            }, accessToken);
            setMessage(`Audio run запущен: ${runStart.runId}`);
            await pollRun(runStart.runId);
        }
        catch (error) {
            setMessage(error instanceof Error ? error.message : "Ошибка обработки аудио");
        }
    };
    const handleAudioSelect = (event) => {
        const file = event.target.files?.[0] ?? null;
        setAudioFile(file);
    };
    return (_jsxs("main", { style: { maxWidth: 860, margin: "24px auto", fontFamily: "Inter, sans-serif", padding: "0 12px" }, children: [_jsx("h1", { children: "AI-\u0434\u0430-\u0421\u0435\u043A\u0440\u0435\u0442\u0430\u0440\u044C" }), _jsx("p", { children: "\u0422\u0435\u0441\u0442\u043E\u0432\u044B\u0439 \u043A\u043E\u043D\u0442\u0443\u0440: auth \u2192 meeting \u2192 model override \u2192 text/audio \u2192 processing run." }), _jsxs("section", { style: { border: "1px solid #ddd", padding: 12, borderRadius: 8, marginBottom: 12 }, children: [_jsx("h2", { children: "1) \u0414\u043E\u0441\u0442\u0443\u043F" }), _jsxs("form", { onSubmit: handleRegister, style: { display: "grid", gap: 8, marginBottom: 8 }, children: [_jsx("input", { value: email, onChange: (e) => setEmail(e.target.value), placeholder: "Email" }), _jsx("input", { value: password, onChange: (e) => setPassword(e.target.value), placeholder: "Password", type: "password" }), _jsx("button", { type: "submit", children: "\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044F" })] }), _jsx("form", { onSubmit: handleLogin, style: { display: "grid", gap: 8 }, children: _jsx("button", { type: "submit", children: "\u0412\u043E\u0439\u0442\u0438" }) })] }), isAuthed && (_jsxs(_Fragment, { children: [_jsxs("section", { style: { border: "1px solid #ddd", padding: 12, borderRadius: 8, marginBottom: 12 }, children: [_jsx("h2", { children: "2) \u0412\u0441\u0442\u0440\u0435\u0447\u0438" }), _jsxs("form", { onSubmit: handleCreateMeeting, style: { display: "flex", gap: 8 }, children: [_jsx("input", { value: meetingTitle, onChange: (event) => setMeetingTitle(event.target.value), placeholder: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0432\u0441\u0442\u0440\u0435\u0447\u0438", style: { flex: 1 } }), _jsx("button", { type: "submit", children: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C" }), _jsx("button", { type: "button", onClick: () => void refreshMeetings(), children: "\u041E\u0431\u043D\u043E\u0432\u0438\u0442\u044C \u0441\u043F\u0438\u0441\u043E\u043A" })] }), _jsx("ul", { children: meetings.map((meeting) => (_jsx("li", { children: _jsx("button", { type: "button", onClick: () => setSelectedMeetingId(meeting.id), children: meeting.title }) }, meeting.id))) }), _jsxs("p", { children: ["\u0412\u044B\u0431\u0440\u0430\u043D\u0430: ", selectedMeeting?.title ?? "—"] })] }), _jsxs("section", { style: { border: "1px solid #ddd", padding: 12, borderRadius: 8, marginBottom: 12 }, children: [_jsx("h2", { children: "3) \u041C\u043E\u0434\u0435\u043B\u044C LLM (optional override)" }), _jsx("p", { style: { marginTop: 0, color: "#555" }, children: "\u041F\u0443\u0441\u0442\u043E = backend default (`OPENAI_MODEL`). \u0414\u043B\u044F \u043A\u043E\u043D\u043A\u0440\u0435\u0442\u043D\u043E\u0433\u043E run \u043C\u043E\u0436\u043D\u043E \u0443\u043A\u0430\u0437\u0430\u0442\u044C override, \u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440 `gpt-6-luna` \u0438\u043B\u0438 `gpt-6.1-sol`." }), _jsx("input", { value: modelOverride, onChange: (event) => setModelOverride(event.target.value), placeholder: "\u041E\u043F\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u043E: gpt-6-luna / gpt-6.1-sol", style: { width: "100%" } })] }), _jsxs("section", { style: { border: "1px solid #ddd", padding: 12, borderRadius: 8, marginBottom: 12 }, children: [_jsx("h2", { children: "4) \u0422\u0435\u043A\u0441\u0442" }), _jsxs("form", { onSubmit: handleProcessText, style: { display: "grid", gap: 8 }, children: [_jsx("textarea", { value: materialText, onChange: (event) => setMaterialText(event.target.value), rows: 7, placeholder: "\u0422\u0435\u043A\u0441\u0442 \u0432\u0441\u0442\u0440\u0435\u0447\u0438" }), _jsx("button", { type: "submit", disabled: !selectedMeetingId, children: "\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C + \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u0430\u0442\u044C \u0442\u0435\u043A\u0441\u0442" })] })] }), _jsxs("section", { style: { border: "1px solid #ddd", padding: 12, borderRadius: 8, marginBottom: 12 }, children: [_jsx("h2", { children: "5) \u0410\u0443\u0434\u0438\u043E (.ogg)" }), _jsxs("form", { onSubmit: handleUploadAudio, style: { display: "grid", gap: 8 }, children: [_jsx("input", { type: "file", accept: "audio/*,.ogg", onChange: handleAudioSelect }), _jsx("button", { type: "submit", disabled: !selectedMeetingId || !audioFile, children: "\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0430\u0443\u0434\u0438\u043E" })] }), _jsx("button", { type: "button", onClick: () => void handleProcessAudio(), disabled: !selectedMeetingId, children: "\u041E\u0431\u0440\u0430\u0431\u043E\u0442\u0430\u0442\u044C \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0435\u0435 \u0430\u0443\u0434\u0438\u043E" })] }), _jsxs("section", { style: { border: "1px solid #ddd", padding: 12, borderRadius: 8, marginBottom: 12 }, children: [_jsx("h2", { children: "6) \u0421\u0442\u0430\u0442\u0443\u0441 run" }), _jsx("pre", { style: { whiteSpace: "pre-wrap", background: "#f7f7f7", padding: 8, borderRadius: 8 }, children: run ? JSON.stringify(run, null, 2) : "Пока нет processing run" })] })] })), _jsx("p", { style: { color: "#444" }, children: message })] }));
}
