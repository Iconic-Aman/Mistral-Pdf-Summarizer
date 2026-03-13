"use client";

import { Theme } from "@/lib/constants";

export default function StatsSection({ T }: { T: Theme }) {
    const stats = [
        { v: "7B", l: "Parameters" },
        { v: "4bit", l: "Quantized" },
        { v: "200", l: "Fine-tune Steps" },
        { v: "SSE", l: "Live Stream" },
    ];

    return (
        <div style={{ padding: "0 64px 100px" }}>
            <div style={{
                display: "grid", gridTemplateColumns: "repeat(4,1fr)",
                border: `1px solid ${T.border}`, background: T.surface,
                borderRadius: "4px", overflow: "hidden", maxWidth: "800px",
                transition: "background .35s, border-color .35s",
            }}>
                {stats.map((s, i) => (
                    <div key={s.l} className="stat-item" style={{ padding: "28px 20px", textAlign: "center", borderRight: i < 3 ? `1px solid ${T.border}` : "none", transition: "border-color .35s" }}>
                        <div style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 800, fontSize: "clamp(22px,3vw,36px)", color: T.ink, marginBottom: "5px", transition: "color .35s" }}>
                            {s.v}
                        </div>
                        <div style={{ fontFamily: "var(--font-space-mono), monospace", fontSize: "10px", color: T.muted, letterSpacing: ".12em", transition: "color .35s" }}>
                            {s.l}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
