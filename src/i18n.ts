import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(HttpApi) // Loads translations from /public/locales
  .use(LanguageDetector) // Detects user language
  .use(initReactI18next) // Passes i18n instance to react-i18next
  .init({
    // Set 'en' as the default language
    fallbackLng: 'en',

    // Your supported languages
    supportedLngs: ['en', 'es', 'hi'],

    // Where to load files from
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },
    
    // Save the user's choice in localStorage
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false, // React already does this
    },

    // Enable debug logs in the browser console
    debug: true,
  });

export default i18n;