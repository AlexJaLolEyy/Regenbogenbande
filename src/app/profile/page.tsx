"use client"

import { signOut, useSession } from "@/src/lib/auth-client";
import { getEffectiveRole } from "@/src/lib/auth-utils-shared";
import { UserAvatar } from "@/src/lib/components/ui/user-avatar";
import { AccentId, useAccent } from "@/src/lib/hooks/use-accent";
import { cn } from "@/src/lib/utils";
import { Button, Input, Skeleton } from "@heroui/react";
import { motion } from "framer-motion";
import { Camera, Crown, LogOut, Monitor, Moon, ShieldCheck, Sun, User as UserIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { updateDisplayName, updateProfilePicture } from "./actions";

const FIELD = {
    inputWrapper: "bg-muted h-12 rounded-xl border border-border hover:border-foreground/30 transition-colors data-[focus=true]:border-theme-accent",
    label: "text-sm font-medium text-muted-foreground",
}

const THEME_OPTIONS = [
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
    { id: "system", label: "System", icon: Monitor },
] as const

// Accent palettes are defined in globals.css ([data-accent]).
const ACCENTS: { id: AccentId; label: string; color: string }[] = [
    { id: "neutral", label: "Neutral", color: "var(--foreground)" },
    { id: "ocean", label: "Ocean Blue", color: "#3E82C7" },
    { id: "forest", label: "Forest Green", color: "#3F7D5B" },
    { id: "teal", label: "Teal", color: "#2E9090" },
    { id: "wine", label: "Wine Red", color: "#9C3B49" },
    { id: "pink", label: "Dusty Pink", color: "#C56A8E" },
    { id: "violet", label: "Violet", color: "#7A6AC6" },
]

const Card = ({ className, children }: { className?: string; children: React.ReactNode }) => (
    <div className={cn("rounded-2xl border border-border bg-card/70 p-8 shadow-sm backdrop-blur-md", className)}>
        {children}
    </div>
)

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h3 className="mb-6 text-sm font-medium text-muted-foreground">{children}</h3>
)

