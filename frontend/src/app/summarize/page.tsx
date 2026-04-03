"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Navbar from "@/components/Navbar";
import UploadZone from "@/components/UploadZone";
import SummaryOutput from "@/components/SummaryOutput";
import { useAuth } from "@/lib/useAuth";
import { useTheme } from "@/context/ThemeContext";
import { API_BASE_URL } from "@/lib/constants";
import Link from "next/link";

// MOCK_SUMMARY removed

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

    const [uploadProgress, setUploadProgress] = useState(0);

    const handleLogout = () => { logout(); setShowDropdown(false); };

    const startRealProcess = useCallback(async () => {
        if (!file || !user) return;
        setPhase("uploading");
        setUploadProgress(0);
        setStreamedText("");
        setCurrentChunk(0);

        try {
            // 1. UPLOAD PHASE (Browser -> FastAPI -> R2)
            const formData = new FormData();
            formData.append("file", file);

            const xhr = new XMLHttpRequest();
            const uploadPromise = new Promise<{ job_id: string }>((resolve, reject) => {
                xhr.upload.addEventListener("progress", (e) => {
                    if (e.lengthComputable) {
                        const percent = Math.round((e.loaded / e.total) * 100);
                        setUploadProgress(percent);
                    }
                });

                xhr.onreadystatechange = () => {
                    if (xhr.readyState === 4) {
                        if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText));
                        else reject(new Error("Upload failed"));
                    }
                };
                xhr.onerror = () => reject(new Error("Network error"));

                xhr.open("POST", `${API_BASE_URL}/api/v1/upload-file/`);
                if (user.idToken) xhr.setRequestHeader("Authorization", `Bearer ${user.idToken}`);
                xhr.send(formData);
            });

            const { job_id } = await uploadPromise;

            // 2. SSE STREAMING WITH FETCH (Replaces Start & Polling)
            setPhase("processing");
            setCurrentChunk(TOTAL_CHUNKS); // Visual progress bar completion
            
            try {
                const streamRes = await fetch(`${API_BASE_URL}/api/v1/summarize/stream/${job_id}`, {
                    method: 'GET',
                    headers: {
                        "Authorization": user?.idToken ? `Bearer ${user.idToken}` : "",
                        "Accept": "text/event-stream",
                    }
                });

                if (!streamRes.ok) throw new Error("Stream connection failed");

                const reader = streamRes.body?.getReader();
                const decoder = new TextDecoder("utf-8");
                let done = false;

                while (!done && reader) {
                    const { value, done: readerDone } = await reader.read();
                    if (value) {
                        const chunkStr = decoder.decode(value, { stream: true });
                        const lines = chunkStr.split("\n");
                        for (const line of lines) {
                            if (line.startsWith("data: ")) {
                                try {
                                    const data = JSON.parse(line.slice(6));
                                    if (data.token) {
                                        setStreamedText(prev => prev + data.token);
                                    }
                                    if (data.done) {
                                        done = true;
                                        setPhase("done");
                                        setJobMeta({ chunks: TOTAL_CHUNKS, tokens: 0, time: "Streamed Job" });
                                    }
                                    if (data.error) {
                                        done = true;
                                        setPhase("idle");
                                        alert("Stream Error: " + data.error);
                                    }
                                } catch (e) { 
                                    console.warn("Parse error", e);
                                }
                            }
                        }
                    }
                    if (readerDone) done = true;
                }
            } catch (err) {
                console.error("Stream error", err);
                setPhase("idle");
                alert("Connection lost during streaming.");
            }

        } catch (err) {
            console.error(err);
            setPhase("idle");
            alert(`Upload failed. Make sure the backend is running at ${API_BASE_URL}`);
        }
    }, [file, user]);

    const reset = () => {
        clearInterval(streamRef.current!); clearInterval(chunkRef.current!);
        setFile(null); setPhase("idle"); setStreamedText(""); setJobMeta(null); setCurrentChunk(0);
    };

    useEffect(() => () => { clearInterval(streamRef.current!); clearInterval(chunkRef.current!); }, []);

    const progressPct = phase === "uploading" ? uploadProgress
        : phase === "processing" ? Math.round((currentChunk / TOTAL_CHUNKS) * 88) + 12
            : phase === "done" ? 100 : 0;

    return (
        <div style={{ background: T.bg, color: T.ink, fontFamily: "var(--font-dm-sans), sans-serif", minHeight: "100vh", display: "flex", flexDirection: "column", transition: "background .35s,color .35s", opacity: toggling ? 0 : 1 }}>
            <Navbar T={T} dark={dark} toggle={toggle} user={user} isLoading={isLoading} showDropdown={showDropdown} setShowDropdown={setShowDropdown} handleLogout={handleLogout} setShowLogin={() => { }} />

            {/* Page header */}
            <div style={{ padding: "80px 52px 0" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "20px", borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "7px", textDecoration: "none", fontFamily: "var(--font-space-mono)", fontSize: "10px", color: T.muted, letterSpacing: ".1em", padding: "7px 14px", border: `1px solid ${T.border}`, borderRadius: "2px", transition: "all .2s" }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = T.ink; e.currentTarget.style.color = T.ink; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}>
                            ← BACK
                        </Link>
                        <div>
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
                    onStart={startRealProcess} onReset={reset} />
                <SummaryOutput T={T} dark={dark} phase={phase} streamedText={streamedText} file={file} />
            </div>
        </div>
    );
}
