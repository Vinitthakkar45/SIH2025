"use client";

import ChartRenderer from "@/components/ChartRenderer";
import ChatComposer from "@/components/ChatComposer";
import { SparklesIcon } from "@/components/icons";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { Button, Chip } from "@heroui/react";
import { useState } from "react";

const EXAMPLES = [
  {
    query: "What is the groundwater status in Gujarat?",
    response:
      "Based on the 2022-2023 assessment, Gujarat has a diverse groundwater profile with varying extraction levels across its 248 assessment blocks.",
    charts: [
      {
        type: "stats" as const,
        title: "Gujarat Groundwater Summary",
        data: {
          totalBlocks: 248,
          safeBlocks: 180,
          semiCritical: 20,
          critical: 24,
          overExploited: 24,
        },
      },
      {
        type: "chart" as const,
        chartType: "pie" as const,
        title: "Category Distribution in Gujarat",
        description: "Breakdown of groundwater assessment categories",
        data: [
          { name: "safe", value: 180 },
          { name: "semi_critical", value: 20 },
          { name: "critical", value: 24 },
          { name: "over_exploited", value: 24 },
        ],
      },
    ],
  },
  {
    query: "Compare Punjab vs Haryana",
    response:
      "Punjab and Haryana show contrasting groundwater extraction patterns. Punjab has higher over-exploitation rates, while Haryana maintains better balance.",
    charts: [
      {
        type: "chart" as const,
        chartType: "bar" as const,
        title: "State Comparison: Punjab vs Haryana",
        description: "Total extraction and recharge comparison",
        data: [
          { name: "Punjab", extraction: 3542, recharge: 2156 },
          { name: "Haryana", extraction: 1876, recharge: 1654 },
        ],
      },
    ],
  },
  {
    query: "List Critical blocks in Rajasthan",
    response:
      "Rajasthan has several blocks classified as Critical based on the latest assessment. Here's the category distribution:",
    charts: [
      {
        type: "chart" as const,
        chartType: "pie" as const,
        title: "Rajasthan Block Categories",
        description: "Distribution across assessment categories",
        data: [
          { name: "safe", value: 195 },
          { name: "semi_critical", value: 34 },
          { name: "critical", value: 28 },
          { name: "over_exploited", value: 38 },
        ],
      },
    ],
  },
  {
    query: "Lowest extraction rates in TN?",
    response:
      "Tamil Nadu shows varied extraction patterns. Here are some districts with lower extraction rates compared to their recharge capacity.",
    charts: [
      {
        type: "chart" as const,
        chartType: "bar" as const,
        title: "Low Extraction Districts in Tamil Nadu",
        description: "Districts with sustainable extraction levels",
        data: [
          { name: "Nilgiris", extraction: 45, recharge: 156 },
          { name: "Kanyakumari", extraction: 78, recharge: 234 },
          { name: "Dharmapuri", extraction: 123, recharge: 298 },
        ],
      },
    ],
  },
];

export default function InteractiveDemoSection() {
  const [selectedExample, setSelectedExample] = useState(0);
  const [input, setInput] = useState("");

  const currentExample = EXAMPLES[selectedExample];

  const handleQueryClick = (query: string, index: number) => {
    setSelectedExample(index);
    setInput("");
  };

  const handleComposerSubmit = (value: string) => {
    // Find matching example or default to first
    const matchingIndex = EXAMPLES.findIndex((ex) =>
      ex.query.toLowerCase().includes(value.toLowerCase())
    );
    if (matchingIndex !== -1) {
      setSelectedExample(matchingIndex);
    }
    setInput("");
  };

  return (
    <section className="py-24 bg-zinc-950">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-sm font-medium text-blue-500 mb-2 uppercase tracking-widest">
            Try Asking
          </h2>
          <h3 className="text-3xl font-medium text-white tracking-tight">
            Conversational Intelligence
          </h3>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {EXAMPLES.map((example, index) => (
            <Button
              key={index}
              radius="full"
              className="cursor-pointer"
              onPress={() => handleQueryClick(example.query, index)}
              color={selectedExample === index ? "primary" : "default"}
              variant={selectedExample === index ? "solid" : "flat"}
            >
              {example.query}
            </Button>
          ))}
        </div>

        <div className="bg-linear-to-br from-zinc-900/40 to-zinc-800/40 backdrop-filter backdrop-blur-xl border border-zinc-800/50 rounded-xl p-1 md:p-2">
          <div className="bg-zinc-950 rounded-lg p-6 min-h-[400px] flex flex-col">
            <div className="flex-1 space-y-6 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <SparklesIcon
                    width={20}
                    height={20}
                    className="text-primary"
                  />
                </div>
                <div className="space-y-3 max-w-[90%] flex-1">
                  <MarkdownRenderer
                    content={currentExample.response}
                    className="text-zinc-300"
                  />
                  {currentExample.charts.map((chart, i) => (
                    <ChartRenderer key={i} chart={chart} />
                  ))}
                </div>
              </div>
            </div>

            <ChatComposer
              value={input}
              onChange={setInput}
              onSubmit={handleComposerSubmit}
              placeholder="Ask about specific districts, extraction rates, or trends..."
            />
          </div>
        </div>
      </div>
    </section>
  );
}
