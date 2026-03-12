import { C } from "@/lib/constants";

export default function FeaturesSection() {
    const features = [
        { sym: "◈", title: "Smart PDF Parsing", body: "PyMuPDF extracts raw text from any PDF — research papers, reports, textbooks. Chunked intelligently at 1500 tokens for optimal model inference.", accent: C.cyan },
        { sym: "⬡", title: "Live Token Streaming", body: "Watch your summary appear in real-time via SSE. Every token the model produces is pushed immediately to your screen — no waiting for the full response.", accent: C.gold },
        { sym: "◎", title: "History & Archive", body: "Every summarization job persisted in Neon PostgreSQL. Revisit past summaries, inspect chunk-level breakdowns, and track processing status.", accent: C.cyan },
    ];

    return (
        <section className="px-[64px] pt-[80px] pb-[100px]">
            <div className="mb-[64px]">
                <div className="font-space-mono text-[10px] text-[#00e5ff] tracking-[0.24em] mb-[16px]">
                    — CAPABILITIES
                </div>
                <h2 className="font-syne font-extrabold text-[clamp(32px,5vw,62px)] leading-[1.05] tracking-[-0.02em]">
                    What it does.
                </h2>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-[1px] bg-white/10">
                {features.map(f => (
                    <div key={f.title} className="feat-card">
                        <div className="feat-icon text-[26px] mb-[28px]" style={{ color: f.accent }}>
                            {f.sym}
                        </div>
                        <h3 className="font-syne font-bold text-[18px] mb-[14px] tracking-[-0.01em]">
                            {f.title}
                        </h3>
                        <p className="text-white/50 leading-[1.72] text-[14px] font-light">
                            {f.body}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}
