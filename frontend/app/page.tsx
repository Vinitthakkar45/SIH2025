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

const stats = [
  { value: "6,000+", label: "Blocks Covered" },
  { value: "28", label: "States & 8 UTs" },
  { value: "700+", label: "Districts" },
  { value: "Real-time", label: "AI Responses" },
];

const features = [
  {
    icon: MessageIcon,
    color: "text-accent-blue",
    title: "Conversational AI Assistant",
    description:
      "Ask questions in plain English and get context-aware answers about groundwater data with streaming responses.",
  },
  {
    icon: DatabaseIcon,
    color: "text-accent-green",
    title: "Comprehensive Data",
    description:
      "Access data for all 28 states, 8 UTs, and 6,000+ blocks. Analyze historical trends and recharge vs extraction metrics.",
  },
  {
    icon: BarChartIcon,
    color: "text-accent-purple",
    title: "Smart Visualization",
    description:
      "Auto-generated charts and graphs. Comparative bar charts, distribution pie charts, and statistical summaries.",
  },
  {
    icon: FilterIcon,
    color: "text-accent-orange",
    title: "Advanced Search",
    description:
      "Filter by category (Safe, Critical, Over-Exploited). Search by specific regions or extraction levels.",
  },
  {
    icon: ActivityIcon,
    color: "text-accent-red",
    title: "Detailed Metrics",
    description:
      "View total extraction (ham), recharge data, net availability, and irrigation breakdown per block.",
  },
  {
    icon: MapPinIcon,
    color: "text-accent-teal",
    title: "Interactive Map",
    description:
      "Visual representation of groundwater status with color-coded regions and pan/zoom capabilities (Coming Soon).",
  },
];

const dataSources = [
  {
    title: "CGWB Reports",
    description: "Central Ground Water Board official documentation.",
  },
  {
    title: "State Assessments (2022-23)",
    description: "Latest block-level extraction data.",
  },
  {
    title: "Recharge Studies",
    description: "Scientific estimates of ground replenishment.",
  },
];

const highlights = [
  {
    title: "100% Local Processing",
    description: "No external API dependencies for embeddings.",
  },
  {
    title: "Context-Aware",
    description: "Maintains conversation history for better flow.",
  },
  {
    title: "Privacy-Focused",
    description: "No data collection or user tracking.",
  },
  {
    title: "Open Data",
    description: "Built on public government reports.",
  },
];

const useCases = [
  {
    title: "Researchers & Scientists",
    description:
      "Access comprehensive datasets for hydrological studies and environmental impact assessments.",
  },
  {
    title: "Policy Makers",
    description:
      "Derive data-driven insights for effective water management policies and allocation.",
  },
  {
    title: "Farmers & Agriculture",
    description:
      "Understand local groundwater availability to plan irrigation and crop cycles sustainably.",
  },
  {
    title: "NGOs & Activists",
    description:
      "Monitor water stress in specific regions to advocate for conservation efforts.",
  },
  {
    title: "Students & Educators",
    description:
      "Use as an educational resource to teach about India's geography and water conservation.",
  },
  {
    title: "Urban Planners",
    description:
      "Plan sustainable water infrastructure based on net groundwater availability.",
  },
];

const techStack = [
  { icon: CpuIcon, name: "Groq LLM" },
  { icon: DatabaseIcon, name: "Qdrant Vector DB" },
  { icon: ServerStackIcon, name: "Node.js Express" },
  { icon: LayoutIcon, name: "Next.js 15" },
  { icon: CodeIcon, name: "Python ETL" },
];

export default function Home() {
  return (
    <div className="antialiased selection:bg-primary/30 selection:text-primary-light">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-dark-primary backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DropletIcon size={20} className="text-primary" />
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
        {/* <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none"></div> */}
        {/* <div
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
        ></div> */}

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-dark-tertiary/50 mb-8 animate-pulse">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-light opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-xs font-medium text-zinc-400 tracking-wide">
              Live: Real-time Groundwater Insights
            </span>
          </div>

          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-dark-tertiary flex items-center justify-center shadow-2xl shadow-primary/10">
              <DropletIcon size={40} className="text-primary" />
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
      <section className="bg-dark-primary/50 backdrop-blur-sm relative z-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center md:text-left">
                <p className="text-3xl md:text-4xl font-medium text-white tracking-tight mb-1">
                  {stat.value}
                </p>
                <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">
                  {stat.label}
                </p>
              </div>
            ))}
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
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="group p-6 rounded-2xl bg-dark-card">
                  <div className="w-fit flex items-center justify-center mb-4">
                    <Icon width={30} height={30} className={feature.color} />
                  </div>
                  <h3 className="text-lg font-medium text-zinc-100 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Data Sources & Metrics Grid */}
      <section id="data" className="py-24 bg-dark-tertiary/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-16">
            <div className="flex-1">
              <h2 className="text-2xl font-medium text-white mb-6 tracking-tight">
                Data Sources
              </h2>
              <ul className="space-y-4">
                {dataSources.map((source, idx) => (
                  <li key={idx} className="flex gap-3 items-start">
                    <CheckmarkCircle01Icon
                      width={23}
                      height={23}
                      className="text-green-500 mt-1"
                    />
                    <div>
                      <h4 className="text-sm font-medium text-zinc-200">
                        {source.title}
                      </h4>
                      <p className="text-xs text-zinc-500 mt-1">
                        {source.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-medium text-white mb-6 tracking-tight">
                Key Highlights
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {highlights.map((highlight, idx) => (
                  <div key={idx} className="p-4 rounded-lg bg-dark-tertiary">
                    <h4 className="text-sm font-medium text-zinc-200 mb-1">
                      {highlight.title}
                    </h4>
                    <p className="text-xs text-zinc-500">
                      {highlight.description}
                    </p>
                  </div>
                ))}
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
            {useCases.map((useCase, idx) => (
              <div key={idx} className="pl-6 relative group">
                <div className="h-full absolute left-0 group-hover:opacity-100 opacity-0 min-w-1 rounded-full top-0 bg-primary" />
                <h3 className="text-lg font-medium text-zinc-100 mb-2">
                  {useCase.title}
                </h3>
                <p className="text-sm text-zinc-500">{useCase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section id="tech" className="py-20 bg-dark-primary">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-widest mb-10">
            Built With Advanced Technology
          </h2>

          <div className="flex flex-wrap justify-center gap-x-12 gap-y-8 grayscale opacity-70 hover:opacity-100 transition-opacity">
            {techStack.map((tech, idx) => {
              const Icon = tech.icon;
              return (
                <div key={idx} className="flex items-center gap-2">
                  <Icon size={20} className="text-zinc-300" />
                  <span className="text-lg font-medium text-zinc-300">
                    {tech.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="bg-dark-primary pt-16 pb-8">
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
