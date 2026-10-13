import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
function toReviewRequest(candidate) {
    return {
        summary: candidate.payloadJson.summary,
        decisions: candidate.payloadJson.decisions.map((item) => ({ ...item, action: "approve" })),
        assignments: candidate.payloadJson.assignments.map((item) => ({ ...item, action: "approve" })),
        questions: candidate.payloadJson.questions.map((item) => ({ ...item, action: "approve" })),
        information: candidate.payloadJson.information.map((item) => ({ ...item, action: "approve" })),
        comment: ""
    };
}
function ActionButtons({ value, onChange }) {
    return (_jsxs("div", { className: "review-actions", "aria-label": "\u0420\u0435\u0448\u0435\u043D\u0438\u0435 \u043F\u043E \u043F\u0443\u043D\u043A\u0442\u0443", children: [_jsx("button", { type: "button", className: value === "approve" ? "action-button approve active" : "action-button approve", onClick: () => onChange("approve"), children: "\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044C" }), _jsx("button", { type: "button", className: value === "reject" ? "action-button reject active" : "action-button reject", onClick: () => onChange("reject"), children: "\u041E\u0442\u043A\u043B\u043E\u043D\u0438\u0442\u044C" })] }));
}
function EvidenceQuote({ item }) {
    return _jsxs("blockquote", { className: "evidence-quote", children: [_jsx("span", { children: "\u0418\u0441\u0442\u043E\u0447\u043D\u0438\u043A" }), item.evidence[0]?.quote ?? "Цитата отсутствует"] });
}
export function ReviewPanel({ candidate, busy, onSubmit }) {
    const [review, setReview] = useState(() => toReviewRequest(candidate));
    useEffect(() => setReview(toReviewRequest(candidate)), [candidate]);
    const updateTextPoint = (section, index, patch) => {
        setReview((current) => ({
            ...current,
            [section]: current[section].map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item)
        }));
    };
    const updateAssignment = (index, patch) => {
        setReview((current) => ({
            ...current,
            assignments: current.assignments.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item)
        }));
    };
    const textSection = (title, section, emptyText) => (_jsxs("section", { className: "review-section", children: [_jsxs("div", { className: "section-heading", children: [_jsx("h3", { children: title }), _jsx("span", { className: "count-badge", children: review[section].length })] }), review[section].length === 0 && _jsx("p", { className: "empty-state", children: emptyText }), review[section].map((item, index) => (_jsxs("article", { className: `candidate-card ${item.action}`, children: [_jsxs("label", { children: ["\u0424\u043E\u0440\u043C\u0443\u043B\u0438\u0440\u043E\u0432\u043A\u0430", _jsx("textarea", { value: item.text, onChange: (event) => updateTextPoint(section, index, { text: event.target.value }), rows: 3 })] }), _jsx(EvidenceQuote, { item: item }), _jsx(ActionButtons, { value: item.action, onChange: (action) => updateTextPoint(section, index, { action }) })] }, `${section}-${index}`)))] }));
    return (_jsxs("form", { className: "review-panel", onSubmit: (event) => { event.preventDefault(); void onSubmit(review); }, children: [_jsxs("div", { className: "review-header", children: [_jsxs("div", { children: [_jsxs("p", { className: "eyebrow", children: ["\u0427\u0435\u0440\u043D\u043E\u0432\u0438\u043A AI \u00B7 schema ", candidate.payloadJson.schemaVersion] }), _jsx("h2", { children: "\u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u043E\u0432" })] }), _jsx("span", { className: "status-badge pending", children: "\u041E\u0436\u0438\u0434\u0430\u0435\u0442 \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0438" })] }), _jsxs("label", { className: "summary-field", children: ["\u041A\u0440\u0430\u0442\u043A\u043E\u0435 \u0440\u0435\u0437\u044E\u043C\u0435 \u0432\u0441\u0442\u0440\u0435\u0447\u0438", _jsx("textarea", { value: review.summary, onChange: (event) => setReview((current) => ({ ...current, summary: event.target.value })), rows: 4 })] }), textSection("Решения", "decisions", "Решения не найдены"), _jsxs("section", { className: "review-section", children: [_jsxs("div", { className: "section-heading", children: [_jsx("h3", { children: "\u041F\u043E\u0440\u0443\u0447\u0435\u043D\u0438\u044F" }), _jsx("span", { className: "count-badge", children: review.assignments.length })] }), review.assignments.length === 0 && _jsx("p", { className: "empty-state", children: "\u041F\u043E\u0440\u0443\u0447\u0435\u043D\u0438\u044F \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u044B" }), review.assignments.map((item, index) => (_jsxs("article", { className: `candidate-card ${item.action}`, children: [_jsxs("label", { children: ["\u0417\u0430\u0434\u0430\u0447\u0430", _jsx("textarea", { value: item.description, onChange: (event) => updateAssignment(index, { description: event.target.value }), rows: 3 })] }), _jsxs("div", { className: "field-grid", children: [_jsxs("label", { children: ["\u0418\u0441\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C", _jsx("input", { value: item.assigneeName ?? "", onChange: (event) => updateAssignment(index, { assigneeName: event.target.value || null }), placeholder: "\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D" })] }), _jsxs("label", { children: ["\u0421\u0440\u043E\u043A", _jsx("input", { type: "date", value: item.dueDate ?? "", onChange: (event) => updateAssignment(index, { dueDate: event.target.value || null }) })] }), _jsxs("label", { children: ["\u0412\u0440\u0435\u043C\u044F", _jsx("input", { type: "time", value: item.dueTime ?? "", onChange: (event) => updateAssignment(index, { dueTime: event.target.value || null }) })] })] }), item.needsReview && _jsx("p", { className: "needs-review", children: "\u041D\u0443\u0436\u043D\u043E \u0443\u0442\u043E\u0447\u043D\u0438\u0442\u044C \u0438\u0441\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044F \u0438\u043B\u0438 \u0441\u0440\u043E\u043A" }), _jsx(EvidenceQuote, { item: item }), _jsx(ActionButtons, { value: item.action, onChange: (action) => updateAssignment(index, { action }) })] }, `assignment-${index}`)))] }), textSection("Вопросы", "questions", "Открытые вопросы не найдены"), textSection("Информация", "information", "Информационные пункты не найдены"), _jsxs("label", { children: ["\u041A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0439 \u043A \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0435", _jsx("textarea", { value: review.comment ?? "", onChange: (event) => setReview((current) => ({ ...current, comment: event.target.value })), rows: 2, placeholder: "\u041D\u0435\u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E" })] }), _jsx("button", { className: "primary-button submit-review", type: "submit", disabled: busy, children: busy ? "Сохраняем…" : "Завершить проверку" })] }));
}
