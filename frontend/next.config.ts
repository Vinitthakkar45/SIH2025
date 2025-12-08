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

// export default nextConfig;

export default lingoCompiler.next({
  sourceRoot: "app",
  lingoDir: "lingo",
  sourceLocale: SOURCE_LOCALE,
  targetLocales: [...TARGET_LOCALES],
  rsc: true,
  useDirective: false,
  debug: true,
  // models: "lingo.dev",
  models: {
    "*:*": "ollama:llama3.1:8b",
  },
})(nextConfig);
