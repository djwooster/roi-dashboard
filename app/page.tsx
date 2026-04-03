import Nav from "@/components/landing/Nav";
import Hero from "@/components/landing/Hero";
import ProblemSection from "@/components/landing/ProblemSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import IntegrationsSection from "@/components/landing/IntegrationsSection";
import PricingSection from "@/components/landing/PricingSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <main className="bg-white text-[#0a0a0a]" style={{ overflowX: "clip" }}>
      <Nav />
      <Hero />
      <ProblemSection />
      <FeaturesSection />
      <IntegrationsSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </main>
  );
}
