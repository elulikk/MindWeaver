import { useMindMapStore } from '../../store';
import es from './es';
import en from './en';

export const translations = { es, en };

export type Language = keyof typeof translations;

// Helper type to define the structure of the translations object
type Translations = typeof es;

export const useTranslations = () => {
  const language = useMindMapStore(state => state.language);
  const langPack = translations[language] || es;

  const t = (key: string, replacements?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let result: any = langPack;

    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = result[k];
      } else {
        // Fallback for missing key
        return key;
      }
    }

    if (typeof result !== 'string') {
      return key;
    }
    
    let finalString = result;
    if (replacements) {
      Object.keys(replacements).forEach(rKey => {
        const regex = new RegExp(`{{${rKey}}}`, 'g');
        finalString = finalString.replace(regex, String(replacements[rKey]));
      });
    }

    return finalString;
  };

  return t;
};
