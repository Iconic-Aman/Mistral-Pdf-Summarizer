"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/lib/useAuth";
import { useTheme } from "@/context/ThemeContext";
import { API_BASE_URL } from "@/lib/constants";
import Link from "next/link";

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

    const [selectedJob, setSelectedJob] = useState<any>(null);
    const [isDetailLoading, setIsDetailLoading] = useState(false);

    const fetchJobDetails = async (jobId: string) => {
        if (!user) return;
        setIsDetailLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/jobs/${jobId}`, {
                headers: { "Authorization": `Bearer ${user.idToken}` }
            });
            const data = await res.json();
            setSelectedJob(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsDetailLoading(false);
        }
    };

    const handleLogout = () => { logout(); setShowDropdown(false); };

    return (
        <div style={{ background: T.bg, color: T.ink, fontFamily: "var(--font-dm-sans), sans-serif", minHeight: "100vh", display: "flex", flexDirection: "column", transition: "background .35s,color .35s", opacity: toggling ? 0 : 1 }}>
            <Navbar T={T} dark={dark} toggle={toggle} user={user} isLoading={isAuthLoading} showDropdown={showDropdown} setShowDropdown={setShowDropdown} handleLogout={handleLogout} setShowLogin={() => { }} />
            
            <div style={{ padding: "80px 52px 0", flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "20px", borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "7px", textDecoration: "none", fontFamily: "var(--font-space-mono)", fontSize: "10px", color: T.muted, letterSpacing: ".1em", padding: "7px 14px", border: `1px solid ${T.border}`, borderRadius: "2px", transition: "all .2s" }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = T.ink; e.currentTarget.style.color = T.ink; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}>
                            ← BACK
                        </Link>
                        <div>
                            <h1 style={{ fontFamily: "var(--font-syne)", fontWeight: 800, fontSize: "clamp(22px,3vw,32px)", letterSpacing: "-.02em", color: T.ink }}>Your History</h1>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: "40px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px", paddingBottom: "60px" }}>
                    {isLoading ? (
                        <div style={{ color: T.muted }}>Loading your summaries...</div>
                    ) : jobs.length === 0 ? (
                        <div style={{ color: T.muted }}>No summaries found. Upload a PDF to get started!</div>
                    ) : (jobs.map((job: any) => (
                        <div key={job.id} style={{ padding: "24px", border: `1px solid ${T.border}`, borderRadius: "4px", background: dark ? "#1a1914" : "#fff", transition: "all .3s", cursor: "pointer", position: "relative" }}
                             onMouseEnter={e => { e.currentTarget.style.borderColor = T.gold; e.currentTarget.style.transform = "translateY(-4px)"; }}
                             onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = "translateY(0)"; }}
                             onClick={() => fetchJobDetails(job.id)}>
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

            {/* Detail Modal */}
            {(selectedJob || isDetailLoading) && (
                <div onClick={() => setSelectedJob(null)} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px" }}>
                    <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: "800px", maxHeight: "80vh", background: T.surface, border: `1px solid ${T.border}`, borderRadius: "8px", display: "flex", flexDirection: "column", overflow: "hidden", animation: "modal-in .25s ease" }}>
                        <div style={{ padding: "24px 32px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <div style={{ fontFamily: "var(--font-space-mono)", fontSize: "10px", color: T.gold, letterSpacing: ".1em", marginBottom: "4px" }}>SUMMARY DETAIL</div>
                                <h2 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: "20px", color: T.ink }}>{isDetailLoading ? "Loading..." : selectedJob?.job?.filename}</h2>
                            </div>
                            <button onClick={() => setSelectedJob(null)} style={{ background: "transparent", border: "none", cursor: "pointer", color: T.muted, fontSize: "20px" }}>✕</button>
                        </div>
                        <div style={{ padding: "32px", flex: 1, overflowY: "auto", color: T.ink, lineHeight: 1.8, fontSize: "15px" }}>
                            {isDetailLoading ? (
                                <div style={{ textAlign: "center", padding: "40px", color: T.muted }}>Fetching summary...</div>
                            ) : selectedJob?.summary?.content ? (
                                <p style={{ whiteSpace: "pre-wrap" }}>{selectedJob.summary.content}</p>
                            ) : (
                                <div style={{ textAlign: "center", padding: "40px", color: T.muted }}>
                                    {selectedJob?.job?.status === "completed" ? "No summary available." : "Summary is still being processed."}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
