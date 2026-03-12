import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import StatsSection from "@/components/StatsSection";
import FeaturesSection from "@/components/FeaturesSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

// Disable SSR for Background3D since it uses Three.js and window object
const Background3D = dynamic(() => import("@/components/Background3D"), { ssr: false });

export default function Home() {
  return (
    <main className="relative min-h-screen">
      <Background3D />

      <div className="relative z-[1]">
        <Navbar />
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <HowItWorksSection />
        <CTASection />
        <Footer />
      </div>
    </main>
  );
}
