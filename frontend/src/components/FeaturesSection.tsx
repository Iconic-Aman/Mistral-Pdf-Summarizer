"use client";

import { Theme } from "@/lib/constants";

export default function FeaturesSection({ T }: { T: Theme }) {
    const features = [
        { sym: "◈", title: "Smart PDF Parsing", body: "PyMuPDF extracts all text and splits it into intelligent 1500-token chunks — ready for the model to digest one piece at a time." },
        { sym: "⬡", title: "Live Token Streaming", body: "Summaries appear word-by-word in real time via Server-Sent Events. No spinner, no waiting — just instant output as the model generates." },
        { sym: "◎", title: "Full Job History", body: "Every upload persisted in PostgreSQL. Revisit any past summary, inspect chunk-level breakdowns, and track job status at a glance." },
    ];

    return (
        <section style={{ padding: "60px 64px 100px" }}>
            <div style={{ marginBottom: "52px" }}>
                <div style={{ fontFamily: "var(--font-space-mono), monospace", fontSize: "10px", color: T.gold, letterSpacing: ".22em", marginBottom: "14px" }}>
                    — CAPABILITIES
                </div>
                <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 800, fontSize: "clamp(28px,4vw,52px)", letterSpacing: "-.02em", lineHeight: 1.05, color: T.ink, transition: "color .35s" }}>
                    What it does.
                </h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: "16px" }}>
                {features.map(f => (
                    <div key={f.title} className="feat-card" style={{
                        padding: "36px 32px", background: T.surface,
                        border: `1px solid ${T.border}`, borderRadius: "4px",
                        transition: "background .35s, border-color .35s, transform .3s, box-shadow .3s",
                    }}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = T.cardHover}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
                    >
                        <div style={{ fontSize: "22px", color: T.gold, marginBottom: "20px" }}>
                            {f.sym}
                        </div>
                        <h3 style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: "17px", marginBottom: "12px", letterSpacing: "-.01em", color: T.ink, transition: "color .35s" }}>
                            {f.title}
                        </h3>
                        <p style={{ color: T.muted, lineHeight: 1.75, fontSize: "14px", fontWeight: 300, transition: "color .35s" }}>
                            {f.body}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}
