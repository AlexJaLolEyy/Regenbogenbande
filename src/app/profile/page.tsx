"use client"

import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { Button, Input, Card, CardBody, Tabs, Tab, Avatar } from "@heroui/react"
import { User, Lock, Camera } from "lucide-react"
import { updateUsername, updatePassword } from "./actions"

export default function ProfilePage() {
    const { data: session, update } = useSession()
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null)

    // Form states
    const [username, setUsername] = useState(session?.user?.name || "")
    const [newPassword, setNewPassword] = useState("")

    const handleUpdateUsername = async () => {
        setIsLoading(true)
        setMessage(null)
        const res = await updateUsername(username)
        if (res.success) {
            setMessage({ type: "success", text: "Username updated successfully!" })
            await update() // Update session client-side
        } else {
            setMessage({ type: "error", text: res.error || "Failed to update username" })
        }
        setIsLoading(false)
    }

    const handleUpdatePassword = async () => {
        setIsLoading(true)
        setMessage(null)
        const res = await updatePassword(newPassword)
        if (res.success) {
            setMessage({ type: "success", text: "Password updated successfully! Logging out..." })
            setNewPassword("")
            setTimeout(async () => {
                await signOut({ callbackUrl: "/login" })
            }, 1000)
        } else {
            setMessage({ type: "error", text: res.error || "Failed to update password" })
        }
        setIsLoading(false)
    }

    return (
        <div className="container mx-auto p-6 pt-24 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-500 to-teal-500 bg-clip-text text-transparent">
                My Profile
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="md:col-span-1">
                    <Card className="bg-white/50 dark:bg-black/20 backdrop-blur-xl border border-white/20">
                        <CardBody className="flex flex-col items-center gap-4 py-8">
                            <div className="relative group">
                                <Avatar
                                    src={session?.user?.image || undefined}
                                    className="w-32 h-32 text-4xl"
                                    name={session?.user?.name?.[0]}
                                    isBordered
                                    color="secondary"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                    <Camera className="text-white" />
                                </div>
                            </div>
                            <div className="text-center">
                                <h2 className="text-xl font-semibold">{session?.user?.name}</h2>
                                <p className="text-sm text-gray-500">{session?.user?.email}</p>
                                <div className="mt-2 inline-flex px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium capitalize">
                                    {/* @ts-expect-error role exists */}
                                    {session?.user?.role}
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Settings Tabs */}
                <div className="md:col-span-2">
                    <Card className="bg-white/50 dark:bg-black/20 backdrop-blur-xl border border-white/20 min-h-[400px]">
                        <CardBody className="p-0">
                            <Tabs aria-label="Profile Options" className="p-4" color="primary" variant="underlined">
                                <Tab
                                    key="general"
                                    title={
                                        <div className="flex items-center gap-2">
                                            <User size={18} />
                                            <span>General</span>
                                        </div>
                                    }
                                >
                                    <div className="p-6 flex flex-col gap-6">
                                        <div>
                                            <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                                            <div className="flex flex-col gap-4">
                                                <Input
                                                    label="Username"
                                                    placeholder="Enter your username"
                                                    value={username}
                                                    onValueChange={setUsername}
                                                    variant="bordered"
                                                />
                                                <Input
                                                    label="Email"
                                                    value={session?.user?.email || ""}
                                                    isReadOnly
                                                    variant="flat"
                                                    description="Email cannot be changed."
                                                />
                                            </div>
                                        </div>

                                        {message && (
                                            <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-success-50 text-success-600' : 'bg-danger-50 text-danger-600'}`}>
                                                {message.text}
                                            </div>
                                        )}

                                        <div className="flex justify-end">
                                            <Button
                                                color="primary"
                                                onPress={handleUpdateUsername}
                                                isLoading={isLoading}
                                            >
                                                Save Changes
                                            </Button>
                                        </div>
                                    </div>
                                </Tab>
                                <Tab
                                    key="security"
                                    title={
                                        <div className="flex items-center gap-2">
                                            <Lock size={18} />
                                            <span>Security</span>
                                        </div>
                                    }
                                >
                                    <div className="p-6 flex flex-col gap-6">
                                        <div>
                                            <h3 className="text-lg font-semibold mb-4">Change Password</h3>
                                            <div className="flex flex-col gap-4">
                                                <Input
                                                    type="password"
                                                    label="New Password"
                                                    placeholder="Enter new password"
                                                    value={newPassword}
                                                    onValueChange={setNewPassword}
                                                    variant="bordered"
                                                    description="Minimum 6 characters."
                                                />
                                            </div>
                                        </div>

                                        {message && (
                                            <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-success-50 text-success-600' : 'bg-danger-50 text-danger-600'}`}>
                                                {message.text}
                                            </div>
                                        )}

                                        <div className="flex justify-end">
                                            <Button
                                                color="primary"
                                                onPress={handleUpdatePassword}
                                                isDisabled={!newPassword}
                                                isLoading={isLoading}
                                            >
                                                Update Password
                                            </Button>
                                        </div>
                                    </div>
                                </Tab>
                            </Tabs>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    )
}
