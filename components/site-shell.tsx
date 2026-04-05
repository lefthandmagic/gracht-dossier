import Link from "next/link";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
          >
            Gracht Dossier
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link
              href="/"
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Shortlist
            </Link>
            <Link
              href="/compare"
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Compare
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
      <footer className="mt-auto border-t border-zinc-200 bg-zinc-50 py-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-black dark:text-zinc-400">
        <div className="mx-auto max-w-5xl px-4">
          <p>
            Informational only: not structural, legal, or investment advice. Data
            comes from Dutch public registers; gaps and errors are possible.
            Always verify with the original source.
          </p>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
            See PDOK, gemeente Amsterdam, CBS, RVO EP-Online, and other attributed
            providers.
          </p>
        </div>
      </footer>
    </>
  );
}
