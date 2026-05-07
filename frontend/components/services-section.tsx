"use client"

import { Briefcase } from 'lucide-react'
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { useLanguage } from "@/contexts/language-context"

export function ServicesSection() {
  const { t } = useLanguage()
  
  const services = [
    {
      title: t.services.webDev.title,
      description: t.services.webDev.description,
      image: "/images/web-design.svg",
      price: t.services.webDev.price
    },
    {
      title: t.services.uiux.title,
      description: t.services.uiux.description,
      image: "/images/ui-ux-design.svg",
      price: t.services.uiux.price
    },
    {
      title: t.services.smartContracts.title,
      description: t.services.smartContracts.description,
      image: "/images/product-design.svg",
      price: t.services.smartContracts.price
    },
    {
      title: t.services.marketing.title,
      description: t.services.marketing.description,
      image: "/images/user-research.svg",
      price: t.services.marketing.price
    },
    {
      title: t.services.video.title,
      description: t.services.video.description,
      image: "/images/motion-graphics.svg",
      price: t.services.video.price
    },
  ]

  return (
    <section id="services" className="bg-white py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-4xl md:text-[52px] md:leading-[60px] font-bold mb-4">
              {t.services.title} <span className="bg-[#FF4A60] text-white px-3 py-1 inline-block">{t.services.titleHighlight}</span>
            </h2>
            <p className="text-[#393939] text-base md:text-lg font-medium leading-relaxed md:leading-[30px] max-w-2xl mx-auto">
              {t.services.description}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <div
                key={index}
                className="bg-white border-[3px] border-black rounded-[32px] overflow-hidden hover:translate-y-[-4px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 min-h-[480px] flex flex-col group cursor-pointer"
              >
                <div className="mb-6 -mx-[3px] -mt-[3px] overflow-hidden rounded-t-[29px]">
                  <Image
                    src={service.image || "/placeholder.svg"}
                    alt={service.title}
                    width={382}
                    height={328}
                    className="w-full h-auto rounded-t-[29px] group-hover:scale-110 transition-transform duration-500 ease-out"
                  />
                </div>
                <div className="px-8 pb-8 flex-1 flex flex-col">
                  <h3 className="text-[28px] leading-[40px] font-bold mb-3 text-[#0B0B0B]">{service.title}</h3>
                  <p className="text-[18px] leading-[30px] font-medium text-[#393939] flex-1">{service.description}</p>
                  <div className="mt-4 inline-flex items-center gap-2 text-[#2775CA] font-bold">
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                      <circle cx="12" cy="12" r="10"/>
                      <text x="12" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">$</text>
                    </svg>
                    {service.price}
                  </div>
                </div>
              </div>
            ))}

            <div className="bg-[#9945FF] border-[3px] border-black rounded-[32px] p-8 md:p-12 flex flex-col items-center justify-center text-center hover:translate-y-[-4px] transition-transform min-h-[480px] relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="mb-8">
                <div className="w-[92px] h-[92px] bg-white rounded-full flex items-center justify-center border-4 border-black">
                  <Briefcase className="w-12 h-12 text-[#9945FF]" />
                </div>
              </div>
              <h3 className="text-[28px] leading-[40px] font-bold mb-4 text-white">{t.services.cta.title}</h3>
              <p className="text-[18px] leading-[30px] font-medium text-white/90 mb-8">
                {t.services.cta.description}
              </p>
              <Link href="/register">
                <Button className="bg-black text-white hover:bg-black/90 rounded-[16px] px-12 py-6 font-medium text-[18px] w-full max-w-[340px] h-[64px]">
                  <Briefcase className="w-5 h-5 mr-2" />
                  {t.services.cta.button}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
