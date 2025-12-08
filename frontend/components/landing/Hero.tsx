import { DropletIcon } from "@/components/icons";
import { Button } from "@heroui/button";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-linear-to-b from-zinc-900/50 to-zinc-950 pointer-events-none"></div>
      
      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800/50 border border-zinc-700/50">
            <span className="text-xs font-medium text-zinc-300">
              ✨ INGRES AI version 2.0 is here!
            </span>
            <span className="text-xs text-primary">Read more →</span>
          </div>

          {/* Heading */}
          <div className="space-y-6">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-tight">
              Redefine Analytics
              <br />
              with our <span className="text-primary">AI.</span>
            </h1>
            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              Gain access to real-time groundwater analytics and actionable insights,
              empowering you to make informed decisions
            </p>
          </div>

          {/* Search Box - styled like Framer template */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <div className="flex items-center gap-3 px-4 py-3.5 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-xl">
                <input
                  type="text"
                  placeholder="What's the groundwater status in my region?"
                  className="flex-1 bg-transparent text-zinc-300 placeholder:text-zinc-500 outline-none text-sm"
                  readOnly
                />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400 px-2 py-1 bg-zinc-800 rounded">
                    INGRES AI
                  </span>
                  <Button
                    size="sm"
                    color="primary"
                    className="font-medium"
                    startContent={<span className="text-base">✨</span>}
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
              <Button
                size="lg"
                color="primary"
                className="font-medium px-8"
              >
                Get started now
              </Button>
            </Link>
            <Button
              size="lg"
              variant="bordered"
              className="border-zinc-700 text-zinc-300 font-medium hover:bg-zinc-800 px-8"
            >
              How it works
            </Button>
          </div>

          {/* Social Proof */}
          <div className="pt-8">
            <div className="flex items-center justify-center gap-2 text-sm text-zinc-400">
              <span className="flex">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-500">★</span>
                ))}
              </span>
              <span>Trusted by researchers and policymakers</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Cards - Dark theme */}
      <div className="absolute top-1/4 left-[5%] hidden lg:block">
        <div className="bg-zinc-900 rounded-2xl shadow-2xl p-6 w-72 border border-zinc-800 rotate-[-5deg]">
          <p className="text-xs text-zinc-500 mb-2">Blocks Covered</p>
          <p className="text-4xl font-bold text-white mb-1">6,000+</p>
          <p className="text-xs text-primary mb-4">view breakdown</p>
          <div className="space-y-1">
            <div className="h-8 bg-zinc-800 rounded"></div>
            <div className="h-8 bg-primary/20 rounded"></div>
          </div>
        </div>
      </div>

      <div className="absolute top-1/4 right-[5%] hidden lg:block">
        <div className="bg-zinc-900 rounded-2xl shadow-2xl p-6 w-64 border border-zinc-800 rotate-[5deg]">
          <p className="text-xs text-zinc-500 mb-3">Data Accuracy</p>
          <div className="flex items-center justify-center">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#27272a"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  className="text-primary"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray="352"
                  strokeDashoffset="70"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-2xl font-bold text-white">98.5%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
