import InteractiveDemoSection from "@/components/InteractiveDemoSection";
import DataSources from "@/components/landing/DataSources";
import Features from "@/components/landing/Features";
import Footer from "@/components/landing/Footer";
import Hero from "@/components/landing/Hero";
import Navigation from "@/components/landing/Navigation";
import Stats from "@/components/landing/Stats";
import TechStack from "@/components/landing/TechStack";
import UseCases from "@/components/landing/UseCases";

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
