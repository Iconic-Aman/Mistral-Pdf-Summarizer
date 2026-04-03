"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/lib/useAuth";
import { useTheme } from "@/context/ThemeContext";
import { API_BASE_URL } from "@/lib/constants";

export default function HistoryPage() {
    const { dark, toggling, T, toggle } = useTheme();
    const [showDropdown, setShowDropdown] = useState(false);
    const { user, logout, isLoading: isAuthLoading } = useAuth();
    
    const [jobs, setJobs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        fetch(`${API_BASE_URL}/api/v1/jobs/`, {
            headers: {
                "Authorization": `Bearer ${user.idToken}`
            }
        })
        .then(res => res.json())
        .then(data => {
            setJobs(Array.isArray(data) ? data : []);
            setIsLoading(false);
        })
        .catch(err => {
            console.error(err);
            setIsLoading(false);
        });
    }, [user]);

    const handleLogout = () => { logout(); setShowDropdown(false); };

    return (
        <div style={{ background: T.bg, color: T.ink, fontFamily: "var(--font-dm-sans), sans-serif", minHeight: "100vh", display: "flex", flexDirection: "column", transition: "background .35s,color .35s", opacity: toggling ? 0 : 1 }}>
            <Navbar T={T} dark={dark} toggle={toggle} user={user} isLoading={isAuthLoading} showDropdown={showDropdown} setShowDropdown={setShowDropdown} handleLogout={handleLogout} setShowLogin={() => { }} />
            
            <div style={{ padding: "80px 52px 0", flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "20px", borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                        <div>
                            <div style={{ fontFamily: "var(--font-space-mono)", fontSize: "10px", color: T.gold, letterSpacing: ".2em", marginBottom: "6px" }}>— DASHBOARD</div>
                            <h1 style={{ fontFamily: "var(--font-syne)", fontWeight: 800, fontSize: "clamp(22px,3vw,32px)", letterSpacing: "-.02em", color: T.ink }}>Your History</h1>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: "40px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}>
                    {isLoading ? (
                        <div style={{ color: T.muted }}>Loading your summaries...</div>
                    ) : jobs.length === 0 ? (
                        <div style={{ color: T.muted }}>No summaries found. Upload a PDF to get started!</div>
                    ) : (jobs.map((job: any) => (
                        <div key={job.id} style={{ padding: "24px", border: `1px solid ${T.border}`, borderRadius: "4px", background: dark ? "#1a1914" : "#fff", transition: "transform .2s", cursor: "pointer" }}
                             onClick={() => alert(`Full summary functionality coming soon for job ${job.id}`)}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                                <span style={{ fontSize: "12px", fontFamily: "var(--font-space-mono)", color: job.status === "completed" ? "#10b981" : (job.status === "pending" || job.status === "processing") ? T.gold : "#ef4444" }}>
                                    ● {job.status.toUpperCase()}
                                </span>
                                <span style={{ fontSize: "12px", color: T.muted }}>{new Date(job.created_at).toLocaleDateString()}</span>
                            </div>
                            <h3 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: "18px", marginBottom: "8px", wordBreak: "break-word" }}>{job.filename}</h3>
                        </div>
                    )))}
                </div>
            </div>
        </div>
    );
}
