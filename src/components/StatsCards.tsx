const stats = [
  { label: "Doors Today", value: "47", emoji: "🚪", bg: "bg-accent" },
  { label: "Conversations", value: "18", emoji: "💬", bg: "bg-secondary" },
  { label: "Leads", value: "6", emoji: "🎯", bg: "bg-primary/10" },
  { label: "Appointments", value: "3", emoji: "📅", bg: "bg-accent" },
];

export default function StatsCards() {
  return (
    <section className="w-full px-4 py-10 sm:px-6 sm:py-14 md:px-10 bg-background">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl md:text-3xl mb-6 sm:mb-8">
          Today's numbers
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`${stat.bg} rounded-2xl p-5 animate-float-up-delay-${i} animate-wiggle-hover transition-shadow hover:shadow-lg cursor-default`}
            >
              <span className="text-3xl block mb-2 animate-bounce-soft" style={{ animationDelay: `${i * 0.4}s` }}>
                {stat.emoji}
              </span>
              <p className="text-3xl sm:text-4xl font-bold tracking-tight tabular-nums">
                {stat.value}
              </p>
              <p className="text-sm font-mono text-muted-foreground mt-1 uppercase tracking-wider">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
