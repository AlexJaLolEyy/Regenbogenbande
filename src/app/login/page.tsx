"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button, Input } from "@heroui/react"
import { Eye, EyeOff, LogIn, AlertCircle } from "lucide-react"
import Image from "next/image"
import { motion } from "framer-motion"
import ParticlesBackground from "@/src/lib/components/Particles/ParticlesBackground"

export default function LoginPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const callbackUrl = searchParams.get("callbackUrl") || "/"

    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [isVisible, setIsVisible] = useState(false)

    const toggleVisibility = () => setIsVisible(!isVisible)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        try {
            const res = await signIn("credentials", {
                username,
                password,
                redirect: false,
            })

            if (res?.error) {
                setError("Invalid username or password")
                setIsLoading(false)
            } else {
                router.push(callbackUrl)
                router.refresh()
            }
        } catch {
            setError("An unexpected error occurred")
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-black/90">
            {/* Background Image with Blur */}
            <div className="absolute inset-0 z-0">
                <div className="relative w-full h-full">
                    <Image
                        src="/exampleThumbnails/placeholder.png" // Fallback
                        alt="Background"
                        fill
                        className="object-cover opacity-30 blur-sm"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                </div>
            </div>

            {/* Animated Particles */}
            <ParticlesBackground />

            {/* Full Screen Glass Overlay */}
            <div className="absolute inset-0 z-0 backdrop-blur-[4px] bg-black/10" />

            {/* Login Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative z-10 w-full max-w-md px-6"
            >
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-[32px] p-8 shadow-2xl relative overflow-hidden group">
                    {/* Subtle glow on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                    {/* Decorative gradients */}
                    <div className="absolute -top-[100px] -right-[100px] w-[200px] h-[200px] bg-purple-600/20 rounded-full blur-[80px] pointer-events-none" />
                    <div className="absolute -bottom-[100px] -left-[100px] w-[200px] h-[200px] bg-blue-600/20 rounded-full blur-[80px] pointer-events-none" />

                    {/* Header */}
                    <div className="text-center mb-8 relative z-10">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="w-16 h-16 bg-gradient-to-tr from-pink-500 to-violet-500 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg rotate-3"
                        >
                            <LogIn className="text-white w-8 h-8" />
                        </motion.div>
                        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Welcome Back</h1>
                        <p className="text-white/60 text-sm">Sign in to access the Regenbogenbande archive</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="mb-4 bg-danger-500/20 border border-danger-500/50 text-danger-200 px-4 py-3 rounded-xl flex items-center gap-2 text-sm"
                        >
                            <AlertCircle size={16} />
                            {error}
                        </motion.div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4 relative z-10">
                        <Input
                            type="text"
                            label="Username"
                            placeholder="Enter your username"
                            value={username}
                            onValueChange={setUsername}
                            variant="bordered"
                            color="primary"
                            classNames={{
                                inputWrapper: "bg-white/5 border-white/10 hover:border-white/30 text-white data-[hover=true]:border-white/30 group-data-[focus=true]:border-purple-500",
                                label: "text-white/70",
                                input: "text-white placeholder:text-white/30",
                            }}
                            startContent={<div className="pointer-events-none flex items-center"><span className="text-white/40 text-sm">@</span></div>}
                        />

                        <Input
                            label="Password"
                            placeholder="Enter your password"
                            value={password}
                            onValueChange={setPassword}
                            variant="bordered"
                            color="primary"
                            endContent={
                                <button className="focus:outline-none" type="button" onClick={toggleVisibility}>
                                    {isVisible ? (
                                        <EyeOff className="text-white/40 pointer-events-none" size={20} />
                                    ) : (
                                        <Eye className="text-white/40 pointer-events-none" size={20} />
                                    )}
                                </button>
                            }
                            type={isVisible ? "text" : "password"}
                            classNames={{
                                inputWrapper: "bg-white/5 border-white/10 hover:border-white/30 text-white data-[hover=true]:border-white/30 group-data-[focus=true]:border-purple-500",
                                label: "text-white/70",
                                input: "text-white placeholder:text-white/30",
                            }}
                        />

                        <Button
                            type="submit"
                            color="primary"
                            size="lg"
                            className="mt-4 font-semibold shadow-lg shadow-purple-500/20 bg-gradient-to-r from-purple-500 to-pink-600 border-none"
                            isLoading={isLoading}
                        >
                            Sign In
                        </Button>
                    </form>

                    {/* Invite Note */}
                    <div className="mt-6 text-center">
                        <p className="text-white/40 text-xs">
                            Don&apos;t have an account? <span className="text-white/60">Ask an admin for an invite.</span>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
