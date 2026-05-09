"use client";

import { Navigation } from "@/components/navigation";
import { HeroSection } from "@/components/hero-section";
import { LogoMarquee } from "@/components/logo-marquee";
import { ServicesSection } from "@/components/services-section";
import { AboutSection } from "@/components/about-section";
import { ExperienceSection } from "@/components/experience-section";
import { TestimonialsSection } from "@/components/testimonials-section";
import { Footer } from "@/components/footer";
import { ScrollReveal } from "@/components/scroll-reveal";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FFFFFF] overflow-x-hidden">
      <Navigation />
      <ScrollReveal>
        <HeroSection />
      </ScrollReveal>
      <ScrollReveal direction="scale">
        <LogoMarquee />
      </ScrollReveal>
      <ScrollReveal direction="left">
        <ServicesSection />
      </ScrollReveal>
      <ScrollReveal direction="right">
        <AboutSection />
      </ScrollReveal>
      <ScrollReveal>
        <ExperienceSection />
      </ScrollReveal>
      <ScrollReveal direction="scale">
        <TestimonialsSection />
      </ScrollReveal>
      <ScrollReveal>
        <Footer />
      </ScrollReveal>
    </main>
  );
}
