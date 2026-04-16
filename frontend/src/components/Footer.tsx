"use client";

import { Theme } from "@/lib/constants";

export default function Footer({ T }: { T: Theme }) {
    return (
        <footer className="flex flex-col md:flex-row justify-between items-center flex-wrap gap-3 px-6 py-6 md:px-16 md:py-[28px]" style={{ borderTop: `1px solid ${T.border}`, transition: "border-color .35s" }}>
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
