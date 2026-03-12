"use client";

import { Theme } from "@/lib/constants";

export default function BackgroundShapes({ px, py, T }: { px: number; py: number; T: Theme }) {
    return (
        <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
            {/* Top right outer ring */}
            <div style={{ position: "absolute", width: 520, height: 520, top: -120, right: -60, borderRadius: "50%", border: `1px solid ${T.ring1}`, transform: `translate(${px * .4}px,${py * .3}px)`, transition: "transform .08s linear, border-color .35s" }} />
            {/* Top right inner spinning ring */}
            <div style={{ position: "absolute", width: 320, height: 320, top: 60, right: 80, borderRadius: "50%", border: `1px solid ${T.ring2}`, transform: `translate(${px * .7}px,${py * .5}px)`, transition: "transform .08s linear, border-color .35s", animation: "spin-slow 28s linear infinite" }} />
            {/* Bottom left ring */}
            <div style={{ position: "absolute", width: 200, height: 200, bottom: "30%", left: -60, borderRadius: "50%", border: `1px solid ${T.ring3}`, transform: `translate(${px * .3}px,${py * .4}px)`, transition: "transform .08s linear, border-color .35s" }} />
            {/* Center floating glow */}
            <div style={{ position: "absolute", width: 180, height: 180, top: "38%", left: "18%", borderRadius: "50%", background: `radial-gradient(circle, ${T.glow} 0%, transparent 70%)`, transform: `translate(${px * .2}px,${py * .2}px)`, transition: "transform .12s linear, background .35s", animation: "float-y 7s ease-in-out infinite" }} />
        </div>
    );
}
