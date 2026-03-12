import Link from "next/link";

export default function CTASection() {
    return (
        <section className="mx-[64px] mb-[120px]">
            <div className="py-[80px] px-[64px] text-center bg-gradient-to-br from-[#00e5ff]/5 to-[#f0a500]/5 border border-white/10 rounded-sm backdrop-blur-[20px]">
                <div className="font-space-mono text-[10px] text-[#00e5ff] tracking-[0.24em] mb-[24px]">
                    — GET STARTED
                </div>
                <h2 className="font-syne font-extrabold text-[clamp(36px,6vw,78px)] leading-[0.92] tracking-[-0.025em] mb-[24px]">
                    Drop your PDF.<br />
                    <span className="text-[#00e5ff]">Get a summary.</span>
                </h2>
                <p className="text-white/50 text-[15px] max-w-[380px] mx-auto mb-[44px] leading-[1.72] font-light">
                    Powered by a fine-tuned Mistral 7B model, hosted free on Hugging Face Spaces. No sign-up required.
                </p>
                <Link href="/summarize">
                    <button className="btn-cta px-[52px] py-[16px] text-[13px]">LAUNCH SUMMARIZER →</button>
                </Link>
            </div>
        </section>
    );
}
