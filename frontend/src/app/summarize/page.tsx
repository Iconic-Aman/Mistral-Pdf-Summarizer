"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Navbar from "@/components/Navbar";
import UploadZone from "@/components/UploadZone";
import SummaryOutput from "@/components/SummaryOutput";
import { useAuth } from "@/lib/useAuth";
import { useTheme } from "@/context/ThemeContext";

const MOCK_SUMMARY = `This document presents a comprehensive analysis of transformer-based language models and their applications in natural language processing tasks.

The key contributions include: (1) a sparse attention pattern that scales linearly with sequence length, (2) a novel positional encoding scheme that generalizes to longer sequences than seen during training, and (3) empirical evaluation across seven benchmark datasets.

Experimental results show a 34% reduction in inference time compared to standard full-attention transformers, with only a 1.2% drop in accuracy on the GLUE benchmark. The model achieves 91.4 on SuperGLUE, surpassing previous best results by 2.1 points.`;

export default function SummarizePage() {
    const { dark, toggling, T, toggle } = useTheme();
    const [showDropdown, setShowDropdown] = useState(false);
    const { user, logout, isLoading } = useAuth();

    const [file, setFile] = useState<File | null>(null);
    const [dragging, setDragging] = useState(false);
    const [phase, setPhase] = useState<"idle" | "uploading" | "processing" | "done">("idle");
    const [currentChunk, setCurrentChunk] = useState(0);
    const TOTAL_CHUNKS = 5;
    const [streamedText, setStreamedText] = useState("");
    const [jobMeta, setJobMeta] = useState<{ chunks: number; tokens: number; time: string } | null>(null);
    const streamRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const chunkRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const handleLogout = () => { logout(); setShowDropdown(false); };

    const startMockProcess = useCallback(() => {
        setPhase("uploading"); setStreamedText(""); setCurrentChunk(0);
        setTimeout(() => {
            setPhase("processing");
            let chunk = 0;
            chunkRef.current = setInterval(() => {
                chunk++;
                setCurrentChunk(chunk);
                if (chunk >= TOTAL_CHUNKS) {
                    clearInterval(chunkRef.current!);
                    let i = 0;
                    streamRef.current = setInterval(() => {
                        i += Math.floor(Math.random() * 4) + 2;
                        if (i >= MOCK_SUMMARY.length) {
                            i = MOCK_SUMMARY.length;
                            clearInterval(streamRef.current!);
                            setPhase("done");
                            setJobMeta({ chunks: TOTAL_CHUNKS, tokens: 1842, time: "2m 34s" });
                        }
                        setStreamedText(MOCK_SUMMARY.slice(0, i));
                    }, 28);
                }
            }, 900);
        }, 1200);
    }, []);

    const reset = () => {
        clearInterval(streamRef.current!); clearInterval(chunkRef.current!);
        setFile(null); setPhase("idle"); setStreamedText(""); setJobMeta(null); setCurrentChunk(0);
    };

    useEffect(() => () => { clearInterval(streamRef.current!); clearInterval(chunkRef.current!); }, []);

    const progressPct = phase === "uploading" ? 12
        : phase === "processing" ? Math.round((currentChunk / TOTAL_CHUNKS) * 88) + 12
            : phase === "done" ? 100 : 0;

    return (
        <div style={{ background: T.bg, color: T.ink, fontFamily: "var(--font-dm-sans), sans-serif", minHeight: "100vh", display: "flex", flexDirection: "column", transition: "background .35s,color .35s", opacity: toggling ? 0 : 1 }}>
            <Navbar T={T} dark={dark} toggle={toggle} user={user} isLoading={isLoading} showDropdown={showDropdown} setShowDropdown={setShowDropdown} handleLogout={handleLogout} setShowLogin={() => { }} />

            {/* Page header */}
            <div style={{ padding: "80px 52px 0" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "20px", borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                        <a href="/" style={{ display: "flex", alignItems: "center", gap: "7px", textDecoration: "none", fontFamily: "var(--font-space-mono)", fontSize: "10px", color: T.muted, letterSpacing: ".1em", padding: "7px 14px", border: `1px solid ${T.border}`, borderRadius: "2px", transition: "all .2s" }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = T.ink; e.currentTarget.style.color = T.ink; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}>
                            ← BACK
                        </a>
                        <div>
                            <div style={{ fontFamily: "var(--font-space-mono)", fontSize: "10px", color: T.gold, letterSpacing: ".2em", marginBottom: "6px" }}>— SUMMARIZE</div>
                            <h1 style={{ fontFamily: "var(--font-syne)", fontWeight: 800, fontSize: "clamp(22px,3vw,32px)", letterSpacing: "-.02em", color: T.ink }}>Upload a PDF</h1>
                        </div>
                    </div>
                </div>
            </div>

            {/* Split layout */}
            <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1.8fr", padding: "28px 52px 48px", marginTop: "0", gap: "0" }}>
                <UploadZone T={T} dark={dark} file={file} phase={phase} dragging={dragging} currentChunk={currentChunk} totalChunks={TOTAL_CHUNKS} progressPct={progressPct} jobMeta={jobMeta}
                    onFile={f => { setFile(f); setPhase("idle"); setStreamedText(""); setJobMeta(null); }}
                    onDragOver={() => setDragging(true)} onDragLeave={() => setDragging(false)}
                    onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f?.type === "application/pdf") { setFile(f); setPhase("idle"); } }}
                    onStart={startMockProcess} onReset={reset} />
                <SummaryOutput T={T} dark={dark} phase={phase} streamedText={streamedText} file={file} />
            </div>
        </div>
    );
}
