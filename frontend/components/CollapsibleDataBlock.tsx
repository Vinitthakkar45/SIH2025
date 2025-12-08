"use client";

import { useState } from "react";
import { ArrowDown01Icon, ArrowUp01Icon } from "./icons";

interface CollapsibleDataBlockProps {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export default function CollapsibleDataBlock({
  title,
  subtitle,
  defaultOpen = false,
  children,
}: CollapsibleDataBlockProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg overflow-hidden bg-dark-tertiary">
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
          <ArrowUp01Icon className="text-zinc-400" size={18} />
        ) : (
          <ArrowDown01Icon className="text-zinc-400" size={18} />
        )}
      </button>

      {isOpen && <div className="px-4 py-3 space-y-3">{children}</div>}
    </div>
  );
}
