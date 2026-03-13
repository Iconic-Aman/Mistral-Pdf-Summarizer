"use client";

import { Theme, User } from "@/lib/constants";
import Link from "next/link";

export default function HeroSection({ T, dark, user, setShowLogin }: { T: Theme; dark: boolean; user: User | null; setShowLogin: (b: boolean) => void; }) {
    return (
        <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "120px 64px 80px" }}>
            <div className="fi1" style={{
                display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "32px", width: "fit-content",
                padding: "5px 14px", background: `rgba(${dark ? "224,155,42" : "200,134,26"},0.1)`,
                border: `1px solid rgba(${dark ? "224,155,42" : "200,134,26"},0.25)`, borderRadius: "2px",
                transition: "background .35s, border-color .35s",
            }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: T.gold, animation: "blink 2s infinite", flexShrink: 0 }} />
                <span style={{ fontFamily: "var(--font-space-mono), monospace", fontSize: "10px", color: T.gold, letterSpacing: ".1em" }}>
                    aman012/mistral-7b-instruct-v0.3-bnb-4bit-200
                </span>
            </div>

            <div style={{ marginBottom: "28px" }}>
                <div className="fi2" style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 800, fontSize: "clamp(48px,9vw,108px)", letterSpacing: "-.03em", lineHeight: .9, color: T.ink, transition: "color .35s" }}>
                    SUMMARIZE
                </div>
                <div className="fi3" style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 800, fontSize: "clamp(48px,9vw,108px)", letterSpacing: "-.03em", lineHeight: .9, WebkitTextStroke: `1.5px ${T.gold}`, color: "transparent", WebkitTextFillColor: "transparent", transition: "all .35s" }}>
                    ANY PDF
                </div>
                <div className="fi4" style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 800, fontSize: "clamp(48px,9vw,108px)", letterSpacing: "-.03em", lineHeight: .9, color: T.ink, transition: "color .35s" }}>
                    WITH AI.
                </div>
            </div>

            <p className="fi4" style={{ maxWidth: "420px", lineHeight: 1.8, color: T.muted, fontSize: "15px", fontWeight: 300, marginBottom: "40px", transition: "color .35s" }}>
                Upload any PDF — papers, contracts, textbooks.
                Mistral 7B chunks and streams a clean summary
                directly to your screen, token by token.
            </p>

            <div className="fi5" style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                {user ? (
                    <Link href="/summarize">
                        <button className="btn-primary" style={{ background: T.ink, color: T.bg }}
                            onMouseEnter={e => e.currentTarget.style.opacity = ".8"}
                            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                        >
                            UPLOAD PDF →
                        </button>
                    </Link>
                ) : (
                    <button className="btn-primary" onClick={() => setShowLogin(true)} style={{ background: T.ink, color: T.bg }}
                        onMouseEnter={e => e.currentTarget.style.opacity = ".8"}
                        onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                        GET STARTED →
                    </button>
                )}

                <Link href="/history">
                    <button className="btn-outline" style={{ color: T.muted, border: `1px solid ${T.border}` }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = T.ink; e.currentTarget.style.color = T.ink; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}
                    >
                        VIEW HISTORY
                    </button>
                </Link>
            </div>

            {/* Logged-in welcome strip */}
            {user && (
                <div className="fi5" style={{ marginTop: "28px", display: "inline-flex", alignItems: "center", gap: "10px", padding: "8px 16px", background: dark ? "#1c1a15" : "#fff", border: `1px solid ${T.border}`, borderRadius: "3px", width: "fit-content" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e" }} />
                    <span style={{ fontFamily: "var(--font-space-mono), monospace", fontSize: "10px", color: T.muted, letterSpacing: ".08em" }}>
                        Signed in as <span style={{ color: T.gold }}>{user.email}</span>
                    </span>
                </div>
            )}
        </section>
    );
}
