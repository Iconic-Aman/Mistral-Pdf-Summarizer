"use client";

import { useState, useEffect } from "react";
import { LIGHT, DARK } from "@/lib/constants";
import BackgroundShapes from "@/components/BackgroundShapes";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import StatsSection from "@/components/StatsSection";
import FeaturesSection from "@/components/FeaturesSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

export default function Home() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [dark, setDark] = useState(false);
  const [toggling, setToggling] = useState(false);

  const T = dark ? DARK : LIGHT;

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
    return () => window.removeEventListener("mousemove", onMove);
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
        <Navbar T={T} dark={dark} toggle={toggle} />
        <HeroSection T={T} dark={dark} />
        <StatsSection T={T} />
        <FeaturesSection T={T} />
        <HowItWorksSection T={T} />
        <CTASection T={T} dark={dark} />
        <Footer T={T} />
      </div>
    </div>
  );
}
