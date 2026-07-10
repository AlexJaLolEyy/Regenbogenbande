"use client";
import { AuroraBackground } from "@/src/lib/components/home/aurora-background";
import { BentoGrid, BentoGridItem } from "@/src/lib/components/home/bento-grid";
import { Marquee } from "@/src/lib/components/home/infinite-marquee";
import { cn } from "@/src/lib/utils";
import { faDiscord } from "@fortawesome/free-brands-svg-icons";
import { faArrowRight, faCrown, faDiamond, faExplosion, faFire, faHeart, faHeartBroken, faImage, faMicrophone, faMobileScreen, faPlay, faQuoteRight, faRobot, faSadTear, faSearch, faShieldHalved } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { motion } from "framer-motion";
import Link from "next/link";

// --- Mock Data: Keywords ---
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

// --- V2 Feature Headers: Tech & Infrastructure ---

// 1. Smart Search (AI/Indexing)
const SearchHeader = () => (
    <div className="flex flex-1 w-full h-full min-h-24 rounded-xl bg-neutral-900 border border-white/10 p-6 relative overflow-hidden flex-col justify-center">
        {/* Background Elements */}
        <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
            <FontAwesomeIcon icon={faSearch} className="text-8xl text-white" />
        </div>

        {/* Search Bar UI */}
        <div className="relative z-10 space-y-3">
            <div className="w-full h-10 bg-white/5 border border-white/10 rounded-lg flex items-center px-3 gap-2">
                <FontAwesomeIcon icon={faSearch} className="text-white/40 text-xs" />
                <div className="h-4 w-1 bg-violet-500 animate-pulse" />
                <span className="text-sm text-white/50 font-mono">valora...</span>
            </div>
            {/* Results */}
            <div className="flex flex-wrap gap-2 opacity-80">
                <div className="px-2 py-1 rounded bg-violet-500/20 text-violet-300 text-[10px] border border-violet-500/30">#valorant</div>
                <div className="px-2 py-1 rounded bg-blue-500/20 text-blue-300 text-[10px] border border-blue-500/30">@Alex</div>
                <div className="px-2 py-1 rounded bg-white/5 text-white/40 text-[10px] border border-white/10">2025</div>
            </div>
        </div>
    </div>
);

