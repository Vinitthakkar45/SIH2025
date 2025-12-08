"use client";

import { Accordion, AccordionItem } from "@heroui/react";
import { ArrowDown01Icon } from "./icons";

interface DataAccordionItemProps {
  title: string;
  subtitle?: string;
  explanation?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  variant?: "shadow" | "light" | "bordered" | "splitted";
}

export default function DataAccordion({
  title,
  subtitle,
  explanation,
  defaultOpen = false,
  children,
  variant = "shadow",
}: DataAccordionItemProps) {
  return (
    <Accordion defaultExpandedKeys={defaultOpen ? ["1"] : []} variant={variant}>
      <AccordionItem
        key="1"
        aria-label={title}
        title={title}
        classNames={{ trigger: "bg-zinc-900 cursor-pointer px-4 rounded-xl" }}
        subtitle={subtitle}
      >
        <div className="space-y-3">
          {explanation && (
            <div className="bg-zinc-800 rounded-lg px-3 py-2 pl-5 relative ">
              <div className="absolute left-2 top-2 h-[80%] w-1 bg-primary rounded-full" />
              <p className="text-xs text-zinc-300 leading-relaxed">
                <span className="text-primary font-medium">
                  💡 What this shows:{" "}
                </span>
                {explanation}
              </p>
            </div>
          )}
          {children}
        </div>
      </AccordionItem>
    </Accordion>
  );
}
