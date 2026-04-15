export default function CTASection() {
  return (
    <section className="w-full px-4 py-14 sm:px-6 sm:py-20 md:px-10 bg-background">
      <div className="mx-auto max-w-5xl text-center">
        <div className="bg-primary rounded-3xl px-6 py-10 sm:px-16 sm:py-20 relative overflow-hidden">
          {/* Decorative shapes */}
          <div className="absolute top-6 left-8 w-12 h-12 rounded-full bg-primary-foreground/10 animate-bounce-soft" />
          <div className="absolute bottom-8 right-12 w-8 h-8 rounded-full bg-primary-foreground/10 animate-bounce-soft" style={{ animationDelay: "1s" }} />
          <div className="absolute top-1/2 right-6 w-6 h-6 rounded-full bg-primary-foreground/5 animate-bounce-soft" style={{ animationDelay: "0.5s" }} />

          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight text-primary-foreground mb-4 animate-float-up">
            Start knocking.
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-md mx-auto animate-float-up-delay-1">
            Every door is an opportunity. Track your grind and watch the results compound.
          </p>
          <button className="bg-primary-foreground text-primary font-bold px-8 py-4 rounded-full text-lg hover:scale-105 transition-transform duration-200 animate-float-up-delay-2 animate-wiggle-hover">
            Get Started Free
          </button>
        </div>
      </div>
    </section>
  );
}
