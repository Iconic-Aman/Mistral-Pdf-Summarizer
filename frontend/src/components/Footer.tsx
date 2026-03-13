"use client";

import { Theme } from "@/lib/constants";

export default function Footer({ T }: { T: Theme }) {
    return (
        <footer style={{ padding: "28px 64px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", transition: "border-color .35s" }}>
            <div style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 800, fontSize: "14px", letterSpacing: ".07em" }}>
                <span style={{ color: T.gold }}>BOTZ</span>
                <span style={{ color: T.ink }}>CODER</span>
            </div>
            <div style={{ fontFamily: "var(--font-space-mono), monospace", fontSize: "10px", color: T.muted }}>
                www.botzcoder.com
            </div>
            <div style={{ fontFamily: "var(--font-space-mono), monospace", fontSize: "10px", color: T.muted }}>
                Next.js · FastAPI · PostgreSQL · HF Spaces
            </div>
        </footer>
    );
}
