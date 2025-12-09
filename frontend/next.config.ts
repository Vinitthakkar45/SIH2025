import type { NextConfig } from "next";
import lingoCompiler from "lingo.dev/compiler";
import { SOURCE_LOCALE, TARGET_LOCALES } from "./lib/locales";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  },
  turbopack: {},
};

export default nextConfig;

// export default lingoCompiler.next({
//   sourceRoot: "app",
//   sourceLocale: SOURCE_LOCALE,
//   targetLocales: [...TARGET_LOCALES],
//   useDirective: true, // when true, use i18n in files.
//   rsc: true,
//   debug: true,
//   // models: "lingo.dev",
//   models: {
//     "*:*": "mistral:mistral-large-latest",
//     // "*:*": "ollama:llama3.1:8b",
//     // "*:*": "groq:llama-3.1-8b-instant",
//     // "*:*": "google:gemini-2.0-flash",
//   },
// })(nextConfig);
