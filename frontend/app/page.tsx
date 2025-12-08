import InteractiveDemoSection from "@/components/InteractiveDemoSection";
import Navigation from "@/components/landing/Navigation";
import Hero from "@/components/landing/Hero";
import Stats from "@/components/landing/Stats";
import Features from "@/components/landing/Features";
import DataSources from "@/components/landing/DataSources";
import UseCases from "@/components/landing/UseCases";
import TechStack from "@/components/landing/TechStack";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="antialiased selection:bg-primary/30 selection:text-primary-light">
      <Navigation />
      <Hero />
      <Stats />
      <InteractiveDemoSection />
      <Features />
      <DataSources />
      <UseCases />
      <TechStack />
      <Footer />
    </div>
  );
}
