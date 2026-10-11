import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { formatAssignmentDeadline } from "./deadline";
import { ReviewPanel } from "./ReviewPanel";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";
async function apiFetch(path, init, token) {
    const headers = new Headers(init?.headers ?? {});
    if (!(init?.body instanceof FormData))
        headers.set("content-type", "application/json");
    if (token)
        headers.set("authorization", `Bearer ${token}`);
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
    const [accessToken, setAccessToken] = useState(null);
    const [meetingTitle, setMeetingTitle] = useState("Планёрка");
    const [materialText, setMaterialText] = useState("Согласовали обновить FAQ. Ирина готовит черновик до пятницы.");
    const [modelOverride, setModelOverride] = useState("");
    const [audioFile, setAudioFile] = useState(null);
    const [meetings, setMeetings] = useState([]);
    const [selectedMeetingId, setSelectedMeetingId] = useState(null);
    const [meetingDetail, setMeetingDetail] = useState(null);
    const [run, setRun] = useState(null);
    const [message, setMessage] = useState("");
    const [busy, setBusy] = useState(false);
    const selectedMeeting = useMemo(() => meetings.find((item) => item.id === selectedMeetingId) ?? null, [meetings, selectedMeetingId]);
    const pendingCandidate = useMemo(() => {
        if (!meetingDetail)
            return null;
        for (const processingRun of meetingDetail.processingRuns) {
            const candidate = processingRun.resultCandidates.find((item) => item.reviewStatus === "pending");
            if (candidate)
                return candidate;
        }
        return null;
    }, [meetingDetail]);
    const loadMeeting = async (meetingId, token = accessToken) => {
        if (!token)
            return;
        const response = await apiFetch(`/api/meetings/${meetingId}`, {}, token);
        setMeetingDetail(response.item);
    };
    const refreshMeetings = async (token = accessToken, preferredMeetingId) => {
        if (!token)
            return;
        const response = await apiFetch("/api/meetings", {}, token);
        const items = response.items;
        setMeetings(items);
        const nextId = preferredMeetingId ?? selectedMeetingId ?? items[0]?.id ?? null;
        setSelectedMeetingId(nextId);
        if (nextId)
            await loadMeeting(nextId, token);
    };
    useEffect(() => {
        if (accessToken && selectedMeetingId)
            void loadMeeting(selectedMeetingId);
    }, [accessToken, selectedMeetingId]);
    const withBusy = async (action) => {
        setBusy(true);
        try {
            await action();
        }
        catch (error) {
            setMessage(error instanceof Error ? error.message : "Неизвестная ошибка");
        }
        finally {
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
    const login = (event) => {
        event.preventDefault();
        void withBusy(async () => {
            const data = (await apiFetch("/api/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password })
            }));
            setAccessToken(data.accessToken);
            setMessage(`Вход выполнен: ${data.user.email}`);
            await refreshMeetings(data.accessToken);
        });
    };
    const logout = () => {
        if (!accessToken)
            return;
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
    const createMeeting = (event) => {
        event.preventDefault();
        if (!accessToken)
            return;
        void withBusy(async () => {
            const response = await apiFetch("/api/meetings", { method: "POST", body: JSON.stringify({ title: meetingTitle, timeZone: "Europe/Moscow" }) }, accessToken);
            await refreshMeetings(accessToken, response.item.id);
            await loadMeeting(response.item.id, accessToken);
            setMessage("Встреча создана");
        });
    };
    const pollRun = async (runId) => {
        if (!accessToken)
            return;
        let lastRun = null;
        for (let index = 0; index < 120; index += 1) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            const response = await apiFetch(`/api/meetings/processing/${runId}`, {}, accessToken);
            lastRun = response.item;
            setRun(lastRun);
            if (["succeeded", "failed", "cancelled"].includes(lastRun.status))
                break;
        }
        if (lastRun?.status === "failed")
            throw new Error(`Обработка завершилась ошибкой: ${lastRun.errorMessage ?? "unknown"}`);
        if (lastRun?.status === "succeeded" && selectedMeetingId) {
            await loadMeeting(selectedMeetingId, accessToken);
            setMessage("Обработка завершена. Проверьте найденные пункты.");
        }
    };
    const processBody = () => {
        const model = modelOverride.trim();
        return model ? { modelOverride: model } : {};
    };
    const processText = (event) => {
        event.preventDefault();
        if (!accessToken || !selectedMeetingId)
            return;
        void withBusy(async () => {
            await apiFetch(`/api/meetings/${selectedMeetingId}/materials/text`, { method: "POST", body: JSON.stringify({ contentText: materialText, kind: "note" }) }, accessToken);
            const started = await apiFetch(`/api/meetings/${selectedMeetingId}/process-latest-text`, { method: "POST", body: JSON.stringify(processBody()) }, accessToken);
            setMessage("Обрабатываем текст…");
            await pollRun(started.runId);
        });
    };
    const uploadAudio = (event) => {
        event.preventDefault();
        if (!accessToken || !selectedMeetingId || !audioFile)
            return;
        void withBusy(async () => {
            const formData = new FormData();
            formData.set("audio", audioFile);
            await apiFetch(`/api/meetings/${selectedMeetingId}/materials/audio`, { method: "POST", body: formData }, accessToken);
            await loadMeeting(selectedMeetingId, accessToken);
            setMessage(`Аудио загружено: ${audioFile.name}`);
        });
    };
    const processAudio = () => {
        if (!accessToken || !selectedMeetingId)
            return;
        void withBusy(async () => {
            const started = await apiFetch(`/api/meetings/${selectedMeetingId}/process-latest-audio`, { method: "POST", body: JSON.stringify(processBody()) }, accessToken);
            setMessage("Распознаём и анализируем аудио…");
            await pollRun(started.runId);
        });
    };
    const reviewCandidate = async (review) => {
        if (!accessToken || !selectedMeetingId || !pendingCandidate)
            return;
        await withBusy(async () => {
            const response = await apiFetch(`/api/meetings/${selectedMeetingId}/candidates/${pendingCandidate.id}/review`, { method: "PUT", body: JSON.stringify(review) }, accessToken);
            await loadMeeting(selectedMeetingId, accessToken);
            setMessage(`Проверка сохранена: решений ${response.created.decisions}, поручений ${response.created.assignments}`);
        });
    };
    return (_jsxs("main", { className: "app-shell", children: [_jsxs("header", { className: "app-header", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "Stage 1 \u00B7 \u0447\u0435\u043B\u043E\u0432\u0435\u043A \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0430\u0435\u0442 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442" }), _jsx("h1", { children: "AI-\u0434\u0430-\u0421\u0435\u043A\u0440\u0435\u0442\u0430\u0440\u044C" }), _jsx("p", { children: "\u041C\u0430\u0442\u0435\u0440\u0438\u0430\u043B \u0432\u0441\u0442\u0440\u0435\u0447\u0438 \u2192 AI-\u0447\u0435\u0440\u043D\u043E\u0432\u0438\u043A \u2192 \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u2192 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0451\u043D\u043D\u044B\u0435 \u0440\u0435\u0448\u0435\u043D\u0438\u044F \u0438 \u043F\u043E\u0440\u0443\u0447\u0435\u043D\u0438\u044F." })] }), accessToken && _jsx("button", { className: "secondary-button", type: "button", onClick: logout, disabled: busy, children: "\u0412\u044B\u0439\u0442\u0438" })] }), message && _jsx("p", { className: "message", role: "status", children: message }), !accessToken ? (_jsxs("section", { className: "panel stack auth-panel", children: [_jsx("h2", { children: "\u0412\u0445\u043E\u0434" }), _jsxs("form", { className: "stack", onSubmit: login, children: [_jsxs("label", { children: ["Email", _jsx("input", { value: email, onChange: (event) => setEmail(event.target.value), type: "email" })] }), _jsxs("label", { children: ["\u041F\u0430\u0440\u043E\u043B\u044C", _jsx("input", { value: password, onChange: (event) => setPassword(event.target.value), type: "password" })] }), _jsxs("div", { className: "row", children: [_jsx("button", { className: "secondary-button", type: "button", onClick: register, disabled: busy, children: "\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044F" }), _jsx("button", { className: "primary-button", type: "submit", disabled: busy, children: "\u0412\u043E\u0439\u0442\u0438" })] })] })] })) : (_jsxs("div", { className: "workspace", children: [_jsxs("aside", { className: "sidebar", children: [_jsxs("section", { className: "panel", children: [_jsx("h2", { children: "\u0412\u0441\u0442\u0440\u0435\u0447\u0438" }), _jsxs("form", { className: "stack", onSubmit: createMeeting, children: [_jsx("input", { value: meetingTitle, onChange: (event) => setMeetingTitle(event.target.value), placeholder: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435" }), _jsx("button", { className: "primary-button", type: "submit", disabled: busy, children: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0432\u0441\u0442\u0440\u0435\u0447\u0443" })] }), _jsx("ul", { className: "meeting-list", children: meetings.map((meeting) => (_jsx("li", { children: _jsx("button", { type: "button", className: meeting.id === selectedMeetingId ? "meeting-button active" : "meeting-button", onClick: () => setSelectedMeetingId(meeting.id), children: meeting.title }) }, meeting.id))) })] }), _jsxs("section", { className: "panel stack", children: [_jsx("h3", { children: "\u041C\u043E\u0434\u0435\u043B\u044C" }), _jsx("p", { className: "muted", children: "\u041E\u0441\u0442\u0430\u0432\u044C\u0442\u0435 \u043F\u0443\u0441\u0442\u044B\u043C \u0434\u043B\u044F \u0441\u0435\u0440\u0432\u0435\u0440\u043D\u043E\u0439 \u043C\u043E\u0434\u0435\u043B\u0438 \u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E." }), _jsx("input", { value: modelOverride, onChange: (event) => setModelOverride(event.target.value), placeholder: "\u041D\u0430\u043F\u0440\u0438\u043C\u0435\u0440, gpt-4o-mini" })] })] }), _jsxs("div", { className: "content", children: [_jsxs("section", { className: "panel stack", children: [_jsxs("div", { className: "review-header", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "\u0412\u044B\u0431\u0440\u0430\u043D\u0430 \u0432\u0441\u0442\u0440\u0435\u0447\u0430" }), _jsx("h2", { children: selectedMeeting?.title ?? "Выберите встречу" })] }), _jsx("button", { className: "secondary-button", type: "button", onClick: () => void refreshMeetings(), disabled: busy, children: "\u041E\u0431\u043D\u043E\u0432\u0438\u0442\u044C" })] }), _jsxs("form", { className: "stack", onSubmit: processText, children: [_jsxs("label", { children: ["\u0422\u0435\u043A\u0441\u0442 \u0432\u0441\u0442\u0440\u0435\u0447\u0438", _jsx("textarea", { value: materialText, onChange: (event) => setMaterialText(event.target.value), rows: 6 })] }), _jsx("button", { className: "primary-button", type: "submit", disabled: busy || !selectedMeetingId, children: "\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0438 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u0430\u0442\u044C \u0442\u0435\u043A\u0441\u0442" })] }), _jsxs("form", { className: "stack", onSubmit: uploadAudio, children: [_jsxs("label", { children: ["\u0410\u0443\u0434\u0438\u043E\u0444\u0430\u0439\u043B", _jsx("input", { type: "file", accept: "audio/*,.ogg", onChange: (event) => setAudioFile(event.target.files?.[0] ?? null) })] }), _jsxs("div", { className: "row", children: [_jsx("button", { className: "secondary-button", type: "submit", disabled: busy || !audioFile, children: "\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0430\u0443\u0434\u0438\u043E" }), _jsx("button", { className: "primary-button", type: "button", onClick: processAudio, disabled: busy || !selectedMeetingId, children: "\u041E\u0431\u0440\u0430\u0431\u043E\u0442\u0430\u0442\u044C \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0435\u0435 \u0430\u0443\u0434\u0438\u043E" })] })] })] }), run && _jsxs("section", { className: "panel run-status", children: [_jsx("strong", { children: "\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u044F\u044F \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0430" }), _jsx("span", { className: `status-badge ${run.status}`, children: run.status })] }), pendingCandidate ? (_jsx(ReviewPanel, { candidate: pendingCandidate, busy: busy, onSubmit: reviewCandidate })) : (_jsx("section", { className: "panel empty-state", children: meetingDetail ? "Нет черновиков, ожидающих проверки." : "Выберите встречу для просмотра результатов." })), meetingDetail && (meetingDetail.decisions.length > 0 || meetingDetail.assignments.length > 0) && (_jsxs("section", { className: "panel", children: [_jsx("h2", { children: "\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0451\u043D\u043D\u044B\u0435 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u044B" }), _jsxs("div", { className: "confirmed-grid", children: [_jsxs("div", { children: [_jsx("h3", { children: "\u0420\u0435\u0448\u0435\u043D\u0438\u044F" }), _jsx("ul", { className: "confirmed-list", children: meetingDetail.decisions.map((item) => _jsxs("li", { children: [item.text, item.sourceQuote && _jsxs("div", { className: "source-note", children: ["\u00AB", item.sourceQuote, "\u00BB"] })] }, item.id)) })] }), _jsxs("div", { children: [_jsx("h3", { children: "\u041F\u043E\u0440\u0443\u0447\u0435\u043D\u0438\u044F" }), _jsx("ul", { className: "confirmed-list", children: meetingDetail.assignments.map((item) => _jsxs("li", { children: [item.description, " \u00B7 ", item.assigneeName ?? "исполнитель не указан", " \u00B7 ", formatAssignmentDeadline(item), _jsxs("div", { className: "source-note", children: ["\u0421\u0442\u0430\u0442\u0443\u0441: ", item.status] })] }, item.id)) })] })] })] })), meetingDetail?.processingRuns.some((item) => item.resultCandidates.some((candidate) => candidate.reviewStatus !== "pending")) && (_jsxs("section", { className: "panel", children: [_jsx("h2", { children: "\u0410\u0440\u0445\u0438\u0432 \u043F\u0440\u043E\u0432\u0435\u0440\u043E\u043A" }), _jsx("div", { className: "archive-list", children: meetingDetail.processingRuns.flatMap((item) => item.resultCandidates).filter((candidate) => candidate.reviewStatus !== "pending").map((candidate) => (_jsxs("article", { className: "archive-card", children: [_jsxs("div", { className: "review-header", children: [_jsx("strong", { children: candidate.summary }), _jsx("span", { className: `status-badge ${candidate.reviewStatus}`, children: candidate.reviewStatus })] }), _jsxs("p", { className: "source-note", children: ["\u0420\u0435\u0448\u0435\u043D\u0438\u044F: ", candidate.payloadJson.decisions.length, "; \u043F\u043E\u0440\u0443\u0447\u0435\u043D\u0438\u044F: ", candidate.payloadJson.assignments.length, "; \u0432\u043E\u043F\u0440\u043E\u0441\u044B: ", candidate.payloadJson.questions.length, "; \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F: ", candidate.payloadJson.information.length] }), candidate.history?.[0] && _jsx("p", { className: "source-note", children: candidate.history[0].comment ?? "Проверено пользователем" })] }, candidate.id))) })] }))] })] }))] }));
}
