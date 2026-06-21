"use client";
import { useUiStore } from "@/stores/uiStore";
import type { Lang } from "@/lib/types";

const labels: Record<Lang, string> = {
  en: "EN",
  ms: "MY",
  zh: "中文",
};

interface LangToggleProps {
  className?: string;
}

export function LangToggle({ className }: LangToggleProps) {
  const lang = useUiStore((s) => s.lang);
  const setLang = useUiStore((s) => s.setLang);
  const nextLang: Record<Lang, Lang> = {
    en: "ms",
    ms: "zh",
    zh: "en",
  };

  const defaultClasses =
    "flex items-center justify-center w-12 h-12 rounded-full hover:bg-white/10 active:bg-white/20 text-white text-xs font-medium tracking-wider transition-colors";
  const customClasses = className
    ? `flex items-center justify-center w-12 h-12 rounded-full transition-colors text-xs font-medium tracking-wider ${className}`
    : undefined;

  return (
    <button
      onClick={() => setLang(nextLang[lang])}
      className={customClasses ?? defaultClasses}
      aria-label={`Switch language (current: ${lang})`}
    >
      {labels[lang]}
    </button>
  );
}
