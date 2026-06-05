import fr from './fr.json';
import en from './en.json';

const languages = { fr, en };

let currentLang = 'fr';

export function setLanguage(lang) {
  if (languages[lang]) {
    currentLang = lang;
    document.documentElement.lang = lang;
  }
}

export function getLanguage() {
  return currentLang;
}

export function t(key, params = {}) {
  const dict = languages[currentLang] || languages.fr;
  let str = dict[key] || languages.fr[key] || key;
  for (const [k, v] of Object.entries(params)) {
    str = str.replace(`{${k}}`, v);
  }
  return str;
}
