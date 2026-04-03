"use client";
import { useRef, useState } from "react";
import { Theme } from "@/lib/constants";

interface Props {
    T: Theme; dark: boolean;
    phase: string;
    streamedText: string;
    file: File | null;
}

export default function SummaryOutput({ T, dark, phase, streamedText, file }: Props) {
    const outputRef = useRef<HTMLDivElement>(null);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(streamedText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const blob = new Blob([streamedText], { type: "text/plain" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${file?.name?.replace(".pdf", "") || "summary"}_summary.txt`;
        a.click();
    };

    return (
        <div style={{ paddingLeft: "36px", display: "flex", flexDirection: "column" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: "16px", color: T.ink }}>Summary</span>
                    {phase === "processing" && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "3px 10px", background: `rgba(200,134,26,.1)`, border: `1px solid rgba(200,134,26,.25)`, borderRadius: "2px" }}>
                            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: T.gold, animation: "blink 1s infinite" }} />
                            <span style={{ fontFamily: "var(--font-space-mono)", fontSize: "9px", color: T.gold, letterSpacing: ".1em" }}>STREAMING</span>
                        </div>
                    )}
                    {phase === "done" && (
                        <div style={{ padding: "3px 10px", background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.25)", borderRadius: "2px" }}>
                            <span style={{ fontFamily: "var(--font-space-mono)", fontSize: "9px", color: "#16a34a", letterSpacing: ".1em" }}>DONE</span>
                        </div>
                    )}
                </div>
                {(phase === "processing" || phase === "done") && streamedText && (
                    <div style={{ display: "flex", gap: "8px" }}>
                        <button className="action-btn" onClick={handleCopy} style={{ background: copied ? T.gold : dark ? "#1e1c17" : "#f0ede8", color: copied ? (dark ? "#111009" : "#fff") : T.muted, border: `1px solid ${copied ? T.gold : T.border}` }}>
                            {copied ? "✓ COPIED" : "COPY"}
                        </button>
                        {phase === "done" && (
                            <button className="action-btn" onClick={handleDownload} style={{ background: dark ? "#1e1c17" : "#f0ede8", color: T.muted, border: `1px solid ${T.border}` }} onMouseEnter={e => { e.currentTarget.style.background = T.ink; e.currentTarget.style.color = T.bg; }} onMouseLeave={e => { e.currentTarget.style.background = dark ? "#1e1c17" : "#f0ede8"; e.currentTarget.style.color = T.muted; }}>
                                DOWNLOAD .TXT
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Output body */}
            <div ref={outputRef} style={{ flex: 1, minHeight: "480px", maxHeight: "calc(100vh - 260px)", overflowY: "auto", padding: "28px 32px", background: dark ? "#141210" : "#fdfcfa", border: `1px solid ${T.border}`, borderRadius: "6px", position: "relative" }}>
                {phase === "idle" && (
                    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", opacity: 0.4 }}>
                        <div style={{ fontSize: "36px" }}>◎</div>
                        <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: "16px", color: T.ink, textAlign: "center" }}>Your summary will appear here</div>
                        <div style={{ fontFamily: "var(--font-space-mono)", fontSize: "10px", color: T.muted, textAlign: "center", letterSpacing: ".08em" }}>Upload a PDF to get started</div>
                    </div>
                )}
                {phase === "uploading" && (
                    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", animation: "fadeIn .3s ease" }}>
                        <div style={{ width: "36px", height: "36px", border: `2px solid ${T.border}`, borderTopColor: T.gold, borderRadius: "50%", animation: "spin .8s linear infinite" }} />
                        <div style={{ fontFamily: "var(--font-space-mono)", fontSize: "11px", color: T.muted, letterSpacing: ".1em" }}>UPLOADING DOCUMENT...</div>
                    </div>
                )}
                {(phase === "processing" || phase === "done") && (
                    <div style={{ animation: "fadeIn .3s ease" }}>
                        <p className="stream-text" style={{ color: T.ink }}>
                            {streamedText}
                            {phase === "processing" && <span style={{ display: "inline-block", width: "2px", height: "1em", background: T.gold, marginLeft: "2px", verticalAlign: "text-bottom", animation: "stream-cursor .7s steps(1) infinite" }} />}
                        </p>
                    </div>
                )}
            </div>

            {phase === "idle" && (
                <p style={{ marginTop: "12px", fontFamily: "var(--font-space-mono)", fontSize: "10px", color: T.muted, letterSpacing: ".06em", lineHeight: 1.7 }}>
                    Our AI reads your PDF and streams a concise summary in real time. Typical processing time: 1–3 minutes.
                </p>
            )}
        </div>
    );
}
