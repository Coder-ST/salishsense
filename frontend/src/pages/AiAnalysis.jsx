import { useEffect, useRef, useState } from "react";

const ACCEPTED = [".json", ".csv", ".xlsx"];
const WATERBODY_TYPES = ["Lake", "River", "Stream", "Pond"];

// finds readings like "110 \u00b5g/L" or "pH is 8.3" so they can be bolded
const BOLD_PATTERN = new RegExp(
    [
        "\\bpH(?:\\s(?:is|of|at))?\\s\\d+(?:\\.\\d+)?",
        "\\d[\\d,]*(?:\\.\\d+)?\\s?(?:\u00b5g/L|\u03bcg/L|mg/L|\u00b0C|micrograms per lit(?:re|er)|milligrams per lit(?:re|er)|degrees Celsius|metres?|meters?|m)\\b",
        "\\b(?:total\\s)?(?:phosphorus|nitrogen)\\b",
        "\\bchlorophyll[-\u2010\u2011\\s]?a\\b",
        "\\bSecchi depth\\b",
        "\\b(?:water\\s)?temperature\\b",
        "\\bdissolved oxygen\\b",
        "\\bwater clarity\\b",
        "\\bpH\\b",
    ].join("|"),
    "gi"
);

function splitBold(text) {
    const parts = [];
    let last = 0;
    for (const m of text.matchAll(BOLD_PATTERN)) {
        if (m.index > last) parts.push({ text: text.slice(last, m.index), bold: false });
        parts.push({ text: m[0], bold: true });
        last = m.index + m[0].length;
    }
    if (last < text.length) parts.push({ text: text.slice(last), bold: false });
    return parts;
}

// bolds the readings in the text
function boldMetrics(text) {
    return splitBold(text).map((part, i) => (part.bold ? <strong key={i}>{part.text}</strong> : part.text));
}

function scoreLevel(score) {
    if (score >= 7) return { label: "Good health", tone: "good" };
    if (score >= 4) return { label: "Moderate health", tone: "moderate" };
    return { label: "Poor health", tone: "poor" };
}

