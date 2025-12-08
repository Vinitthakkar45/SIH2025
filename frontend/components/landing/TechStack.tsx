import {
  CodeIcon,
  CpuIcon,
  DatabaseIcon,
  LayoutIcon,
  ServerStackIcon,
} from "@/components/icons";

const techStack = [
  { icon: CpuIcon, name: <>Groq LLM</> },
  { icon: DatabaseIcon, name: <>Qdrant Vector DB</> },
  { icon: ServerStackIcon, name: <>Node.js Express</> },
  { icon: LayoutIcon, name: <>Next.js 15</> },
  { icon: CodeIcon, name: <>Python ETL</> },
];

export default function TechStack() {
  return (
    <section className="py-20 bg-zinc-900/50">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-12">
          Built With
        </h2>

        <div className="flex flex-wrap justify-center gap-x-12 gap-y-8 opacity-60 hover:opacity-100 transition-opacity">
          {techStack.map((tech, idx) => {
            const Icon = tech.icon;
            return (
              <div key={idx} className="flex items-center gap-3 text-zinc-400">
                <Icon size={20} />
                <span className="text-base font-medium">{tech.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
