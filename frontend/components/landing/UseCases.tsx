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

export default function UseCases() {
  return (
    <section className="py-24 bg-zinc-950">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-white text-center mb-16">
          Who Can Benefit
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {useCases.map((useCase, idx) => (
            <div key={idx} className="space-y-3 group">
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 group-hover:scale-150 transition-transform"></div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {useCase.title}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {useCase.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
