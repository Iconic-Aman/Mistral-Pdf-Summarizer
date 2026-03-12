export default function Footer() {
    return (
        <footer className="py-[36px] px-[64px] border-t border-white/10 flex justify-between items-center flex-wrap gap-[16px] relative z-[1]">
            <div className="font-syne font-extrabold text-[15px] tracking-[0.08em]">
                <span className="text-[#00e5ff]">BOTZ</span>
                <span className="text-[#f0f0f0]">CODER</span>
            </div>
            <div className="font-space-mono text-[10px] text-white/50 tracking-[0.1em]">
                www.botzcoder.com — Built with Mistral AI
            </div>
            <div className="font-space-mono text-[10px] text-white/50">
                Next.js · FastAPI · PostgreSQL · HF Spaces
            </div>
        </footer>
    );
}
