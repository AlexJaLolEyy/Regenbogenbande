"use client"

import { signOut, useSession } from "@/src/lib/auth-client"
import { getEffectiveRole } from "@/src/lib/auth-utils-shared"
import { ACCENT_OPTIONS } from "@/src/lib/accents"
import { RolePill } from "@/src/lib/components/navigation/role-pill"
import { FIELD_INPUT, PRIMARY_CTA } from "@/src/lib/components/ui/form-kit"
import { UserAvatar } from "@/src/lib/components/ui/user-avatar"
import { useAccent } from "@/src/lib/hooks/use-accent"
import { cn } from "@/src/lib/utils"
import { addToast, Button, Input, Skeleton } from "@heroui/react"
import { motion } from "framer-motion"
import { Camera, Check, LogOut } from "lucide-react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { updateDisplayName, updateProfilePicture } from "./actions"

const THEME_OPTIONS = [
    { id: "light", label: "Light" },
    { id: "dark", label: "Dark" },
    { id: "system", label: "System" },
] as const

/** Tiny window mock: sidebar + content lines, in fixed preview colors. */
function WindowMock({ mode }: { mode: "light" | "dark" }) {
    return (
        <div data-preview={mode} className="flex h-full w-full gap-1.5 p-2" style={{ background: "var(--pv-bg)" }}>
            <div className="w-1/4 rounded-sm" style={{ background: "var(--pv-surface)", border: "1px solid var(--pv-line)" }} />
            <div className="flex flex-1 flex-col gap-1.5">
                <div className="h-2 w-2/3 rounded-sm" style={{ background: "var(--pv-ink)", opacity: 0.7 }} />
                <div className="flex flex-1 gap-1.5">
                    <div className="flex-1 rounded-sm" style={{ background: "var(--pv-surface)", border: "1px solid var(--pv-line)" }} />
                    <div className="flex-1 rounded-sm" style={{ background: "var(--pv-surface)", border: "1px solid var(--pv-line)" }} />
                </div>
            </div>
        </div>
    )
}

function ThemePreview({ id }: { id: (typeof THEME_OPTIONS)[number]["id"] }) {
    if (id === "system") {
        return (
            <div className="relative h-full w-full">
                <div className="absolute inset-0"><WindowMock mode="light" /></div>
                <div className="absolute inset-0" style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}><WindowMock mode="dark" /></div>
            </div>
        )
    }
    return <WindowMock mode={id} />
}

const Section = ({ title, description, children }: { title: string; description: string; children: React.ReactNode }) => (
    <section className="grid gap-6 border-b border-divider py-8 first:pt-0 last:border-b-0 md:grid-cols-3">
        <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="md:col-span-2">{children}</div>
    </section>
)

