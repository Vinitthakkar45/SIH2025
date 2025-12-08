import { CheckmarkCircle01Icon } from "@/components/icons";

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

export default function DataSources() {
  return (
    <section className="py-24 bg-zinc-900/50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16">
          {/* Data Sources */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-8">
              Data Sources
            </h2>
            <div className="space-y-6">
              {dataSources.map((source, idx) => (
                <div key={idx} className="flex gap-3">
                  <CheckmarkCircle01Icon
                    width={24}
                    height={24}
                    className="text-green-500 shrink-0"
                  />
                  <div>
                    <h4 className="text-base font-semibold text-white mb-1">
                      {source.title}
                    </h4>
                    <p className="text-sm text-zinc-400">
                      {source.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Key Highlights */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-8">
              Key Highlights
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {highlights.map((highlight, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 hover:shadow-lg transition-all"
                >
                  <h4 className="text-sm font-semibold text-white mb-1">
                    {highlight.title}
                  </h4>
                  <p className="text-xs text-zinc-400">
                    {highlight.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
