"use client";

import { Theme } from "@/lib/constants";

export default function HowItWorksSection({ T }: { T: Theme }) {
    const steps = [
        { n: "01", label: "Upload", body: "Drag & drop any PDF. Our cloud infrastructure saves it to secure storage and creates a private processing task." },
        { n: "02", label: "Process", body: "Text is securely extracted, analyzed, and processed by our advanced Large Language Model. A second-pass ensures your summary is concise and accurate." },
        { n: "03", label: "Stream", body: "Results are pushed immediately to your screen — watch as the AI contextually summarizes your document in real time." },
    ];

    return (
        <section className="px-6 py-10 md:px-16 md:py-[100px]">
            <div style={{ marginBottom: "52px" }}>
                <div style={{ fontFamily: "var(--font-space-mono), monospace", fontSize: "10px", color: T.muted, letterSpacing: ".22em", marginBottom: "14px" }}>
                    — PROCESS
                </div>
                <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 800, fontSize: "clamp(28px,4vw,52px)", letterSpacing: "-.02em", lineHeight: 1.05, color: T.ink, transition: "color .35s" }}>
                    Three steps.
                </h2>
            </div>
            <div style={{ maxWidth: "780px" }}>
                {steps.map(s => (
                    <div key={s.n} className="step-item" style={{ display: "flex", alignItems: "flex-start", gap: "24px", padding: "28px 0", borderBottom: `1px solid ${T.border}`, transition: "border-color .35s" }}>
                        <span style={{ fontFamily: "var(--font-space-mono), monospace", fontSize: "10px", color: T.gold, letterSpacing: ".08em", minWidth: "24px", paddingTop: "3px" }}>
                            {s.n}
                        </span>
                        <div>
                            <div className="step-label-inner" style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: "clamp(20px,2.5vw,32px)", letterSpacing: "-.015em", marginBottom: "8px", color: T.ink, transition: "color .35s, opacity .2s" }}>
                                {s.label}
                            </div>
                            <p style={{ color: T.muted, fontSize: "14px", lineHeight: 1.72, fontWeight: 300, maxWidth: "520px", transition: "color .35s" }}>
                                {s.body}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
