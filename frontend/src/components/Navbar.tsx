"use client";

import { Theme } from "@/lib/constants";
import { AuthUser } from "@/lib/useAuth";
import Link from "next/link";

export default function Navbar({
    T, dark, toggle,
    user, isLoading, showDropdown, setShowDropdown, handleLogout, setShowLogin
}: {
    T: Theme; dark: boolean; toggle: () => void;
    user: AuthUser | null; isLoading?: boolean; showDropdown: boolean; setShowDropdown: (b: boolean) => void;
    handleLogout: () => void; setShowLogin: (b: boolean) => void;
}) {

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
            <Link href="/" style={{ textDecoration: "none", fontFamily: "var(--font-syne), sans-serif", fontWeight: 800, fontSize: "15px", letterSpacing: ".07em" }}>
                <span style={{ color: T.gold }}>BOTZ</span>
                <span style={{ color: T.ink }}>CODER</span>
            </Link>

            <div style={{ display: "flex", gap: "32px" }}>
                {["SUMMARIZE", "HISTORY", "DOCS"].filter(l => l !== "HISTORY" || user).map(l => (
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
                {user ? (
                    <div style={{ position: "relative" }}>
                        <button className="avatar-btn" onClick={() => setShowDropdown(!showDropdown)}>
                            <div className="avatar-circle" style={{ background: dark ? "#2e2a1e" : "#f0e8d5", color: T.gold, border: `1.5px solid ${T.gold}`, overflow: "hidden" }}>
                                {user.avatar?.startsWith("http") ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img src={user.avatar} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                ) : (
                                    user.avatar || user.name.charAt(0).toUpperCase()
                                )}
                            </div>

                            <span style={{ fontFamily: "var(--font-space-mono), monospace", fontSize: "10px", color: T.ink, letterSpacing: ".06em", maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {user.name.split(" ")[0].toUpperCase()}
                            </span>
                            <span style={{ color: T.muted, fontSize: "10px" }}>▾</span>
                        </button>

                        {showDropdown && (
                            <div className="dropdown" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: T.cardHover }}>
                                <div style={{ padding: "14px 16px", borderBottom: `1px solid ${T.border}` }}>
                                    <div style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: "13px", color: T.ink, marginBottom: "2px" }}>{user.name}</div>
                                    <div style={{ fontFamily: "var(--font-space-mono), monospace", fontSize: "10px", color: T.muted }}>{user.email}</div>
                                </div>
                                {[["◈ My summaries", () => { }], ["⬡ Upload PDF", () => { }], ["◎ Account settings", () => { }]].map(([label, fn]) => (
                                    <button key={label as string} className="dropdown-item" onClick={fn as () => void}
                                        style={{ background: "transparent", color: T.ink }}
                                        onMouseEnter={e => e.currentTarget.style.background = dark ? "#2a2720" : "#f5f3ef"}
                                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                        {label as string}
                                    </button>
                                ))}
                                <div style={{ borderTop: `1px solid ${T.border}` }}>
                                    <button className="dropdown-item" onClick={handleLogout}
                                        style={{ background: "transparent", color: "#c0392b" }}
                                        onMouseEnter={e => e.currentTarget.style.background = dark ? "#2a2720" : "#fdf2f0"}
                                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                        Sign out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : isLoading ? (
                    <div style={{ width: "80px", height: "32px", borderRadius: "2px", background: T.border, opacity: 0.5 }} />
                ) : (
                    <button
                        className="btn-primary"
                        onClick={() => setShowLogin(true)}
                        style={{ background: T.ink, color: T.bg, padding: "8px 20px" }}
                        onMouseEnter={e => e.currentTarget.style.opacity = ".8"}
                        onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                    >
                        SIGN IN →
                    </button>
                )}
            </div>
        </nav>
    );
}
