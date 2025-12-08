export const TARGET_LOCALES = [
  "hi", // Hindi
  "bn", // Bengali
  "te", // Telugu
  "ta", // Tamil
  "ml", // Malayalam
  "pa", // Punjabi
  "ur", // Urdu
  // "mr", // Marathi
  // "gu", // Gujarati
  // "kn", // Kannada
  // "or", // Odia
  // "as", // Assamese
] as const;

export const SOURCE_LOCALE = "en";

export const ALL_LOCALES = [SOURCE_LOCALE, ...TARGET_LOCALES];
