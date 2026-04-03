"use client";

import { Theme } from "@/lib/constants";
import { AuthUser } from "@/lib/useAuth";
import Link from "next/link";

export default function HeroSection({ T, dark, user, setShowLogin }: { T: Theme; dark: boolean; user: AuthUser | null; setShowLogin: (b: boolean) => void; }) {

    return (
        <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "120px 64px 80px" }}>


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

                {user && (
                    <Link href="/history">
                        <button className="btn-outline" style={{ color: T.muted, border: `1px solid ${T.border}` }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = T.ink; e.currentTarget.style.color = T.ink; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}
                        >
                            VIEW HISTORY
                        </button>
                    </Link>
                )}
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
