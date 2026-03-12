export default function StatsSection() {
    const stats = [
        { v: "7B", l: "Parameters" },
        { v: "4-bit", l: "Quantized" },
        { v: "200", l: "Fine-tune Steps" },
        { v: "SSE", l: "Real-time Stream" },
    ];

    return (
        <div className="px-[64px] pb-[100px]">
            <div className="grid grid-cols-4 gap-[1px] bg-white/10 border border-white/10 max-w-[860px]">
                {stats.map(s => (
                    <div key={s.l} className="stat-cell">
                        <div className="sv font-syne font-extrabold text-[clamp(26px,3.5vw,40px)] text-[#f0f0f0] mb-[6px]">
                            {s.v}
                        </div>
                        <div className="font-space-mono text-[10px] text-white/50 tracking-[0.14em]">
                            {s.l}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