// 2. Discord Integration (Bot/Sync)
const DiscordHeader = () => (
    <div className="flex flex-1 w-full h-full min-h-24 rounded-xl bg-[#5865F2]/10 border border-[#5865F2]/20 p-4 relative overflow-hidden flex-col justify-center">
        {/* Decor */}
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#5865F2] blur-[50px] opacity-20" />

        <div className="relative z-10 bg-[#36393f] rounded-lg p-3 border border-white/5 shadow-lg max-w-[90%] mx-auto transform rotate-1 group-hover:rotate-0 transition-transform duration-300">
            <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-[#5865F2] flex items-center justify-center">
                    <FontAwesomeIcon icon={faRobot} className="text-white text-sm" />
                </div>
                <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">RegenbogenBot</span>
                        <span className="px-1 py-px bg-[#5865F2] text-white text-[8px] rounded uppercase">Bot</span>
                        <span className="text-[10px] text-white/30">Today at 4:20 PM</span>
                    </div>
                    <div className="text-[11px] text-white/70 leading-tight">
                        Clip archiviert! 🎥 <span className="text-[#5865F2]">#penta-kill</span> wurde zur Datenbank hinzugefügt.
                    </div>
                </div>
            </div>
        </div>
    </div>
);

// 3. Mobile Ready (Devices)
const MobileHeader = () => (
    <div className="flex flex-1 w-full h-full min-h-24 rounded-xl bg-neutral-900 border border-white/10 overflow-hidden relative group items-center justify-center">
        {/* Grid Background */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />

        {/* Phone Frame */}
        <div className="relative w-16 h-28 border-2 border-white/20 rounded-xl bg-neutral-800 backdrop-blur-sm shadow-2xl flex flex-col items-center pt-2 group-hover:scale-105 transition-transform duration-500">
            <div className="w-6 h-1 rounded-full bg-white/10 mb-2" />
            <div className="w-12 h-16 bg-white/5 rounded mx-auto border border-white/5 flex items-center justify-center">
                <FontAwesomeIcon icon={faPlay} className="text-violet-500/50 text-xl" />
            </div>
        </div>
        {/* Desktop Frame Hint */}
        <div className="absolute -right-8 bottom-0 w-32 h-20 border-2 border-white/20 rounded-xl bg-neutral-800/80 backdrop-blur-sm shadow-xl z-0" />
    </div>
);

// 4. Secure Vault (Privacy/Storage)
const VaultHeader = () => (
    <div className="flex flex-1 w-full h-full min-h-24 rounded-xl bg-neutral-900 border border-white/10 p-4 relative overflow-hidden items-center justify-center group">
        <div className="absolute inset-0 bg-linear-to-t from-emerald-900/20 to-transparent" />

        <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
            <FontAwesomeIcon icon={faShieldHalved} className="text-2xl text-emerald-400" />
        </div>

        {/* Floating Elements */}
        <div className="absolute top-4 right-8 h-2 w-2 bg-emerald-500 rounded-full animate-ping" />
        <div className="absolute bottom-4 left-8 text-[10px] text-emerald-500/50 font-mono">ENCRYPTED</div>
    </div>
);

const NEW_FEATURES = [
    {
        title: "Smart Search",
        description: "Finde jeden Moment. Suche nach Spielern, Spielen oder besonderen Momenten.",
        header: <SearchHeader />,
        icon: <FontAwesomeIcon icon={faSearch} className="h-6 w-6 text-violet-400" />,
    },
    {
        title: "Discord Native (Coming Soon?)",
        description: "Unser Bot synchronisiert alles. Was im Chat passiert, bleibt hier.",
        header: <DiscordHeader />,
        icon: <FontAwesomeIcon icon={faDiscord} className="h-6 w-6 text-[#5865F2]" />,
    },
    {
        title: "Überall verfügbar",
        description: "Optimiert für Desktop, Tablet und Mobile. Deine Clips, immer dabei.",
        header: <MobileHeader />,
        icon: <FontAwesomeIcon icon={faMobileScreen} className="h-6 w-6 text-white" />,
    },
    {
        title: "Secure Vault",
        description: "Sicher gespeichert in der Cloud. Für die Ewigkeit archiviert.",
        header: <VaultHeader />,
        icon: <FontAwesomeIcon icon={faShieldHalved} className="h-6 w-6 text-emerald-400" />,
    },
];

export default function Home() {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-purple-500/30">

            {/* WRAPPER: Fixed Aurora Background */}
            <AuroraBackground className="h-auto min-h-screen fixed! inset-0 z-0">
                <div />
            </AuroraBackground>

            {/* CONTENT LAYER */}
            <div className="relative z-10 w-full min-h-screen flex flex-col">

                {/* HERO SECTION */}
                <section className="flex-1 flex flex-col items-center justify-center min-h-[85vh] px-4 text-center space-y-12 pt-20">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        className="space-y-4"
                    >
                        {/* UPDATED TAG */}
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-4">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-xs font-bold tracking-widest text-white/70">BETA VERSION</span>
                        </div>

                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter">
                            <span className="bg-clip-text text-transparent bg-linear-to-r from-violet-300 via-white to-purple-300 drop-shadow-[0_0_40px_rgba(139,92,246,0.4)]">
                                REGENBOGEN<br />BANDE.
                            </span>
                        </h1>
                        <p className="text-xl md:text-2xl text-white/80 max-w-2xl mx-auto font-light drop-shadow-lg leading-relaxed">
                            Die Heimat für deine <span className="font-semibold text-purple-300 glow-text">besten Momente</span>.
                        </p>
                    </motion.div>

                    {/* GLASS BUTTONS (Refined Layout) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="flex flex-wrap justify-center gap-6"
                    >
                        {/* Video Card */}
                        <Link href="/videos" className="group relative w-full md:w-80 h-36 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden hover:border-violet-500/50 hover:bg-white/10 transition-all shadow-2xl hover:shadow-violet-500/20">
                            <div className="absolute inset-0 bg-linear-to-br from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute inset-0 flex flex-row items-center justify-between px-8">
                                <div className="flex flex-col text-left space-y-1">
                                    <span className="font-bold text-2xl tracking-tight">Clips</span>
                                    <span className="text-xs text-white/50 uppercase tracking-widest font-semibold flex items-center group-hover:gap-2 transition-all">
                                        Ansehen <FontAwesomeIcon icon={faArrowRight} className="ml-1 text-[10px]" />
                                    </span>
                                </div>
                                <div className="h-14 w-14 rounded-full bg-violet-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <FontAwesomeIcon icon={faPlay} className="text-2xl text-violet-300" />
                                </div>
                            </div>
                        </Link>

                        {/* Picture Card */}
                        <Link href="/pictures" className="group relative w-full md:w-80 h-36 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden hover:border-blue-500/50 hover:bg-white/10 transition-all shadow-2xl hover:shadow-blue-500/20">
                            <div className="absolute inset-0 bg-linear-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute inset-0 flex flex-row items-center justify-between px-8">
                                <div className="flex flex-col text-left space-y-1">
                                    <span className="font-bold text-2xl tracking-tight">Bilder</span>
                                    <span className="text-xs text-white/50 uppercase tracking-widest font-semibold flex items-center group-hover:gap-2 transition-all">
                                        Galerie <FontAwesomeIcon icon={faArrowRight} className="ml-1 text-[10px]" />
                                    </span>
                                </div>
                                <div className="h-14 w-14 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <FontAwesomeIcon icon={faImage} className="text-2xl text-blue-300" />
                                </div>
                            </div>
                        </Link>

                        {/* Quote Card */}
                        <Link href="/quotes" className="group relative w-full md:w-80 h-36 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden hover:border-pink-500/50 hover:bg-white/10 transition-all shadow-2xl hover:shadow-pink-500/20">
                            <div className="absolute inset-0 bg-linear-to-br from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute inset-0 flex flex-row items-center justify-between px-8">
                                <div className="flex flex-col text-left space-y-1">
                                    <span className="font-bold text-2xl tracking-tight">Zitate</span>
                                    <span className="text-xs text-white/50 uppercase tracking-widest font-semibold flex items-center group-hover:gap-2 transition-all">
                                        Lesen <FontAwesomeIcon icon={faArrowRight} className="ml-1 text-[10px]" />
                                    </span>
                                </div>
                                <div className="h-14 w-14 rounded-full bg-pink-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <FontAwesomeIcon icon={faQuoteRight} className="text-2xl text-pink-300" />
                                </div>
                            </div>
                        </Link>

                    </motion.div>
                </section>

                {/* KEYWORD MARQUEE */}
                <section className="py-24 border-y border-white/5 bg-black/20 backdrop-blur-md relative overflow-hidden">
                    {/* Shadow Drapes */}
                    <div className="absolute inset-y-0 left-0 w-32 bg-linear-to-r from-black via-black/50 to-transparent z-10" />
                    <div className="absolute inset-y-0 right-0 w-32 bg-linear-to-l from-black via-black/50 to-transparent z-10" />

                    <Marquee pauseOnHover className="[--duration:20s] py-4">
                        {KEYWORDS.map((item, i) => (
                            <div key={i} className="mx-8 flex items-center gap-3 text-white/30 font-bold font-mono text-xl uppercase tracking-widest hover:text-white transition-colors cursor-default select-none group">
                                <FontAwesomeIcon icon={item.icon} className="text-white/20 group-hover:text-purple-400 transition-colors" />
                                {item.text}
                            </div>
                        ))}
                    </Marquee>
                    {/* Reverse second row with offset */}
                    <Marquee reverse pauseOnHover className="[--duration:25s] py-4 opacity-50">
                        {KEYWORDS.slice().reverse().map((item, i) => (
                            <div key={i} className="mx-8 flex items-center gap-3 text-white/30 font-bold font-mono text-xl uppercase tracking-widest hover:text-white transition-colors cursor-default select-none group">
                                <FontAwesomeIcon icon={item.icon} className="text-white/20 group-hover:text-blue-400 transition-colors" />
                                {item.text}
                            </div>
                        ))}
                    </Marquee>
                </section>

                {/* NEW FEATURE BENTO GRID (Infrastructure Focus) */}
                <section className="py-32 max-w-7xl mx-auto px-6 relative">
                    {/* Background Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-purple-900/10 rounded-full blur-[100px] -z-10" />

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="mb-20 text-center"
                    >
                        <h2 className="text-5xl md:text-6xl font-black mb-6 drop-shadow-xl font-heading tracking-tight">
                            ALLES WAS DU BRAUCHST.
                        </h2>
                        <p className="text-xl text-white/60 max-w-2xl mx-auto font-light leading-relaxed">
                            Die Plattform für <span className="text-white font-medium">maximale Performance.</span>
                        </p>
                    </motion.div>

                    <BentoGrid className="md:auto-rows-[22rem]">
                        {NEW_FEATURES.map((feature, i) => (
                            <BentoGridItem
                                key={i}
                                title={feature.title}
                                description={feature.description}
                                header={feature.header}
                                icon={feature.icon}
                                className={cn(
                                    "bg-black/40! backdrop-blur-xl! border-white/10! hover:border-white/20! transition-colors group",
                                    i === 3 || i === 0 ? "md:col-span-2" : ""
                                )}
                            />
                        ))}
                    </BentoGrid>
                </section>

                {/* FOOTER (Refined) */}
                <footer className="py-16 border-t border-white/5 bg-black/80 backdrop-blur-xl relative z-20">
                    <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="flex flex-col items-center md:items-start opacity-70 hover:opacity-100 transition-opacity">
                            <span className="font-bold text-xl tracking-tight text-white">REGENBOGENBANDE</span>
                            <span className="text-sm text-white/40">Premium Gaming Archive</span>
                        </div>

                        <div className="flex gap-8 text-sm font-medium text-white/60">
                            <Link href="#" className="hover:text-white transition-colors hover:underline decoration-violet-500 underline-offset-4">Github</Link>
                            <Link href="#" className="hover:text-white transition-colors hover:underline decoration-blue-500 underline-offset-4">Discord</Link>
                            <Link href="#" className="hover:text-white transition-colors hover:underline decoration-pink-500 underline-offset-4">Impressum</Link>
                        </div>
                    </div>
                </footer>

            </div>
        </div>
    );
}
