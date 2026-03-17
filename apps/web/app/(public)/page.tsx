// PATH: apps/web/app/(public)/page.tsx
// DESC: Landing page principal — Hero, Tasas en vivo, Cómo funciona, Calculadora, Por qué, Footer

import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ScrollToHash } from '@/components/layout/ScrollToHash';
import { HeroSection } from '@/components/landing/HeroSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { GlobeBidirectionalSection } from '@/components/landing/GlobeBidirectionalSection';
import { WhyUsSection } from '@/components/landing/WhyUsSection';
import { CalculatorSection } from '@/components/landing/CalculatorSection';
import { LocationsSection } from '@/components/landing/LocationsSection';

export default function HomePage() {
  return (
    <>
      <ScrollToHash />
      <Navbar />
      <main>
        <HeroSection />
        <div className="h-px bg-white/[0.06]" aria-hidden />
        <GlobeBidirectionalSection />
        <div className="h-px bg-white/[0.06]" aria-hidden />
        <HowItWorksSection />
        <div className="h-px bg-white/[0.06]" aria-hidden />
        <CalculatorSection />
        <div className="h-px bg-white/[0.06]" aria-hidden />
        <WhyUsSection />
        <div className="h-px bg-white/[0.06]" aria-hidden />
        <LocationsSection />
        <div className="h-px bg-white/[0.06]" aria-hidden />
        <Footer />
      </main>
    </>
  );
}
