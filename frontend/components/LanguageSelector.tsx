"use client";

import { ALL_LOCALES } from "@/lib/locales";
import type { Selection } from "@heroui/react";
import { Select, SelectItem } from "@heroui/react";
import Cookies from "js-cookie";
import { useState } from "react";

const LANGUAGE_NAMES: Record<
  string,
  { native: string; english: string; flag: string }
> = {
  en: { native: "English", english: "English", flag: "🇺🇸" },
  hi: { native: "हिन्दी", english: "Hindi", flag: "🇮🇳" },
  bn: { native: "বাংলা", english: "Bengali", flag: "🇮🇳" },
  te: { native: "తెలుగు", english: "Telugu", flag: "🇮🇳" },
  ta: { native: "தமிழ்", english: "Tamil", flag: "🇮🇳" },
  ml: { native: "മലയാളം", english: "Malayalam", flag: "🇮🇳" },
  pa: { native: "ਪੰਜਾਬੀ", english: "Punjabi", flag: "🇮🇳" },
  ur: { native: "اردو", english: "Urdu", flag: "🇮🇳" },
};

interface LanguageSelectorProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  variant?: "flat" | "bordered" | "faded" | "underlined";
}

export default function LanguageSelector({
  size = "sm",
  className = "",
  variant = "flat",
}: LanguageSelectorProps) {
  const [currentLocale, setCurrentLocale] = useState(() => {
    return Cookies.get("lingo-locale") || "en";
  });

  const handleLocaleChange = (keys: Selection) => {
    const selected = Array.from(keys)[0] as string;
    if (!selected) return;

    // Write to the lingo-locale cookie
    Cookies.set("lingo-locale", selected, { path: "/" });

    setCurrentLocale(selected);

    window.location.reload();
  };

  return (
    <Select
      aria-label="Select language"
      selectedKeys={currentLocale ? [currentLocale] : []}
      onSelectionChange={handleLocaleChange}
      size={size}
      variant={variant}
      className={`${className} w-fit min-w-40 dark`}
      classNames={{
        value: "text-[13px] font-medium",
      }}
      disallowEmptySelection
      renderValue={(items) => {
        const item = items[0];
        if (!item) return null;
        const lang = LANGUAGE_NAMES[item.key as string];
        if (!lang) return null;
        return (
          <div className="flex items-center gap-1.5">
            <span>{lang.flag}</span>
            <span>{lang.native}</span>
          </div>
        );
      }}
    >
      {ALL_LOCALES.map((locale) => {
        const lang = LANGUAGE_NAMES[locale];
        if (!lang) return null;

        return (
          <SelectItem
            key={locale}
            textValue={`${lang.flag} ${lang.native} (${lang.english})`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{lang.flag}</span>
              <div>
                <div className="text-sm font-medium">{lang.native}</div>
                <div className="text-xs text-zinc-500">{lang.english}</div>
              </div>
            </div>
          </SelectItem>
        );
      })}
    </Select>
  );
}
