"use client"

import { signIn } from "@/src/lib/auth-client"
import { AccentAura } from "@/src/lib/components/backgrounds/accent-aura"
import { DiscordIcon } from "@/src/lib/components/ui/discord-icon"
import { DURATION, EASE } from "@/src/lib/motion"
import { Button } from "@heroui/react"
import { motion } from "framer-motion"
import { AlertCircle } from "lucide-react"
import NextImage from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"

function LoginContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const callbackUrl = searchParams.get("callbackUrl") || "/"

    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    const handleDiscordLogin = async () => {
        setIsLoading(true)
        setError("")

        try {
            await signIn.social({
                provider: "discord",
                callbackURL: callbackUrl,
            })
        } catch (err) {
            if (err instanceof Error && err.message === "NOT_INVITED") {
                setError("You are not invited. Ask an admin for access.")
            } else {
                setError("An unexpected error occurred. Please try again.")
            }
            setIsLoading(false)
        }
    }

    const handleGuestAccess = async () => {
        setIsLoading(true)
        setError("")

        try {
            await signIn.anonymous()
            router.push(callbackUrl)
            router.refresh()
        } catch {
            setError("Could not create guest session. Please try again.")
            setIsLoading(false)
        }
    }

    return (
        <div className="relative flex min-h-screen w-full items-center justify-center p-4">
            <AccentAura />
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: DURATION.slow, ease: EASE }}
                className="relative z-10 w-full max-w-md"
            >
                <div className="rounded-2xl border border-black/5 bg-card/40 p-8 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.08)] backdrop-blur-xl dark:border-white/10">
                    <div className="mb-8 text-center">
                        <NextImage src="/rainbow.svg" alt="" width={48} height={48} className="mx-auto mb-4" />
                        <h1 className="mb-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">Welcome</h1>
                        <p className="text-sm text-muted-foreground">Sign in to access the Regenbogenbande archive</p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            role="alert"
                            className="mb-4 flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
                        >
                            <AlertCircle size={16} />
                            {error}
                        </motion.div>
                    )}

                    <div className="flex flex-col gap-4">
                        <Button
                            onPress={handleDiscordLogin}
                            size="lg"
                            className="h-12 rounded-xl border-none bg-discord font-semibold text-white hover:opacity-90"
                            isLoading={isLoading}
                            startContent={!isLoading && <DiscordIcon size={20} />}
                        >
                            Continue with Discord
                        </Button>

                        <div className="flex items-center gap-4">
                            <div className="h-px flex-1 bg-border" />
                            <span className="text-sm text-faint">or</span>
                            <div className="h-px flex-1 bg-border" />
                        </div>

                        <Button
                            onPress={handleGuestAccess}
                            variant="bordered"
                            size="lg"
                            className="h-12 rounded-xl border-border font-semibold text-foreground hover:bg-muted"
                            isDisabled={isLoading}
                        >
                            Continue as guest
                        </Button>
                    </div>

                    <p className="mt-6 text-center text-xs text-muted-foreground">
                        This is an invite-only platform. Ask an admin if you need access.
                    </p>
                </div>
            </motion.div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense>
            <LoginContent />
        </Suspense>
    )
}
