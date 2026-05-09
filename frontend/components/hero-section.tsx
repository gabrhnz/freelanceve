"use client"

import { Search, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useLanguage } from "@/contexts/language-context"

export function HeroSection() {
  const { t } = useLanguage()
  
  return (
    <section className="container mx-auto px-4 py-16 md:py-24">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h1 className="text-[42px] leading-[50px] md:text-[72px] font-bold md:leading-[85px]">
            {t.hero.title1} <span className="bg-[#FF6B7A] text-white px-3 py-1 inline-block">{t.hero.titleHighlight1}</span> {t.hero.title2}{" "}
            <span className="bg-[#2775CA] text-white px-3 py-1 inline-block">{t.hero.titleHighlight2}</span> {t.hero.title3}
          </h1>

          <p className="text-[#393939] text-[16px] md:text-[18px] font-medium leading-[28px] md:leading-[30px] max-w-xl">
            {t.hero.description}
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap gap-4 sm:gap-7 pt-4">
            <Link href="/register">
              <Button className="bg-[#0B0B0B] text-white hover:bg-black/90 rounded-lg py-5 px-8 md:py-[22px] md:px-[62px] text-base md:text-lg font-semibold h-auto w-full sm:w-auto sm:min-w-[240px]">
                <Briefcase className="w-5 h-5" />
                {t.hero.cta1}
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button
                variant="outline"
                className="bg-white border-[3px] border-black hover:bg-gray-50 rounded-lg py-5 px-8 md:py-[22px] md:px-[62px] text-base md:text-lg font-semibold h-auto w-full sm:w-auto sm:min-w-[240px]"
              >
                <Search className="w-5 h-5" />
                {t.hero.cta2}
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex justify-center md:justify-end">
          <div className="relative w-full max-w-md aspect-square bg-[#9945FF] border-4 border-black rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
            <div className="text-center p-8">
              <div className="w-24 h-24 mx-auto mb-4 bg-white rounded-full flex items-center justify-center border-4 border-black">
                <svg viewBox="0 0 128 128" className="w-16 h-16">
                  <circle cx="64" cy="64" r="60" fill="#2775CA"/>
                  <text x="64" y="80" textAnchor="middle" fill="white" fontSize="48" fontWeight="bold">$</text>
                </svg>
              </div>
              <div className="text-white text-2xl font-bold mb-2">{t.hero.badge}</div>
              <div className="text-white/80 text-sm">{t.hero.badgeSub}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
