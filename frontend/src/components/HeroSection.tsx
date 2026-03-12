"use client";

import { Theme } from "@/lib/constants";
import Link from "next/link";

export default function HeroSection({ T, dark }: { T: Theme; dark: boolean }) {
    return (
        <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "120px 64px 80px" }}>
            <div className="fi1" style={{
                display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "32px", width: "fit-content",
                padding: "5px 14px", background: `rgba(${dark ? "224,155,42" : "200,134,26"},0.1)`,
                border: `1px solid rgba(${dark ? "224,155,42" : "200,134,26"},0.25)`, borderRadius: "2px",
                transition: "background .35s, border-color .35s",
            }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: T.gold, animation: "blink 2s infinite", flexShrink: 0 }} />
                <span style={{ fontFamily: "'Space Mono',monospace", fontSize: "10px", color: T.gold, letterSpacing: ".1em" }}>
                    aman012/mistral-7b-instruct-v0.3-bnb-4bit-200
                </span>
            </div>

            <div style={{ marginBottom: "28px" }}>
                <div className="fi2" style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(48px,9vw,108px)", letterSpacing: "-.03em", lineHeight: .9, color: T.ink, transition: "color .35s" }}>
                    SUMMARIZE
                </div>
                <div className="fi3" style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(48px,9vw,108px)", letterSpacing: "-.03em", lineHeight: .9, WebkitTextStroke: `1.5px ${T.gold}`, color: "transparent", WebkitTextFillColor: "transparent", transition: "all .35s" }}>
                    ANY PDF
                </div>
                <div className="fi4" style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(48px,9vw,108px)", letterSpacing: "-.03em", lineHeight: .9, color: T.ink, transition: "color .35s" }}>
                    WITH AI.
                </div>
            </div>

            <p className="fi4" style={{ maxWidth: "420px", lineHeight: 1.8, color: T.muted, fontSize: "15px", fontWeight: 300, marginBottom: "40px", transition: "color .35s" }}>
                Upload any PDF — papers, contracts, textbooks.
                Mistral 7B chunks and streams a clean summary
                directly to your screen, token by token.
            </p>

            <div className="fi5" style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <Link href="/summarize">
                    <button className="btn-primary" style={{ background: T.ink, color: T.bg }}
                        onMouseEnter={e => e.currentTarget.style.opacity = ".8"}
                        onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                    >
                        UPLOAD PDF →
                    </button>
                </Link>
                <Link href="/history">
                    <button className="btn-outline" style={{ color: T.muted, border: `1px solid ${T.border}` }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = T.ink; e.currentTarget.style.color = T.ink; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}
                    >
                        VIEW HISTORY
                    </button>
                </Link>
            </div>
        </section>
    );
}
