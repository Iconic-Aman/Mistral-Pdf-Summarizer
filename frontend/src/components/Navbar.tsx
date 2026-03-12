"use client";

import { Theme } from "@/lib/constants";
import Link from "next/link";

export default function Navbar({ T, dark, toggle }: { T: Theme; dark: boolean; toggle: () => void }) {
    return (
        <nav style={{
            position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 52px", height: "56px",
            background: T.navBg,
            backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
            borderBottom: `1px solid ${T.border}`,
            transition: "background .35s, border-color .35s",
        }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "15px", letterSpacing: ".07em" }}>
                <span style={{ color: T.gold }}>BOTZ</span>
                <span style={{ color: T.ink }}>CODER</span>
            </div>

            <div style={{ display: "flex", gap: "32px" }}>
                {["SUMMARIZE", "HISTORY", "DOCS"].map(l => (
                    <Link
                        key={l}
                        href={l === "SUMMARIZE" ? "/summarize" : l === "HISTORY" ? "/history" : "#"}
                        className="nav-link"
                        style={{ color: T.muted }}
                        onMouseEnter={e => e.currentTarget.style.color = T.ink}
                        onMouseLeave={e => e.currentTarget.style.color = T.muted}
                    >
                        {l}
                    </Link>
                ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {/* Dark mode toggle */}
                <button
                    className="theme-btn"
                    onClick={toggle}
                    title={dark ? "Switch to light mode" : "Switch to dark mode"}
                    style={{ borderColor: T.border, color: T.muted }}
                >
                    {dark ? "☀" : "☽"}
                </button>
                <Link href="/summarize">
                    <button
                        className="btn-primary"
                        style={{ background: T.ink, color: T.bg, padding: "8px 20px" }}
                        onMouseEnter={e => e.currentTarget.style.opacity = ".8"}
                        onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                    >
                        TRY NOW →
                    </button>
                </Link>
            </div>
        </nav>
    );
}
