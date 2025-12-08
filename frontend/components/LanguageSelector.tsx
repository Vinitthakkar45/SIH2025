"use client";

import { useLingoLocale, setLingoLocale } from "lingo.dev/react/client";
import { Select, SelectItem } from "@heroui/react";
import { ALL_LOCALES } from "@/lib/locales";

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
  const currentLocale = useLingoLocale();

  return (
    <Select
      aria-label="Select language"
      selectedKeys={currentLocale ? [currentLocale] : []}
      onSelectionChange={(keys) => {
        const selected = Array.from(keys)[0];
        if (selected) {
          setLingoLocale(selected as string);
        }
      }}
      size={size}
      variant={variant}
      className={className}
      classNames={{
        trigger: "min-w-[140px] h-8",
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
