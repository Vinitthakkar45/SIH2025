import {
  ActivityIcon,
  ArrowRightIcon,
  BarChartIcon,
  Chat01Icon,
  CheckmarkCircle01Icon,
  CodeIcon,
  CpuIcon,
  DatabaseIcon,
  DropletIcon,
  FileIcon,
  FilterIcon,
  HealtcareIcon,
  LayoutIcon,
  MailIcon,
  MapPinIcon,
  MessageIcon,
  ServerStackIcon,
  TwitterIcon,
} from "@/components/icons";
import InteractiveDemoSection from "@/components/InteractiveDemoSection";
import { Button } from "@heroui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="antialiased selection:bg-blue-500/30 selection:text-blue-200">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DropletIcon size={20} className="text-blue-500" />
            <span className="font-medium tracking-tight text-sm text-zinc-100">
              INGRES AI
            </span>
          </div>
          <Link href="/chat">
            <Button
              color="primary"
              className="font-medium"
              endContent={<MessageIcon width={18} height={18} />}
            >
              Start Chatting
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundSize: "40px 40px",
            backgroundImage:
              "linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)",
            maskImage:
              "radial-gradient(circle at center, black 40%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(circle at center, black 40%, transparent 100%)",
          }}
        ></div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/50 mb-8 animate-pulse">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span className="text-xs font-medium text-zinc-400 tracking-wide">
              Live: Real-time Groundwater Insights
            </span>
          </div>

          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-zinc-900 flex items-center justify-center shadow-2xl shadow-blue-500/10">
              <DropletIcon size={40} className="text-blue-500" />
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-semibold tracking-tight text-white mb-6">
            <span
              className="bg-linear-to-br from-white to-zinc-400 bg-clip-text text-transparent"
              style={{
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              INGRES AI
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-zinc-400 font-light tracking-tight mb-4 max-w-3xl mx-auto">
            India&apos;s Groundwater Resource Information System
          </p>

          <p className="text-base md:text-lg text-zinc-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            AI-powered insights into India&apos;s groundwater resources at your
            fingertips. Ask questions, visualize trends, and access
            government-grade data instantly.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/chat">
              <Button color="primary">
                Start Chatting
                <ArrowRightIcon
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-zinc-950/50 backdrop-blur-sm relative z-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            <div className="text-center md:text-left">
              <p className="text-3xl md:text-4xl font-medium text-white tracking-tight mb-1">
                6,000+
              </p>
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">
                Blocks Covered
              </p>
            </div>
            <div className="text-center md:text-left">
              <p className="text-3xl md:text-4xl font-medium text-white tracking-tight mb-1">
                28
              </p>
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">
                States & 8 UTs
              </p>
            </div>
            <div className="text-center md:text-left">
              <p className="text-3xl md:text-4xl font-medium text-white tracking-tight mb-1">
                700+
              </p>
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">
                Districts
              </p>
            </div>
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                <span className="text-3xl md:text-4xl font-medium text-white tracking-tight">
                  Real-time
                </span>
              </div>
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">
                AI Responses
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Example Queries / Interactive Demo */}
      <InteractiveDemoSection />

      {/* Features Section */}
      <section id="features" className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-medium text-white tracking-tight mb-4">
              What You Can Do
            </h2>
            <p className="text-zinc-400 max-w-2xl">
              A comprehensive suite of tools designed for researchers,
              policymakers, and citizens.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="group p-8 rounded-2xl bg-zinc-900/40 transition-all hover:bg-zinc-900/60">
              <div className="h-10 w-10 rounded-lg bg-zinc-800 flex items-center justify-center mb-6 text-blue-400">
                <MessageIcon size={20} className="text-blue-400" />
              </div>
              <h3 className="text-lg font-medium text-zinc-100 mb-2">
                Conversational AI Assistant
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Ask questions in plain English and get context-aware answers
                about groundwater data with streaming responses.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 rounded-2xl bg-zinc-900/40 transition-all hover:bg-zinc-900/60">
              <div className="h-10 w-10 rounded-lg bg-zinc-800 flex items-center justify-center mb-6 text-green-400">
                <DatabaseIcon size={20} className="text-green-400" />
              </div>
              <h3 className="text-lg font-medium text-zinc-100 mb-2">
                Comprehensive Data
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Access data for all 28 states, 8 UTs, and 6,000+ blocks. Analyze
                historical trends and recharge vs extraction metrics.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 rounded-2xl bg-zinc-900/40 transition-all hover:bg-zinc-900/60">
              <div className="h-10 w-10 rounded-lg bg-zinc-800 flex items-center justify-center mb-6 text-purple-400">
                <BarChartIcon size={20} className="text-purple-400" />
              </div>
              <h3 className="text-lg font-medium text-zinc-100 mb-2">
                Smart Visualization
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Auto-generated charts and graphs. Comparative bar charts,
                distribution pie charts, and statistical summaries.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group p-8 rounded-2xl bg-zinc-900/40 transition-all hover:bg-zinc-900/60">
              <div className="h-10 w-10 rounded-lg bg-zinc-800 flex items-center justify-center mb-6 text-orange-400">
                <FilterIcon size={20} className="text-orange-400" />
              </div>
              <h3 className="text-lg font-medium text-zinc-100 mb-2">
                Advanced Search
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Filter by category (Safe, Critical, Over-Exploited). Search by
                specific regions or extraction levels.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group p-8 rounded-2xl bg-zinc-900/40 transition-all hover:bg-zinc-900/60">
              <div className="h-10 w-10 rounded-lg bg-zinc-800 flex items-center justify-center mb-6 text-red-400">
                <ActivityIcon size={20} className="text-red-400" />
              </div>
              <h3 className="text-lg font-medium text-zinc-100 mb-2">
                Detailed Metrics
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                View total extraction (ham), recharge data, net availability,
                and irrigation breakdown per block.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group p-8 rounded-2xl bg-zinc-900/40 transition-all hover:bg-zinc-900/60">
              <div className="h-10 w-10 rounded-lg bg-zinc-800 flex items-center justify-center mb-6 text-teal-400">
                <MapPinIcon size={20} className="text-teal-400" />
              </div>
              <h3 className="text-lg font-medium text-zinc-100 mb-2">
                Interactive Map
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Visual representation of groundwater status with color-coded
                regions and pan/zoom capabilities (Coming Soon).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Data Sources & Metrics Grid */}
      <section id="data" className="py-24 bg-zinc-900/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-16">
            <div className="flex-1">
              <h2 className="text-2xl font-medium text-white mb-6 tracking-tight">
                Data Sources
              </h2>
              <ul className="space-y-4">
                <li className="flex gap-3 items-start">
                  <CheckmarkCircle01Icon
                    width={23}
                    height={23}
                    className="text-green-500 mt-1"
                  />
                  <div>
                    <h4 className="text-sm font-medium text-zinc-200">
                      CGWB Reports
                    </h4>
                    <p className="text-xs text-zinc-500 mt-1">
                      Central Ground Water Board official documentation.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <CheckmarkCircle01Icon
                    width={23}
                    height={23}
                    className="text-green-500 mt-1"
                  />
                  <div>
                    <h4 className="text-sm font-medium text-zinc-200">
                      State Assessments (2022-23)
                    </h4>
                    <p className="text-xs text-zinc-500 mt-1">
                      Latest block-level extraction data.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <CheckmarkCircle01Icon
                    width={23}
                    height={23}
                    className="text-green-500 mt-1"
                  />
                  <div>
                    <h4 className="text-sm font-medium text-zinc-200">
                      Recharge Studies
                    </h4>
                    <p className="text-xs text-zinc-500 mt-1">
                      Scientific estimates of ground replenishment.
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-medium text-white mb-6 tracking-tight">
                Key Highlights
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-zinc-900">
                  <h4 className="text-sm font-medium text-zinc-200 mb-1">
                    100% Local Processing
                  </h4>
                  <p className="text-xs text-zinc-500">
                    No external API dependencies for embeddings.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-zinc-900">
                  <h4 className="text-sm font-medium text-zinc-200 mb-1">
                    Context-Aware
                  </h4>
                  <p className="text-xs text-zinc-500">
                    Maintains conversation history for better flow.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-zinc-900">
                  <h4 className="text-sm font-medium text-zinc-200 mb-1">
                    Privacy-Focused
                  </h4>
                  <p className="text-xs text-zinc-500">
                    No data collection or user tracking.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-zinc-900">
                  <h4 className="text-sm font-medium text-zinc-200 mb-1">
                    Open Data
                  </h4>
                  <p className="text-xs text-zinc-500">
                    Built on public government reports.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section id="use-cases" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-semibold text-white tracking-tight mb-12 text-center">
            Who Can Benefit
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Case 1 */}
            <div className="pl-6 relative group">
              <div className="h-full absolute left-0 group-hover:opacity-100 opacity-0 min-w-1 rounded-full top-0 bg-primary" />
              <h3 className="text-lg font-medium text-zinc-100 mb-2">
                Researchers & Scientists
              </h3>
              <p className="text-sm text-zinc-500">
                Access comprehensive datasets for hydrological studies and
                environmental impact assessments.
              </p>
            </div>
            {/* Case 2 */}
            <div className="pl-6">
              <h3 className="text-lg font-medium text-zinc-100 mb-2">
                Policy Makers
              </h3>
              <p className="text-sm text-zinc-500">
                Derive data-driven insights for effective water management
                policies and allocation.
              </p>
            </div>
            {/* Case 3 */}
            <div className="pl-6">
              <h3 className="text-lg font-medium text-zinc-100 mb-2">
                Farmers & Agriculture
              </h3>
              <p className="text-sm text-zinc-500">
                Understand local groundwater availability to plan irrigation and
                crop cycles sustainably.
              </p>
            </div>
            {/* Case 4 */}
            <div className="pl-6">
              <h3 className="text-lg font-medium text-zinc-100 mb-2">
                NGOs & Activists
              </h3>
              <p className="text-sm text-zinc-500">
                Monitor water stress in specific regions to advocate for
                conservation efforts.
              </p>
            </div>
            {/* Case 5 */}
            <div className="pl-6">
              <h3 className="text-lg font-medium text-zinc-100 mb-2">
                Students & Educators
              </h3>
              <p className="text-sm text-zinc-500">
                Use as an educational resource to teach about India&apos;s
                geography and water conservation.
              </p>
            </div>
            {/* Case 6 */}
            <div className="pl-6">
              <h3 className="text-lg font-medium text-zinc-100 mb-2">
                Urban Planners
              </h3>
              <p className="text-sm text-zinc-500">
                Plan sustainable water infrastructure based on net groundwater
                availability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section id="tech" className="py-20 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-widest mb-10">
            Built With Advanced Technology
          </h2>

          <div className="flex flex-wrap justify-center gap-x-12 gap-y-8 grayscale opacity-70 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2">
              <CpuIcon size={20} className="text-zinc-300" />
              <span className="text-lg font-medium text-zinc-300">
                Groq LLM
              </span>
            </div>
            <div className="flex items-center gap-2">
              <DatabaseIcon size={20} className="text-zinc-300" />
              <span className="text-lg font-medium text-zinc-300">
                Qdrant Vector DB
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ServerStackIcon size={20} className="text-zinc-300" />
              <span className="text-lg font-medium text-zinc-300">
                Node.js Express
              </span>
            </div>
            <div className="flex items-center gap-2">
              <LayoutIcon size={20} className="text-zinc-300" />
              <span className="text-lg font-medium text-zinc-300">
                Next.js 15
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CodeIcon size={20} className="text-zinc-300" />
              <span className="text-lg font-medium text-zinc-300">
                Python ETL
              </span>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-zinc-950 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-zinc-600">
              © 2024 INGRES AI. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-xs text-zinc-600">
              <span>Built with</span>
              <HealtcareIcon size={12} className="text-red-500" />
              <span>for water conservation</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
