// PATH: apps/web/app/(public)/page.tsx
// DESC: Landing page principal — tema claro, secciones con fondos alternados blanco/gris

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
      <main className="overflow-x-clip w-full max-w-full">
        <HeroSection />
        <GlobeBidirectionalSection />
        <HowItWorksSection />
        <CalculatorSection />
        <WhyUsSection />
        <LocationsSection />
        <Footer />
      </main>
    </>
  );
}
