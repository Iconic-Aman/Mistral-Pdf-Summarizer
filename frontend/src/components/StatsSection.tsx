"use client";

import { Theme } from "@/lib/constants";

export default function StatsSection({ T }: { T: Theme }) {
    const stats = [
        { v: "98%", l: "Accuracy" },
        { v: "2.4s", l: "Avg Response" },
        { v: "AES", l: "Encryption" },
        { v: "Live", l: "SSE Streaming" },
    ];

    return (
        <div className="px-6 pb-16 md:px-16 md:pb-[100px]">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 max-w-[800px] overflow-hidden rounded-[4px]" style={{
                border: `1px solid ${T.border}`, background: T.surface,
                transition: "background .35s, border-color .35s",
            }}>
                {stats.map((s, i) => (
                    <div key={s.l} className="stat-item flex flex-col justify-center" style={{ padding: "28px 20px", textAlign: "center", borderBottom: i < 3 ? `1px solid ${T.border}` : "none", transition: "border-color .35s" }}>
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
