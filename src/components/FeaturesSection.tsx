const features = [
  {
    icon: "📊",
    title: "Visual Progress",
    description: "See your activity at a glance with the heatmap. Every knock counts toward your streak.",
  },
  {
    icon: "🔥",
    title: "Streak Tracking",
    description: "Stay motivated with consecutive day tracking. Build momentum and never break the chain.",
  },
  {
    icon: "📈",
    title: "Full Funnel",
    description: "Track doors, conversations, leads, appointments, and wins — the complete sales pipeline.",
  },
];

export default function FeaturesSection() {
  return (
    <section className="w-full px-6 py-16 sm:px-10 bg-secondary/50">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl mb-2">
          Built for grinders
        </h2>
        <p className="text-muted-foreground mb-10 max-w-lg">
          The tools you need to stay consistent, track progress, and close more deals.
        </p>
        <div className="grid sm:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className={`bg-card rounded-3xl p-7 animate-float-up-delay-${i} hover:scale-[1.02] transition-transform duration-200 cursor-default`}
            >
              <span className="text-4xl block mb-4">{feature.icon}</span>
              <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
