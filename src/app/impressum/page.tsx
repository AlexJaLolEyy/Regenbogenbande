import Link from "next/link";

export const metadata = { title: "Impressum" };

// TODO(owner): replace this placeholder with the legally required provider
// information (name, postal address, contact e-mail) before the site is public.
export default function ImpressumPage() {
    return (
        <main className="mx-auto max-w-2xl px-6 py-16">
            <h1 className="mb-6 text-2xl font-semibold tracking-tight md:text-3xl">Impressum</h1>
            <p className="text-sm text-muted-foreground">
                Provider information has not been added yet. Please contact the site administrator.
            </p>
            <Link href="/" className="mt-8 inline-block text-sm text-muted-foreground transition-colors hover:text-theme-accent">
                Back to home
            </Link>
        </main>
    );
}
