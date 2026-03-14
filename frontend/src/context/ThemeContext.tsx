"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { LIGHT, DARK, Theme } from "@/lib/constants";

type ThemeContextType = {
    dark: boolean;
    T: Theme;
    toggle: () => void;
    toggling: boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [dark, setDark] = useState(false);
    const [toggling, setToggling] = useState(false);

    // Load from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem("theme");
        if (saved === "dark") setDark(true);
    }, []);

    const toggle = () => {
        setToggling(true);
        setTimeout(() => {
            setDark(prev => {
                const next = !prev;
                localStorage.setItem("theme", next ? "dark" : "light");
                return next;
            });
            setToggling(false);
        }, 180);
    };

    const T = dark ? DARK : LIGHT;

    return (
        <ThemeContext.Provider value={{ dark, T, toggle, toggling }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) throw new Error("useTheme must be used within a ThemeProvider");
    return context;
}