export default function ProfilePage() {
    const { data: session, isPending: isSessionPending } = useSession()
    const router = useRouter()
    const { theme, setTheme } = useTheme()
    const { accent: activeAccent, setAccent } = useAccent()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [mounted, setMounted] = useState(false)
    const role = getEffectiveRole(session)

    // null = not edited yet, fall back to the session name
    const [localDisplayName, setLocalDisplayName] = useState<string | null>(null)
    const displayName = localDisplayName ?? session?.user?.name ?? ""

    useEffect(() => {
        setMounted(true)
    }, [])
    useEffect(() => {
        if (!isSessionPending && !session?.user) router.push("/login")
    }, [session, isSessionPending, router])

    const handleUpdateDisplayName = async () => {
        setIsLoading(true)
        const res = await updateDisplayName(displayName)
        if (res.success) {
            addToast({ title: "Display name updated", color: "success" })
            setLocalDisplayName(null)
        } else {
            addToast({ title: res.error || "Failed to update display name", color: "danger" })
        }
        setIsLoading(false)
    }

    const handleAvatarSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        e.target.value = ""
        if (!file) return

        setIsUploading(true)
        try {
            const formData = new FormData()
            formData.append("avatar", file)
            const uploadRes = await fetch("/api/profile/avatar", { method: "POST", body: formData })
            const uploadData = await uploadRes.json()
            if (!uploadRes.ok || !uploadData.url) throw new Error(uploadData.error || "Upload failed")
            const res = await updateProfilePicture(uploadData.url)
            if (!res.success) throw new Error(res.error)
            addToast({ title: "Profile picture updated", color: "success" })
            router.refresh()
        } catch (err) {
            addToast({ title: err instanceof Error ? err.message : "Failed to update profile picture", color: "danger" })
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
                },
            },
        })
    }

    if (isSessionPending) {
        return (
            <div className="w-full text-foreground">
                <div className="container mx-auto max-w-4xl p-6 pt-8">
                    <Skeleton className="mb-2 h-9 w-40 rounded-lg" />
                    <Skeleton className="mb-10 h-4 w-64 rounded" />
                    <Skeleton className="h-72 rounded-2xl" />
                </div>
            </div>
        )
    }

    const accentLabel = ACCENT_OPTIONS.find((a) => a.id === activeAccent)?.label ?? "Default"

    return (
        <div className="w-full text-foreground">
            <div className="container mx-auto max-w-4xl p-6 pt-8">
                <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <h1 className="mb-1 text-2xl font-semibold tracking-tight md:text-3xl">Settings</h1>
                    <p className="text-sm text-muted-foreground">Manage your profile, appearance and account</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card/70 px-6 py-8 shadow-sm backdrop-blur-md md:px-8">
                    <Section title="Profile" description="Your avatar and the name other people see.">
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center gap-5">
                                <div className="relative">
                                    <UserAvatar
                                        src={session?.user?.image || undefined}
                                        className="h-20 w-20 text-2xl ring-2 ring-border"
                                        name={session?.user?.name?.[0]}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading || role === "guest"}
                                        aria-label="Change profile picture"
                                        className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-lg border-2 border-card bg-primary text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 outline-theme-accent disabled:opacity-50"
                                    >
                                        {isUploading ? (
                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                                        ) : (
                                            <Camera size={14} />
                                        )}
                                    </button>
                                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarSelected} />
                                </div>
                                <div>
                                    <p className="text-lg font-semibold tracking-tight">{session?.user?.name}</p>
                                    <div className="mt-1"><RolePill role={role} /></div>
                                </div>
                            </div>
                            <Input
                                label="Display name"
                                labelPlacement="outside"
                                placeholder="Enter your name"
                                value={displayName}
                                onValueChange={setLocalDisplayName}
                                variant="bordered"
                                classNames={FIELD_INPUT}
                            />
                            <div className="flex justify-end">
                                <Button className={cn(PRIMARY_CTA, "flex-none px-8")} onPress={handleUpdateDisplayName} isLoading={isLoading}>
                                    Save changes
                                </Button>
                            </div>
                        </div>
                    </Section>

                    <Section title="Appearance" description="Theme and accent color. The accent is used sparingly for focus, active items and charts.">
                        <p className="mb-3 text-sm font-medium">Theme</p>
                        <div className="mb-8 grid grid-cols-3 gap-3" role="radiogroup" aria-label="Theme">
                            {THEME_OPTIONS.map(({ id, label }) => {
                                const active = mounted && theme === id
                                return (
                                    <button
                                        key={id}
                                        type="button"
                                        role="radio"
                                        aria-checked={active}
                                        onClick={() => setTheme(id)}
                                        className={cn(
                                            "group flex flex-col gap-2 rounded-xl border p-2 text-left transition-colors focus-visible:outline-2 outline-theme-accent",
                                            active ? "border-theme-accent bg-accent-soft" : "border-border hover:border-foreground/30"
                                        )}
                                    >
                                        <div className="aspect-video overflow-hidden rounded-lg border border-border">
                                            <ThemePreview id={id} />
                                        </div>
                                        <span className="flex items-center justify-between px-1 text-sm">
                                            {label}
                                            {active && <Check size={14} className="text-theme-accent" />}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>

                        <p className="mb-3 text-sm font-medium">Accent color</p>
                        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Accent color">
                            {ACCENT_OPTIONS.map((a) => {
                                const active = mounted && activeAccent === a.id
                                return (
                                    <button
                                        key={a.id}
                                        type="button"
                                        role="radio"
                                        aria-checked={active}
                                        onClick={() => setAccent(a.id)}
                                        className={cn(
                                            "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors focus-visible:outline-2 outline-theme-accent",
                                            active ? "border-foreground/40 bg-muted font-medium" : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                                        )}
                                    >
                                        <span data-swatch={a.id} className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white">
                                            {active && <Check size={12} className={a.id === "neutral" ? "text-background" : ""} />}
                                        </span>
                                        {a.label}
                                    </button>
                                )
                            })}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/50 p-3">
                            <span className="text-xs text-faint">Preview · {accentLabel}</span>
                            <span className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-sm">
                                <span className="h-4 w-0.5 rounded-full bg-theme-accent" />
                                <span className="text-theme-accent">Active item</span>
                            </span>
                            <span className="rounded-lg border-2 border-theme-accent px-3 py-1 text-sm">Focus ring</span>
                        </div>
                    </Section>

                    <Section title="Account" description="Sign-in details for this account.">
                        <div className="flex flex-col gap-6">
                            <Input
                                label="Email"
                                labelPlacement="outside"
                                value={session?.user?.email || ""}
                                isReadOnly
                                variant="bordered"
                                description={<span className="text-xs text-faint">Linked to your Discord account</span>}
                                classNames={{ ...FIELD_INPUT, inputWrapper: cn(FIELD_INPUT.inputWrapper, "opacity-60") }}
                            />
                            <div>
                                <Button
                                    variant="bordered"
                                    className="h-11 rounded-xl border-danger/40 px-6 font-medium text-danger hover:bg-danger/10"
                                    startContent={<LogOut size={18} />}
                                    onPress={handleLogout}
                                >
                                    Sign out
                                </Button>
                            </div>
                        </div>
                    </Section>
                </motion.div>
            </div>
        </div>
    )
}
