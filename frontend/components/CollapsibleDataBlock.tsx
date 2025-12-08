"use client";

import { useState } from "react";
import { ArrowDown01Icon, ArrowUp01Icon } from "./icons";

interface CollapsibleDataBlockProps {
  title: string;
  subtitle?: string;
  explanation?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export default function CollapsibleDataBlock({
  title,
  subtitle,
  explanation,
  defaultOpen = false,
  children,
}: CollapsibleDataBlockProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-zinc-700 rounded-lg overflow-hidden bg-dark-tertiary">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-800 transition-colors"
      >
        <div className="text-left">
          <h3 className="font-semibold text-white text-sm">{title}</h3>
          {subtitle && (
            <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        {isOpen ? (
          <ArrowUp01Icon className="text-zinc-400 flex-shrink-0" size={18} />
        ) : (
          <ArrowDown01Icon className="text-zinc-400 flex-shrink-0" size={18} />
        )}
      </button>

      {isOpen && (
        <div className="px-4 py-3 border-t border-zinc-700 space-y-3">
          {explanation && (
            <div className="bg-zinc-800/50 rounded-md px-3 py-2 border-l-2 border-blue-500">
              <p className="text-xs text-zinc-300 leading-relaxed">
                <span className="text-blue-400 font-medium">
                  💡 What this shows:{" "}
                </span>
                {explanation}
              </p>
            </div>
          )}
          {children}
        </div>
      )}
    </div>
  );
}
