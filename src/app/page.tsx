"use client";
import { BentoGrid, BentoGridItem } from "@/src/lib/components/home/bento-grid";
import { Marquee } from "@/src/lib/components/home/infinite-marquee";
import { GlassCard } from "@/src/lib/components/ui/glass-card";
import { faDiscord } from "@fortawesome/free-brands-svg-icons";
import {
    faArrowRight, faCrown, faDiamond, faExplosion, faFire, faHeart, faHeartBroken, faImage,
    faMicrophone, faMobileScreen, faPlay, faQuoteRight, faSadTear, faSearch, faShieldHalved,
    type IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSession } from "@/src/lib/auth-client";

const KEYWORDS = [
    { text: "Wieso hat der ne lilane RPG?", icon: faExplosion },
    { text: "dAs IsT RaGeBaIt", icon: faFire },
    { text: "Das war kein voicecrack", icon: faMicrophone },
    { text: "FF15", icon: faHeartBroken },
    { text: "Nur noch eine Ark-Season?", icon: faSadTear },
    { text: "eig bin ich gold", icon: faDiamond },
    { text: "Bin kein OTP", icon: faCrown },
    { text: "NUR LIEBE", icon: faHeart },
];

const ENTRY_CARDS: { href: string; title: string; cta: string; icon: IconDefinition }[] = [
    { href: "/videos", title: "Clips", cta: "Ansehen", icon: faPlay },
    { href: "/pictures", title: "Bilder", cta: "Galerie", icon: faImage },
    { href: "/quotes", title: "Zitate", cta: "Lesen", icon: faQuoteRight },
];

const IconTile = ({ icon }: { icon: IconDefinition }) => (
    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-muted text-foreground">
        <FontAwesomeIcon icon={icon} className="text-lg" />
    </div>
);

const FEATURES: { title: string; description: string; icon: IconDefinition }[] = [
    {
        title: "Smart Search",
        description: "Finde jeden Moment. Suche nach Spielern, Spielen oder besonderen Momenten.",
        icon: faSearch,
    },
    {
        title: "Discord Native (Coming Soon?)",
        description: "Unser Bot synchronisiert alles. Was im Chat passiert, bleibt hier.",
        icon: faDiscord as unknown as IconDefinition,
    },
    {
        title: "Überall verfügbar",
        description: "Optimiert für Desktop, Tablet und Mobile. Deine Clips, immer dabei.",
        icon: faMobileScreen,
    },
    {
        title: "Secure Vault",
        description: "Sicher gespeichert in der Cloud. Für die Ewigkeit archiviert.",
        icon: faShieldHalved,
    },
];

export default function Home() {
    const { data: session } = useSession();
    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="flex h-14 items-center justify-between px-4 md:px-8">
                <span className="text-sm font-semibold tracking-tight">Regenbogenbande</span>
                <Link
                    href={session ? "/profile" : "/login"}
                    className="rounded-full border border-border bg-card/70 px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                    {session ? "Profil" : "Anmelden"}
                </Link>
            </header>
            <div className="w-full flex flex-col">

                {/* HERO */}
                <section className="flex flex-col items-center justify-center px-4 py-24 md:py-32 text-center space-y-12">
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="space-y-5"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card/70">
                            <span className="h-2 w-2 rounded-full bg-success" />
                            <span className="text-xs font-medium text-muted-foreground">Beta</span>
                        </div>

                        <h1 className="text-5xl md:text-6xl font-semibold tracking-tight text-foreground">
                            Regenbogenbande
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                            Die Heimat für deine <span className="font-medium text-foreground">besten Momente</span>.
                        </p>
                    </motion.div>

                    {/* ENTRY CARDS */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="flex flex-wrap justify-center gap-4 w-full max-w-5xl"
                    >
                        {ENTRY_CARDS.map((card) => (
                            <Link key={card.href} href={card.href} className="group w-full md:w-72 focus-visible:outline-2 outline-theme-accent rounded-2xl">
                                <GlassCard variant="interactive" className="flex h-32 items-center justify-between px-6">
                                    <div className="flex flex-col text-left gap-1">
                                        <span className="text-xl font-semibold tracking-tight">{card.title}</span>
                                        <span className="flex items-center gap-1 text-sm text-muted-foreground transition-all group-hover:gap-2">
                                            {card.cta} <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
                                        </span>
                                    </div>
                                    <IconTile icon={card.icon} />
                                </GlassCard>
                            </Link>
                        ))}
                    </motion.div>
                </section>

                {/* KEYWORD MARQUEE */}
                <section className="py-12 border-y border-border bg-surface relative overflow-hidden">
                    <div className="absolute inset-y-0 left-0 w-24 bg-linear-to-r from-surface to-transparent z-10" />
                    <div className="absolute inset-y-0 right-0 w-24 bg-linear-to-l from-surface to-transparent z-10" />

                    <Marquee pauseOnHover duration={40} className="py-2">
                        {KEYWORDS.map((item, i) => (
                            <div key={i} className="mx-6 flex items-center gap-3 text-faint font-mono text-lg hover:text-foreground transition-colors cursor-default select-none">
                                <FontAwesomeIcon icon={item.icon} className="text-sm" />
                                {item.text}
                            </div>
                        ))}
                    </Marquee>
                </section>

                {/* FEATURES */}
                <section className="py-20 max-w-6xl mx-auto px-6 w-full">
                    <div className="mb-12 text-center">
                        <h2 className="text-3xl font-semibold tracking-tight mb-3">Alles, was du brauchst.</h2>
                        <p className="text-muted-foreground max-w-xl mx-auto">
                            Die Plattform für maximale Performance.
                        </p>
                    </div>

                    <BentoGrid className="md:grid-cols-4 md:auto-rows-auto">
                        {FEATURES.map((feature) => (
                            <BentoGridItem
                                key={feature.title}
                                title={feature.title}
                                description={feature.description}
                                icon={<IconTile icon={feature.icon} />}
                                className="space-y-0 gap-3 justify-start"
                            />
                        ))}
                    </BentoGrid>
                </section>

                {/* FOOTER */}
                <footer className="py-10 border-t border-border bg-surface">
                    <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex flex-col items-center md:items-start">
                            <span className="font-semibold tracking-tight">Regenbogenbande</span>
                            <span className="text-sm text-faint">Gaming Archive</span>
                        </div>

                        <div className="flex gap-6 text-sm text-muted-foreground">
                            <Link href="#" className="hover:text-foreground transition-colors">Github</Link>
                            <Link href="#" className="hover:text-foreground transition-colors">Discord</Link>
                            <Link href="#" className="hover:text-foreground transition-colors">Impressum</Link>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}
