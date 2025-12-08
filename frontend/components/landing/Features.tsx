import {
  ActivityIcon,
  BarChartIcon,
  DatabaseIcon,
  FilterIcon,
  MapPinIcon,
  MessageIcon,
} from "@/components/icons";

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
      "Visual representation of groundwater status with color-coded regions and pan/zoom capabilities.",
  },
];

export default function Features() {
  return (
    <section className="py-24 bg-zinc-950">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            What You Can Do
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            A comprehensive suite of tools designed for researchers,
            policymakers, and citizens.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="group p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:shadow-2xl hover:shadow-primary/10 hover:border-zinc-700 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Icon width={24} height={24} className={`${feature.color} group-hover:text-primary transition-colors`} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
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
  );
}