export default function ProfilePage() {
    const { data: session, isPending: isSessionPending } = useSession();
    const router = useRouter()
    const { theme, setTheme } = useTheme()
    const { accent: activeAccent, setAccent } = useAccent()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null)
    const role = getEffectiveRole(session);

    // Form states - use null for initial state to allow fallback to session name
    const [localDisplayName, setLocalDisplayName] = useState<string | null>(null)
    const displayName = localDisplayName ?? session?.user?.name ?? "";

    useEffect(() => {
        setMounted(true)
    }, [])
    useEffect(() => {
        if (!isSessionPending && !session?.user) {
            router.push('/login');
        }
    }, [session, isSessionPending, router]);

    const handleUpdateDisplayName = async () => {
        setIsLoading(true)
        setMessage(null)
        const res = await updateDisplayName(displayName)
        if (res.success) {
            setMessage({ type: "success", text: "Display name updated." })
            setLocalDisplayName(null);
        } else {
            setMessage({ type: "error", text: res.error || "Failed to update display name." })
        }
        setIsLoading(false)
    }

    const handleAvatarSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        e.target.value = ""
        if (!file) return

        setIsUploading(true)
        setMessage(null)
        try {
            const formData = new FormData()
            formData.append("avatar", file)
            const uploadRes = await fetch("/api/profile/avatar", { method: "POST", body: formData })
            const uploadData = await uploadRes.json()
            if (!uploadRes.ok || !uploadData.url) {
                throw new Error(uploadData.error || "Upload failed")
            }
            const res = await updateProfilePicture(uploadData.url)
            if (!res.success) throw new Error(res.error)
            setMessage({ type: "success", text: "Profile picture updated." })
            router.refresh()
        } catch (err) {
            setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to update profile picture." })
        } finally {
            setIsUploading(false)
        }
    }

    const handleLogout = async () => {
        await signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push("/login")
                    router.refresh()
                }
            }
        })
    }

    if (isSessionPending) {
        return (
            <div className="w-full text-foreground">
                <div className="container mx-auto max-w-5xl p-6 pt-8">
                    <Skeleton className="mb-2 h-9 w-40 rounded-lg" />
                    <Skeleton className="mb-10 h-4 w-64 rounded" />
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                        <Skeleton className="h-72 rounded-2xl md:col-span-1" />
                        <Skeleton className="h-72 rounded-2xl md:col-span-2" />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full text-foreground">
            <div className="container mx-auto max-w-5xl p-6 pt-8">
                <motion.div
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10"
                >
                    <h1 className="mb-1 text-3xl font-semibold tracking-tight">Profile</h1>
                    <p className="text-sm text-muted-foreground">Manage your account and appearance</p>
                </motion.div>
                        <div className="mt-4 grid grid-cols-1 gap-8 md:grid-cols-3">
                            {/* Profile card */}
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="md:col-span-1">
                                <Card className="flex flex-col items-center gap-6">
                                    <div className="relative">
                                        <UserAvatar
                                            src={session?.user?.image || undefined}
                                            className="h-32 w-32 text-4xl ring-4 ring-border"
                                            name={session?.user?.name?.[0]}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isUploading || role === "guest"}
                                            aria-label="Change profile picture"
                                            className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-xl border-2 border-card bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                                        >
                                            {isUploading ? (
                                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                                            ) : (
                                                <Camera size={16} />
                                            )}
                                        </button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            className="hidden"
                                            onChange={handleAvatarSelected}
                                        />
                                    </div>

                                    <div className="text-center">
                                        <h2 className="mb-1 text-2xl font-semibold tracking-tight">{session?.user?.name}</h2>
                                        <p className="text-sm text-muted-foreground">{session?.user?.email || "No email"}</p>

                                        <div className="mt-5 flex items-center justify-center">
                                            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                                                {role === 'owner' ? <Crown size={12} /> : role === 'admin' ? <ShieldCheck size={12} /> : <UserIcon size={12} />}
                                                <span className="capitalize">{role}</span>
                                            </span>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>

                            {/* Settings */}
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 md:col-span-2">
                                <Card>
                                    <SectionTitle>Account</SectionTitle>
                                    <div className="flex flex-col gap-6">
                                        <Input
                                            label="Display name"
                                            labelPlacement="outside"
                                            placeholder="Enter your name"
                                            value={displayName}
                                            onValueChange={setLocalDisplayName}
                                            variant="bordered"
                                            classNames={FIELD}
                                        />
                                        <Input
                                            label="Email"
                                            labelPlacement="outside"
                                            value={session?.user?.email || ""}
                                            isReadOnly
                                            variant="bordered"
                                            description={<span className="text-xs text-faint">Linked to your Discord account</span>}
                                            classNames={{ ...FIELD, inputWrapper: cn(FIELD.inputWrapper, "opacity-60") }}
                                        />
                                    </div>

                                    {message && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.97 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className={cn(
                                                "mt-6 rounded-xl border p-3 text-center text-sm",
                                                message.type === 'success'
                                                    ? 'border-success/30 bg-success/10 text-success'
                                                    : 'border-danger/30 bg-danger/10 text-danger'
                                            )}
                                        >
                                            {message.text}
                                        </motion.div>
                                    )}

                                    <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-divider pt-6 sm:flex-row">
                                        <Button
                                            variant="flat"
                                            className="h-11 w-full rounded-xl bg-danger/10 px-6 font-medium text-danger hover:bg-danger/20 sm:w-auto"
                                            startContent={<LogOut size={18} />}
                                            onPress={handleLogout}
                                        >
                                            Log out
                                        </Button>
                                        <Button
                                            className="h-11 w-full rounded-xl bg-primary px-8 font-medium text-primary-foreground hover:opacity-90 sm:w-auto"
                                            onPress={handleUpdateDisplayName}
                                            isLoading={isLoading}
                                        >
                                            Save changes
                                        </Button>
                                    </div>
                                </Card>

                                <Card>
                                    <SectionTitle>Appearance</SectionTitle>

                                    <p className="mb-3 text-sm font-medium text-foreground">Theme</p>
                                    <div className="mb-8 inline-flex gap-1 rounded-xl border border-border bg-muted p-1">
                                        {THEME_OPTIONS.map(({ id, label, icon: Icon }) => {
                                            const active = mounted && theme === id
                                            return (
                                                <button
                                                    key={id}
                                                    type="button"
                                                    onClick={() => setTheme(id)}
                                                    aria-pressed={active}
                                                    className={cn(
                                                        "flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors",
                                                        active
                                                            ? "bg-primary font-medium text-primary-foreground"
                                                            : "text-muted-foreground hover:text-foreground"
                                                    )}
                                                >
                                                    <Icon size={14} /> {label}
                                                </button>
                                            )
                                        })}
                                    </div>

                                    <p className="mb-1 text-sm font-medium text-foreground">Accent color</p>
                                    <p className="mb-3 text-xs text-faint">Used sparingly for focus rings, active items and charts.</p>
                                    <div className="flex flex-wrap gap-3">
                                        {ACCENTS.map((accent) => (
                                            <button
                                                key={accent.id}
                                                type="button"
                                                onClick={() => setAccent(accent.id)}
                                                title={accent.label}
                                                aria-label={accent.label}
                                                aria-pressed={mounted && activeAccent === accent.id}
                                                className={cn(
                                                    "h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 outline-offset-2",
                                                    mounted && activeAccent === accent.id ? "border-foreground" : "border-transparent"
                                                )}
                                                style={{ background: accent.color }}
                                            />
                                        ))}
                                    </div>
                                </Card>
                            </motion.div>
                        </div>
            </div>
        </div>
    )
}
