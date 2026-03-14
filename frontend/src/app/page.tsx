"use client";

import { useState, useEffect } from "react";
import { LIGHT, DARK } from "@/lib/constants";
import BackgroundShapes from "@/components/BackgroundShapes";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import StatsSection from "@/components/StatsSection";
import FeaturesSection from "@/components/FeaturesSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import Footer from "@/components/Footer";

import { useAuth } from "@/lib/useAuth";

export default function Home() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [dark, setDark] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const { user, login, logout, isLoading: loginLoading } = useAuth();

  const T = dark ? DARK : LIGHT;

  const handleGoogleLogin = async () => {
    await login();
  };

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
  };


  const toggle = () => {
    setToggling(true);
    setTimeout(() => {
      setDark(d => !d);
      setToggling(false);
    }, 180);
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => setMouse({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    window.addEventListener("mousemove", onMove);

    // Close dropdown on outside click
    const closeDropdown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".avatar-btn") && !target.closest(".dropdown")) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("click", closeDropdown);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("click", closeDropdown);
    };
  }, []);

  const px = (mouse.x - 0.5) * 18;
  const py = (mouse.y - 0.5) * 12;

  const rootStyle = {
    background: T.bg,
    color: T.ink,
    minHeight: "100vh",
    overflowX: "hidden" as const,
    transition: "background .35s ease, color .35s ease",
    opacity: toggling ? 0 : 1,
  };

  return (
    <div style={rootStyle}>
      <BackgroundShapes px={px} py={py} T={T} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <Navbar
          T={T} dark={dark} toggle={toggle}
          user={user}
          showDropdown={showDropdown} setShowDropdown={setShowDropdown}
          handleLogout={handleLogout} setShowLogin={setShowLogin}
        />

        {/* ── LOGIN MODAL ── */}
        {showLogin && (
          <div onClick={() => setShowLogin(false)} style={{ position: "fixed", inset: 0, zIndex: 200, background: T.overlay, display: "flex", alignItems: "center", justifyContent: "center", animation: "overlay-in .2s ease" }}>
            <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: "400px", margin: "0 20px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: "6px", overflow: "hidden", animation: "modal-in .22s ease", boxShadow: `0 24px 64px ${dark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.14)"}` }}>

              {/* Modal header */}
              <div style={{ padding: "32px 36px 0" }}>
                <div style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 800, fontSize: "15px", letterSpacing: ".07em", marginBottom: "24px" }}>
                  <span style={{ color: T.gold }}>BOTZ</span><span style={{ color: T.ink }}>CODER</span>
                </div>
                <div style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: "22px", letterSpacing: "-.01em", marginBottom: "8px", color: T.ink }}>
                  Sign in to continue
                </div>
                <p style={{ fontSize: "14px", color: T.muted, lineHeight: 1.65, fontWeight: 300, marginBottom: "28px" }}>
                  Your summaries are tied to your account. Sign in so your PDFs and history are always yours.
                </p>
              </div>

              {/* Google button */}
              <div style={{ padding: "0 36px 32px" }}>
                <button className="google-btn" onClick={handleGoogleLogin} disabled={loginLoading}
                  style={{ background: dark ? "#1c1a15" : "#fff", border: `1px solid ${T.border}`, color: T.ink }}>
                  {loginLoading ? (
                    <><div className="spinner" /><span style={{ fontFamily: "var(--font-space-mono), monospace", fontSize: "11px", letterSpacing: ".08em" }}>SIGNING IN...</span></>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
                        <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
                        <path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05" />
                        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
                      </svg>
                      <span>Continue with Google</span>
                    </>
                  )}
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "20px 0" }}>
                  <div style={{ flex: 1, height: "1px", background: T.border }} />
                  <span style={{ fontFamily: "var(--font-space-mono), monospace", fontSize: "10px", color: T.muted, letterSpacing: ".1em" }}>OR</span>
                  <div style={{ flex: 1, height: "1px", background: T.border }} />
                </div>

                {/* Email placeholder */}
                <div style={{ width: "100%", padding: "12px 16px", borderRadius: "3px", border: `1px solid ${T.border}`, background: dark ? "#141210" : "#faf9f7", fontFamily: "var(--font-space-mono), monospace", fontSize: "11px", color: T.muted, letterSpacing: ".06em", marginBottom: "10px" }}>
                  Email — coming soon
                </div>

                <p style={{ fontSize: "12px", color: T.muted, textAlign: "center", lineHeight: 1.6, marginTop: "20px" }}>
                  By signing in you agree to our terms. Your data is only ever used to store your own summaries.
                </p>
              </div>

              {/* Close button */}
              <button onClick={() => setShowLogin(false)} style={{ position: "absolute", top: "16px", right: "16px", background: "transparent", border: "none", cursor: "pointer", color: T.muted, fontSize: "18px", lineHeight: 1, padding: "4px 8px", borderRadius: "2px", transition: "color .2s" }}
                onMouseEnter={e => e.currentTarget.style.color = T.ink}
                onMouseLeave={e => e.currentTarget.style.color = T.muted}>
                ✕
              </button>
            </div>
          </div>
        )}

        <HeroSection T={T} dark={dark} user={user} setShowLogin={setShowLogin} />
        <StatsSection T={T} />
        <FeaturesSection T={T} />
        <HowItWorksSection T={T} />
        <Footer T={T} />
      </div>
    </div>
  );
}
