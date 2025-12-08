"use client";

import { Button } from "@heroui/button";
import Link from "next/link";
import { Cell, Pie, PieChart, Bar, BarChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { SparklesIcon } from "../icons";

// Sample data for floating charts
const groundwaterCategoryData = [
  { name: "Safe", value: 4234, fill: "hsl(142, 71%, 45%)" },
  { name: "Semi-Critical", value: 856, fill: "hsl(217, 91%, 60%)" },
  { name: "Critical", value: 534, fill: "hsl(38, 92%, 50%)" },
  { name: "Over-Exploited", value: 376, fill: "hsl(4, 90%, 58%)" },
];

const depthTrendData = [
  { year: "2020", depth: 12.5 },
  { year: "2021", depth: 13.2 },
  { year: "2022", depth: 14.1 },
  { year: "2023", depth: 15.8 },
  { year: "2024", depth: 16.3 },
];

const chartConfig = {
  depth: {
    label: "Depth (m)",
    color: "hsl(217, 91%, 60%)",
  },
};

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-b from-zinc-900/50 to-zinc-950 pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="text-center space-y-8">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-tight">
              Unlock India's
              <br />
              Groundwater <span className="text-primary">Intelligence</span>
            </h1>
            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              Transform complex hydrogeological data into actionable insights
              with AI-powered analytics for sustainable water resource
              management
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <div className="flex items-center gap-3 px-4 py-3.5 bg-zinc-900 rounded-2xl shadow-xl max-w-lg mx-auto">
                <input
                  type="text"
                  placeholder="What's the groundwater status in my region?"
                  className="flex-1 bg-transparent text-zinc-300 placeholder:text-zinc-500 outline-none text-sm"
                  readOnly
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    color="primary"
                    className="font-medium"
                    startContent={<SparklesIcon width={18} height={18} />}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link href="/chat">
              <Button color="primary" className="font-medium px-4">
                Get started now
              </Button>
            </Link>
          </div>

          {/* Social Proof */}
          <div className="pt-8">
            <div className="flex items-center justify-center gap-2 text-sm text-zinc-400">
              <span className="flex">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-500">
                    ★
                  </span>
                ))}
              </span>
              <span>Trusted by researchers and policymakers</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Chart Cards - Dark theme */}
      {/* Left: Pie Chart - Groundwater Categories */}
      <div className="absolute top-1/4 left-[5%] hidden lg:block">
        <div className="bg-zinc-900/90 backdrop-blur-sm rounded-2xl shadow-2xl p-6 w-80 -rotate-3 border border-zinc-800">
          <p className="text-sm font-medium text-zinc-300 mb-1">
            Groundwater Status
          </p>
          <p className="text-xs text-zinc-500 mb-4">Blocks by Category</p>
          <ChartContainer config={chartConfig} className="h-[180px] w-full">
            <PieChart>
              <Pie
                data={groundwaterCategoryData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={70}
                stroke="none"
              >
                {groundwaterCategoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip
                content={<ChartTooltipContent hideLabel />}
                cursor={false}
              />
            </PieChart>
          </ChartContainer>
          <div className="flex items-center gap-2 mt-2 flex-wrap text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-[hsl(142,71%,45%)]"></div>
              <span className="text-zinc-400">Safe</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-[hsl(217,91%,60%)]"></div>
              <span className="text-zinc-400">Semi-Critical</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-[hsl(38,92%,50%)]"></div>
              <span className="text-zinc-400">Critical</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-[hsl(4,90%,58%)]"></div>
              <span className="text-zinc-400">Over-Exploited</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Bar Chart - Depth Trend */}
      <div className="absolute top-1/4 right-[5%] hidden lg:block">
        <div className="bg-zinc-900/90 backdrop-blur-sm rounded-2xl shadow-2xl p-6 w-80 rotate-3 border border-zinc-800">
          <p className="text-sm font-medium text-zinc-300 mb-1">
            Water Level Trend
          </p>
          <p className="text-xs text-zinc-500 mb-4">Depth Below Ground (m)</p>
          <ChartContainer config={chartConfig} className="h-[180px] w-full">
            <BarChart
              data={depthTrendData}
              margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
            >
              <XAxis
                dataKey="year"
                tick={{ fontSize: 11, fill: "#a1a1aa" }}
                stroke="#52525b"
                strokeWidth={0}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#a1a1aa" }}
                stroke="#52525b"
                strokeWidth={0}
                axisLine={false}
                tickLine={false}
              />
              <ChartTooltip
                content={<ChartTooltipContent indicator="line" />}
                cursor={false}
              />
              <Bar
                dataKey="depth"
                fill="hsl(217, 91%, 60%)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
          <p className="text-xs text-amber-500 mt-2">
            ⚠ Declining trend observed
          </p>
        </div>
      </div>
    </section>
  );
}
