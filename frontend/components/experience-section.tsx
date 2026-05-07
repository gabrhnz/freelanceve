"use client"

import { ArrowRight, Shield, Zap, Globe, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useLanguage } from "@/contexts/language-context"

export function ExperienceSection() {
  const { t } = useLanguage()
  
  const features = [
    {
      step: t.howItWorks.step1.step,
      title: t.howItWorks.step1.title,
      description: t.howItWorks.step1.description,
      icon: <Shield className="w-6 h-6 text-[#9945FF]" />,
    },
    {
      step: t.howItWorks.step2.step,
      title: t.howItWorks.step2.title,
      description: t.howItWorks.step2.description,
      icon: <Globe className="w-6 h-6 text-[#14F195]" />,
    },
    {
      step: t.howItWorks.step3.step,
      title: t.howItWorks.step3.title,
      description: t.howItWorks.step3.description,
      icon: <Lock className="w-6 h-6 text-[#2775CA]" />,
    },
    {
      step: t.howItWorks.step4.step,
      title: t.howItWorks.step4.title,
      description: t.howItWorks.step4.description,
      icon: <Zap className="w-6 h-6 text-[#FFC224]" />,
    },
  ]

  return (
    <section className="bg-black py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-start">
          <div className="text-white pt-0 md:pt-12 md:sticky md:top-12 self-start">
            <h2 className="text-3xl md:text-4xl lg:text-6xl font-bold mb-6 md:mb-8 leading-[1.3]">
              {t.howItWorks.title} <span className="bg-[#9945FF] text-white px-3 py-1 inline-block">{t.howItWorks.titleHighlight}</span>
            </h2>
            <p className="text-gray-400 mb-8 md:mb-10 leading-relaxed text-base md:text-lg">
              {t.howItWorks.description}
            </p>
            <Link href="/register">
              <Button className="bg-white text-black hover:bg-gray-50 rounded-lg py-5 px-8 md:py-[22px] md:px-[62px] text-base md:text-lg font-semibold h-auto w-full sm:w-auto sm:min-w-[240px]">
                <ArrowRight className="w-5 h-5" />
                {t.howItWorks.cta}
              </Button>
            </Link>
          </div>

          <div className="space-y-6">
            {features.map((feature, index) => (
              <div key={index} className="bg-white border-4 border-black rounded-3xl min-h-[220px] md:min-h-[240px]">
                <div className="flex items-center justify-between mb-4 md:mb-6 pt-6 md:pt-8 px-6 md:px-8">
                  <div className="text-base md:text-[22px] leading-tight md:leading-[34px] font-bold text-[#0B0B0B]">
                    {feature.step}
                  </div>
                  <div className="w-12 h-12 rounded-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center bg-white">
                    {feature.icon}
                  </div>
                </div>

                <div className="border-t-[3px] border-black mb-4 md:mb-6"></div>

                <div className="px-6 md:px-8 pb-6 md:pb-8">
                  <h3 className="text-xl md:text-[28px] leading-tight md:leading-[40px] font-bold text-[#0B0B0B] mb-2 md:mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-[#393939] text-base md:text-[20px] leading-relaxed md:leading-[32px]">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
