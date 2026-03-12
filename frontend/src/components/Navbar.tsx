import Link from "next/link";

export default function Navbar() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-[52px] h-[60px] backdrop-blur-md bg-[#070709]/70 border-b border-white/10">
            <div className="font-syne font-extrabold text-[17px] tracking-[0.08em]">
                <span className="text-[#00e5ff]">BOTZ</span>
                <span className="text-[#f0f0f0]">CODER</span>
            </div>
            <div className="flex gap-[36px]">
                {["SUMMARIZE", "HISTORY", "DOCS"].map((l) => (
                    <Link key={l} href={l === "SUMMARIZE" ? "/summarize" : l === "HISTORY" ? "/history" : "#"} className="nav-link">
                        {l}
                    </Link>
                ))}
            </div>
            <Link href="/summarize">
                <button className="nav-try">TRY NOW →</button>
            </Link>
        </nav>
    );
}
