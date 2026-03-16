export const LIGHT = {
    bg: "#f5f3ef",
    surface: "#ffffff",
    ink: "#1a1714",
    muted: "#8a857e",
    border: "#e8e4de",
    gold: "#c8861a",
    navBg: "rgba(245,243,239,0.88)",
    ctaBg: "#1a1714",
    ctaText: "#f5f3ef",
    ctaMuted: "rgba(245,243,239,0.45)",
    ring1: "rgba(200,134,26,0.12)",
    ring2: "rgba(200,134,26,0.18)",
    ring3: "rgba(26,23,20,0.06)",
    glow: "rgba(200,134,26,0.08)",
    scrollBg: "#c8c4bc",
    cardHover: "0 12px 40px rgba(0,0,0,0.07)",
    overlay: "rgba(26,23,20,0.55)",
};

export const DARK: Theme = {
    bg: "#111009",
    surface: "#1c1a15",
    ink: "#f0ece4",
    muted: "#7a7468",
    border: "#2a2720",
    gold: "#e09b2a",
    navBg: "rgba(17,16,9,0.88)",
    ctaBg: "#1c1a15",
    ctaText: "#f0ece4",
    ctaMuted: "rgba(240,236,228,0.35)",
    ring1: "rgba(224,155,42,0.1)",
    ring2: "rgba(224,155,42,0.15)",
    ring3: "rgba(240,236,228,0.04)",
    glow: "rgba(224,155,42,0.06)",
    scrollBg: "#3a3628",
    cardHover: "0 12px 40px rgba(0,0,0,0.4)",
    overlay: "rgba(0,0,0,0.72)",
};

export interface User {
    name: string;
    email: string;
    avatar: string;
}

export const MOCK_USER: User = { name: "Aman Gupta", email: "aman.apk01@gmail.com", avatar: "AG" };

export type Theme = typeof LIGHT;

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
