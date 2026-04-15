export default function Footer() {
  return (
    <footer className="w-full px-4 py-6 sm:px-6 sm:py-8 md:px-10 bg-background border-t border-border">
      <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm font-mono text-muted-foreground uppercase tracking-wider">
          Knock Tracker © 2025
        </p>
        <p className="text-sm text-muted-foreground">
          Every door counts 🚪
        </p>
      </div>
    </footer>
  );
}
