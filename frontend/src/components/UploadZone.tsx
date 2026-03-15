"use client";
import { useRef } from "react";
import { Theme } from "@/lib/constants";

const CHUNK_LABELS = ["Introduction & background", "Methodology & architecture", "Experimental setup", "Results & evaluation", "Conclusion & future work"];

interface Props {
    T: Theme; dark: boolean;
    file: File | null;
    phase: string;
    dragging: boolean;
    currentChunk: number;
    totalChunks: number;
    progressPct: number;
    jobMeta: { chunks: number; tokens: number; time: string } | null;
    onFile: (f: File) => void;
    onDragOver: () => void;
    onDragLeave: () => void;
    onDrop: (e: React.DragEvent) => void;
    onStart: () => void;
    onReset: () => void;
}

export default function UploadZone({ T, dark, file, phase, dragging, currentChunk, totalChunks, progressPct, jobMeta, onFile, onDragOver, onDragLeave, onDrop, onStart, onReset }: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const clickable = phase === "idle";

    return (
        <div style={{ paddingRight: "32px", borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Drop zone */}
            <div className="upload-zone" onClick={() => clickable && inputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); onDragOver(); }}
                onDragLeave={onDragLeave} onDrop={onDrop}
                style={{ border: `1.5px dashed ${dragging || file ? T.gold : T.border}`, background: dragging ? `rgba(200,134,26,.06)` : dark ? "#161410" : "#faf9f6", padding: "40px 24px", textAlign: "center", cursor: clickable ? "pointer" : "default" }}>
                <input ref={inputRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={e => e.target.files?.[0] && onFile(e.target.files[0])} />
                <div style={{ fontSize: "36px", marginBottom: "14px", opacity: file ? 1 : 0.45 }}>{file ? "◈" : "⬡"}</div>
                {file ? (
                    <>
                        <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: "14px", color: T.gold, marginBottom: "4px", wordBreak: "break-all" }}>{file.name}</div>
                        <div style={{ fontFamily: "var(--font-space-mono)", fontSize: "10px", color: T.muted }}>{(file.size / 1024).toFixed(1)} KB · PDF</div>
                    </>
                ) : (
                    <>
                        <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: "15px", color: T.ink, marginBottom: "8px" }}>Drop your PDF here</div>
                        <div style={{ fontFamily: "var(--font-space-mono)", fontSize: "10px", color: T.muted, letterSpacing: ".06em", marginBottom: "16px" }}>or click to browse</div>
                        <div style={{ fontFamily: "var(--font-space-mono)", fontSize: "9px", color: T.muted, letterSpacing: ".08em" }}>PDF only · max 25 MB</div>
                    </>
                )}
            </div>

            {file && phase === "idle" && (
                <>
                    <button onClick={onStart} style={{ width: "100%", padding: "13px", background: T.ink, color: T.bg, fontFamily: "var(--font-space-mono)", fontSize: "11px", letterSpacing: ".12em", border: "none", borderRadius: "2px", cursor: "pointer", animation: "fadeIn .3s ease" }} onMouseEnter={e => (e.currentTarget.style.opacity = ".82")} onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>SUMMARIZE →</button>
                    <button onClick={() => inputRef.current?.click()} style={{ width: "100%", padding: "11px", background: "transparent", color: T.muted, fontFamily: "var(--font-space-mono)", fontSize: "10px", letterSpacing: ".1em", border: `1px solid ${T.border}`, borderRadius: "2px", cursor: "pointer" }} onMouseEnter={e => { e.currentTarget.style.borderColor = T.muted; e.currentTarget.style.color = T.ink; }} onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}>CHANGE FILE</button>
                </>
            )}

            {/* Progress bar */}
            {phase !== "idle" && (
                <div style={{ animation: "fadeIn .3s ease" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <span style={{ fontFamily: "var(--font-space-mono)", fontSize: "10px", color: T.muted, letterSpacing: ".08em" }}>{phase === "uploading" ? "UPLOADING..." : phase === "processing" ? `CHUNK ${currentChunk} / ${totalChunks}` : "COMPLETE"}</span>
                        <span style={{ fontFamily: "var(--font-space-mono)", fontSize: "10px", color: T.gold }}>{progressPct}%</span>
                    </div>
                    <div style={{ height: "3px", background: T.border, borderRadius: "2px", overflow: "hidden", position: "relative" }}>
                        <div style={{ height: "100%", width: `${progressPct}%`, background: T.gold, borderRadius: "2px", transition: "width .6s ease", position: "relative", overflow: "hidden" }}>
                            {phase !== "done" && <div style={{ position: "absolute", top: 0, bottom: 0, width: "40%", background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.5),transparent)", animation: "progress-shine 1.4s infinite" }} />}
                        </div>
                    </div>
                </div>
            )}

            {/* Chunk list */}
            {(phase === "processing" || phase === "done") && (
                <div style={{ animation: "fadeIn .4s ease" }}>
                    <div style={{ fontFamily: "var(--font-space-mono)", fontSize: "9px", color: T.muted, letterSpacing: ".14em", marginBottom: "10px" }}>CHUNKS</div>
                    {CHUNK_LABELS.map((label, i) => {
                        const done = i < currentChunk;
                        const active = i === currentChunk - 1 && phase === "processing";
                        return (
                            <div key={i} className="chunk-row" style={{ borderBottomColor: T.border }}>
                                <div style={{ width: "18px", height: "18px", borderRadius: "50%", flexShrink: 0, background: done ? T.gold : active ? `rgba(200,134,26,.15)` : T.border, border: `1.5px solid ${done || active ? T.gold : T.border}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "all .3s", position: "relative" }}>
                                    {active && <div style={{ position: "absolute", inset: -4, borderRadius: "50%", border: `1px solid ${T.gold}`, animation: "pulse-ring 1.2s infinite" }} />}
                                    {done && <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: dark ? "#111009" : "#fff" }} />}
                                </div>
                                <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "13px", color: done ? T.ink : T.muted, fontWeight: done ? 400 : 300, transition: "color .3s" }}>{label}</span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Job meta */}
            {phase === "done" && jobMeta && (
                <div style={{ padding: "16px", background: dark ? "#1e1c17" : "#f0ede8", borderRadius: "4px", animation: "fadeIn .4s ease" }}>
                    <div style={{ fontFamily: "var(--font-space-mono)", fontSize: "9px", color: T.muted, letterSpacing: ".14em", marginBottom: "10px" }}>JOB DETAILS</div>
                    {([["File", file?.name], ["Chunks", jobMeta.chunks], ["Tokens", jobMeta.tokens.toLocaleString()], ["Time", jobMeta.time]] as [string, string | number | undefined][]).map(([k, v]) => (
                        <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                            <span style={{ fontFamily: "var(--font-space-mono)", fontSize: "10px", color: T.muted }}>{k}</span>
                            <span style={{ fontFamily: "var(--font-space-mono)", fontSize: "10px", color: T.ink, maxWidth: "140px", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", textAlign: "right" }}>{v}</span>
                        </div>
                    ))}
                    <button onClick={onReset} style={{ marginTop: "8px", width: "100%", padding: "9px", background: "transparent", color: T.muted, fontFamily: "var(--font-space-mono)", fontSize: "10px", letterSpacing: ".1em", border: `1px solid ${T.border}`, borderRadius: "2px", cursor: "pointer" }} onMouseEnter={e => { e.currentTarget.style.borderColor = T.ink; e.currentTarget.style.color = T.ink; }} onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}>+ NEW SUMMARY</button>
                </div>
            )}
        </div>
    );
}
