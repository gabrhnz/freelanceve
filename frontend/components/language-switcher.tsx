"use client"

import { useLanguage } from '@/contexts/language-context'
import { Globe } from 'lucide-react'

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  return (
    <button
      onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F5F5F5] hover:bg-[#EBEBEB] rounded-lg text-[14px] font-bold transition-colors border-2 border-black"
      title={language === 'en' ? 'Cambiar a Español' : 'Switch to English'}
    >
      <Globe className="w-4 h-4" />
      <span>{language === 'en' ? 'EN' : 'ES'}</span>
    </button>
  )
}