function formatSize(bytes) {
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function AiAnalysis() {
    const [file, setFile] = useState(null);
    const [dragging, setDragging] = useState(false);
    const [error, setError] = useState("");
    const [inputKey, setInputKey] = useState(0);
    const [name, setName] = useState("");
    const [type, setType] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [generateError, setGenerateError] = useState("");

    function pickFile(f) {
        if (!f) return;
        const ok = ACCEPTED.some((ext) => f.name.toLowerCase().endsWith(ext));
        if (!ok) {
            setFile(null);
            setError("That file type is not supported. Please upload a JSON, CSV, or .xlsx file.");
            return;
        }
        setError("");
        setFile(f);
    }

    function removeFile() {
        setFile(null);
        setError("");
        setInputKey((k) => k + 1);
    }

    function onDrop(e) {
        e.preventDefault();
        setDragging(false);
        pickFile(e.dataTransfer.files[0]);
    }

    function exportJson() {
        const { name, type, score, metrics, report } = result;
        const flags = Object.fromEntries(Object.entries(metrics).map(([m, v]) => [m, { value: v.value, flag: v.flag }]));
        const blob = new Blob([JSON.stringify({ name, type, score, flags, insights: report }, null, 2)], { type: "application/json" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${name.trim().replace(/\s+/g, "_") || "analysis"}_analysis.json`;
        link.click();
        URL.revokeObjectURL(link.href);
    }

    const ready = name.trim() !== "" && type !== "" && file !== null;

    async function handleGenerate() {
        // wait until name, type and file are all filled in
        if (!ready || loading) return;

        const form = new FormData();
        form.append("file", file);
        form.append("name", name.trim());
        form.append("type", type.toLowerCase());

        setLoading(true);
        setGenerateError("");
        setResult(null);
        try {
            const res = await fetch("/api/analyze", { method: "POST", body: form });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Something went wrong.");
            setResult(data);
            removeFile();
        } catch (e) {
            setGenerateError(e instanceof TypeError ? "Could not reach the server. Is the backend running?" : e.message);
        } finally {
            setLoading(false);
        }
    }

    // scrolls down to the report once the results show up
    const resultsRef = useRef(null);
    useEffect(() => {
        if (result && resultsRef.current) {
            resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }, [result]);

    // adjusts line spacing so the text ends at the bottom of the score card
    const cardRef = useRef(null);
    const sideRef = useRef(null);
    useEffect(() => {
        function fit() {
            const card = cardRef.current;
            const side = sideRef.current;
            if (!card || !side) return;
            if (window.innerWidth <= 900) {
                side.style.removeProperty("--lh");
                return;
            }
            const paras = [...side.querySelectorAll(".ai-breakdown-text")];
            const fontSize = parseFloat(getComputedStyle(paras[0]).fontSize);
            side.style.setProperty("--lh", "1.9");
            const lines = paras.reduce((n, p) => n + Math.round(p.getBoundingClientRect().height / (fontSize * 1.9)), 0);
            const textHeight = paras.reduce((n, p) => n + p.getBoundingClientRect().height, 0);
            const otherHeight = side.getBoundingClientRect().height - textHeight;
            // small extra for the space under the last line
            const target = card.getBoundingClientRect().height - otherHeight + fontSize * 0.45;
            const lh = Math.min(2.6, Math.max(1.5, target / (lines * fontSize)));
            side.style.setProperty("--lh", lh.toFixed(3));
        }
        fit();
        window.addEventListener("resize", fit);
        document.fonts && document.fonts.ready.then(fit);
        return () => window.removeEventListener("resize", fit);
    }, [result]);

    return (
        <main>
            <section className="banner banner-sm">
                <div className="banner-box">
                    <h1>AI Analysis, Create Change</h1>

                    <p>
                        Submit your own water quality readings of a local lake, stream, or river and get an AI driven
                        score along with actionable steps your community can take.
                    </p>
                </div>
            </section>

            <section className="ai-section">
                <div className="ai-note">
                    <p>
                        Please include at minimum these readings:{" "}
                        <strong>total phosphorus, chlorophyll-a, and Secchi depth</strong> (Secchi depth is not needed for rivers and streams).
                    </p>
                    <p>Optional: total nitrogen, water temperature, dissolved oxygen, and pH. Accepted files: JSON, CSV, or Excel (.xlsx).</p>
                </div>

                <hr className="ai-divider ai-divider-note" />

                <div className="ai-card">
                    <div className="ai-card-top">
                        <svg className="ai-card-wave" viewBox="0 0 1200 70" preserveAspectRatio="none" aria-hidden="true">
                            <path d="M0 40 C150 10 300 8 450 30 C600 52 750 50 900 28 C1020 12 1120 14 1200 26 L1200 70 L0 70 Z" fill="#ffffff" fillOpacity="0.22" />
                            <path d="M0 54 C160 30 320 28 480 46 C640 64 780 62 940 44 C1050 32 1130 34 1200 42 L1200 70 L0 70 Z" fill="#ffffff" />
                        </svg>
                    </div>

                    <div className="ai-card-body">
                    <div className="ai-card-left">
                        <div className="ai-upload-card">
                            <label className="ai-field">
                                <span className="ai-field-label">Name</span>
                                <input
                                    className="ai-input"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Lake Wilderness"
                                />
                            </label>

                            <fieldset className="ai-field ai-field-group">
                                <legend className="ai-field-label">Waterbody Type</legend>
                                <div className="ai-checks">
                                    {WATERBODY_TYPES.map((t) => (
                                        <label className={"ai-check" + (type === t ? " ai-check-on" : "")} key={t}>
                                            <input
                                                type="checkbox"
                                                checked={type === t}
                                                onChange={() => setType(type === t ? "" : t)}
                                            />
                                            {t}
                                        </label>
                                    ))}
                                </div>
                            </fieldset>
                        </div>
                    </div>

                    <div className="ai-card-right">
                        <div className="ai-upload-card">
                        <label
                            className={"ai-upload" + (dragging ? " ai-upload-active" : "")}
                            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                            onDragLeave={() => setDragging(false)}
                            onDrop={onDrop}
                        >
                            <input
                                key={inputKey}
                                type="file"
                                accept={ACCEPTED.join(",")}
                                onChange={(e) => pickFile(e.target.files[0])}
                            />
                            <svg width="84" height="84" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                                <path d="M12 12v9" />
                                <path d="m16 16-4-4-4 4" />
                            </svg>
                            <strong>Drag and drop files here</strong>
                            <span className="ai-upload-or">or</span>
                            <span className="ai-upload-button">Browse files</span>                        </label>

                        {error && <p className="ai-upload-error">{error}</p>}

                        {file && (
                            <div className="ai-file-row">
                                <span className="ai-file-icon">
                                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 3 14 8 19 8" />
                                    </svg>
                                </span>
                                <span className="ai-file-info">
                                    <span className="ai-file-name">{file.name}</span>
                                    <span className="ai-file-size">{formatSize(file.size)}</span>
                                </span>
                                <button type="button" className="ai-file-remove" onClick={removeFile} aria-label={`Remove ${file.name}`}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                    </svg>
                                </button>
                            </div>
                        )}
                        </div>
                    </div>
                    </div>
                </div>

                <div className="ai-generate-row">
                    <button type="button" className="ai-generate" onClick={handleGenerate}>
                        {loading ? "Generating..." : "Generate"}
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="13 6 19 12 13 18" />
                        </svg>
                    </button>
                </div>

                {generateError && <p className="ai-generate-error">{generateError}</p>}

                {result && (
                    <>
                        <hr className="ai-divider" />

                        <div className="ai-results" ref={resultsRef}>
                            <div className="ai-left">
                            <div className="ai-score-card" ref={cardRef}>
                                <div className="ai-score-top">
                                    <span className="ai-score-title">Analysis of {result.name}</span>
                                    <span className={"ai-score-badge ai-score-badge-" + scoreLevel(result.score).tone}>
                                        {scoreLevel(result.score).label}
                                    </span>
                                </div>

                                <div className="ai-gauge">
                                    <svg viewBox="0 0 200 110" aria-hidden="true">
                                        <path className="ai-gauge-track" d="M 20 100 A 80 80 0 0 1 180 100" pathLength="100" />
                                        <path
                                            className={"ai-gauge-fill ai-gauge-fill-" + scoreLevel(result.score).tone}
                                            d="M 20 100 A 80 80 0 0 1 180 100"
                                            pathLength="100"
                                            style={{ "--fill": Math.min(100, Math.max(0, result.score * 10)) }}
                                        />
                                    </svg>
                                    <div className="ai-gauge-number">
                                        <strong>{result.score}</strong>
                                        <span>OUT OF 10</span>
                                    </div>
                                </div>

                                <hr className="ai-score-divider" />

                                <p className="ai-score-summary">
                                    <strong>Summary:</strong> {result.report ? result.report.summary : result.report_error}
                                </p>

                                <div className="ai-indicators">
                                    {result.indicators.map((k) => (
                                        <div className="ai-indicator" key={k.label}>
                                            <div className="ai-indicator-text">
                                                <span className="ai-indicator-name">{k.label}</span>
                                                <span className="ai-indicator-value">{k.value}</span>
                                            </div>
                                            <span className={"ai-flag ai-flag-" + k.flag}>{k.flag}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button type="button" className="ai-export" onClick={exportJson}>
                                Export as JSON
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                    <polyline points="13 6 19 12 13 18" />
                                </svg>
                            </button>
                            </div>

                            {result.report && (
                                <div className="ai-side" ref={sideRef}>
                                    <div className="ai-breakdown">
                                        <h3 className="ai-breakdown-title">Data Breakdown</h3>
                                        <p className="ai-breakdown-text">{boldMetrics(result.report.breakdown)}</p>
                                    </div>

                                    <div className="ai-breakdown">
                                        <h3 className="ai-breakdown-title">Recommended Actions</h3>
                                        <p className="ai-breakdown-text">{boldMetrics(result.report.improvements)}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </section>
        </main>
    );
}

export default AiAnalysis;
