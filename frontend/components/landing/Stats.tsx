"use i18n";

const stats = [
  { value: <>6,000+</>, label: <>Blocks Covered</> },
  { value: <>28</>, label: <>States & 8 UTs</> },
  { value: <>700+</>, label: <>Districts</> },
  { value: <>Real-time</>, label: <>AI Responses</> },
];

export default function Stats() {
  return (
    <section className="py-16 bg-zinc-950">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="text-center space-y-2">
              <p className="text-3xl md:text-4xl font-bold text-white">
                {stat.value}
              </p>
              <p className="text-sm text-zinc-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
