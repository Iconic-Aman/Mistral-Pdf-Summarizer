import { C } from "@/lib/constants";
import Link from "next/link";

export default function HeroSection() {
    return (
        <section className="min-h-screen flex flex-col justify-center px-[64px] pt-[120px] pb-[80px] relative">
            {/* Live badge */}
            <div className="fi1 inline-flex items-center gap-[10px] mb-[36px] px-[16px] py-[6px] bg-[#00e5ff]/10 border border-[#00e5ff]/25 rounded-sm w-fit">
                <span className="w-[7px] h-[7px] rounded-full bg-[#00e5ff] shrink-0 animate-[pulse-dot_2s_infinite]" />
                <span className="font-space-mono text-[10px] text-[#00e5ff] tracking-[0.12em]">
                    aman012/mistral-7b-instruct-v0.3-bnb-4bit-200
                </span>
            </div>

            {/* Giant headline */}
            <div className="mb-[32px] leading-[0.88]">
                <div className="fi2 font-syne font-extrabold text-[clamp(52px,10vw,124px)] tracking-[-0.025em]">
                    SUMMARIZE
                </div>
                <div
                    className="fi3 font-syne font-extrabold text-[clamp(52px,10vw,124px)] tracking-[-0.025em] text-transparent"
                    style={{ WebkitTextStroke: `2px ${C.cyan}`, WebkitTextFillColor: "transparent" }}
                >
                    ANY PDF
                </div>
                <div className="fi4 font-syne font-extrabold text-[clamp(52px,10vw,124px)] tracking-[-0.025em]">
                    WITH AI.
                </div>
            </div>

            <p className="fi4 max-w-[480px] leading-[1.75] text-white/50 text-[15px] font-light mb-[44px]">
                Upload any PDF — research papers, legal docs, textbooks.
                Mistral 7B reads it in intelligent chunks and streams a
                comprehensive summary directly to your screen.
            </p>

            <div className="fi5 flex gap-[14px] flex-wrap">
                <Link href="/summarize">
                    <button className="btn-cta">UPLOAD PDF →</button>
                </Link>
                <Link href="/history">
                    <button className="btn-ghost">VIEW HISTORY</button>
                </Link>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-[48px] left-[64px] flex items-center gap-[14px]">
                <div className="w-[1px] h-[56px] bg-gradient-to-b from-[#00e5ff] to-transparent" />
                <span className="font-space-mono text-[9px] text-white/50 tracking-[0.2em] [writing-mode:vertical-rl] rotate-180">
                    SCROLL
                </span>
            </div>
        </section>
    );
}
