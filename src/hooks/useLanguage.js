import { useState, useCallback } from 'react'
import translations from '../data/translations'

const STORAGE_KEY = 'msLanguage'

function getInitialLang() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'hi' || stored === 'en') return stored
  } catch (_) {}
  return 'en'
}

/**
 * useLanguage()
 * Returns { language, setLanguage, t }
 * t(key) → translated string for current language
 */
export function useLanguage() {
  const [language, setLangState] = useState(getInitialLang)

  const setLanguage = useCallback((lang) => {
    setLangState(lang)
    try { localStorage.setItem(STORAGE_KEY, lang) } catch (_) {}
  }, [])

  const t = useCallback(
    (key) => translations[language]?.[key] ?? translations['en']?.[key] ?? key,
    [language]
  )

  return { language, setLanguage, t }
}
