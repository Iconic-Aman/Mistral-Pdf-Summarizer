"use client";

import { Theme, User } from "@/lib/constants";
import Link from "next/link";

export default function CTASection({ T, dark, user, setShowLogin }: { T: Theme; dark: boolean; user: User | null; setShowLogin: (b: boolean) => void; }) {
    return (
        <section style={{ margin: "0 64px 100px" }}>
            <div style={{
                padding: "72px 60px", textAlign: "center",
                background: dark ? "#1c1a15" : "#1a1714",
                border: dark ? `1px solid ${T.border}` : "none",
                borderRadius: "4px",
                transition: "background .35s, border-color .35s",
            }}>
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "10px", color: T.gold, letterSpacing: ".22em", marginBottom: "20px" }}>
                    — GET STARTED
                </div>
                <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(30px,5vw,62px)", lineHeight: .95, letterSpacing: "-.025em", color: dark ? "#f0ece4" : "#f5f3ef", marginBottom: "20px" }}>
                    Drop your PDF.<br />
                    <span style={{ color: T.gold }}>Get a summary.</span>
                </h2>
                <p style={{ color: dark ? "rgba(240,236,228,0.35)" : "rgba(245,243,239,0.45)", fontSize: "14px", maxWidth: "340px", margin: "0 auto 36px", lineHeight: 1.75, fontWeight: 300 }}>
                    Fine-tuned Mistral 7B on Hugging Face Spaces. Free to use. Sign in with Google to save your history.
                </p>
                {user ? (
                    <Link href="/summarize">
                        <button className="btn-primary" style={{ background: T.gold, color: "#fff", padding: "14px 48px", fontSize: "12px" }}
                            onMouseEnter={e => e.currentTarget.style.opacity = ".85"}
                            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                        >
                            UPLOAD PDF →
                        </button>
                    </Link>
                ) : (
                    <button className="btn-primary" onClick={() => setShowLogin(true)} style={{ background: T.gold, color: "#fff", padding: "14px 48px", fontSize: "12px" }}
                        onMouseEnter={e => e.currentTarget.style.opacity = ".85"}
                        onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                    >
                        SIGN IN TO START →
                    </button>
                )}
            </div>
        </section>
    );
}
