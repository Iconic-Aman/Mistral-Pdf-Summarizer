import { C } from "@/lib/constants";

export default function HowItWorksSection() {
    const steps = [
        { n: "01", label: "Upload", sub: "Drag & drop any PDF into the upload zone", accent: C.cyan },
        { n: "02", label: "Process", sub: "Mistral 7B reads and summarizes every chunk", accent: C.gold },
        { n: "03", label: "Stream", sub: "Complete summary appears token-by-token in real time", accent: C.cyan },
    ];

    return (
        <section className="px-[64px] pt-[60px] pb-[120px]">
            <div className="mb-[60px]">
                <div className="font-space-mono text-[10px] text-[#f0a500] tracking-[0.24em] mb-[16px]">
                    — HOW IT WORKS
                </div>
                <h2 className="font-syne font-extrabold text-[clamp(32px,5vw,62px)] leading-[1.05] tracking-[-0.02em]">
                    Three steps.
                </h2>
            </div>
            <div className="max-w-[920px]">
                {steps.map(s => (
                    <div key={s.n} className="step-row">
                        <span className="step-n font-space-mono text-[10px] tracking-[0.08em] min-w-[28px] font-bold" style={{ color: s.accent }}>
                            {s.n}
                        </span>
                        <span className="font-syne font-bold text-[clamp(22px,3vw,44px)] flex-1 tracking-[-0.015em]">
                            {s.label}
                        </span>
                        <span className="text-white/50 text-[14px] max-w-[320px] font-light leading-[1.65]">
                            {s.sub}
                        </span>
                        <div className="step-arrow w-[38px] h-[38px] border border-white/10 rounded-full flex items-center justify-center text-white/50 text-[16px] shrink-0">
                            →
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
