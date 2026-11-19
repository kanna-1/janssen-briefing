export function Masthead() {
  return (
    <header className="border-b border-border pt-2 pb-5 mb-6 md:pt-4 md:pb-6">
      <div className="flex items-end justify-between gap-6">
        <div className="min-w-0">
          <p className="mb-1 text-xs font-medium uppercase text-accent">
            Daily intelligence
          </p>
          <h1 className="font-serif text-3xl font-medium leading-tight text-foreground md:text-4xl">
            Janssen&apos;s Briefing
          </h1>
        </div>
        <p className="hidden max-w-xs text-right text-sm leading-6 text-muted sm:block">
          Search, group, and question a focused news archive.
        </p>
      </div>
    </header>
  );
}
