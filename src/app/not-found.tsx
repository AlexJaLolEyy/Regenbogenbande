import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">404</p>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Nicht gefunden</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Diesen Inhalt gibt es nicht (mehr), oder du hast keinen Zugriff darauf.
      </p>
      <Link
        href="/"
        className="rounded-full border border-border bg-card/70 px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        Zur Startseite
      </Link>
    </div>
  );
}
