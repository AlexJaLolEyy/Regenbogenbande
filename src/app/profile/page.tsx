"use client"

import { signOut, useSession } from "@/src/lib/auth-client"
import { getEffectiveRole } from "@/src/lib/auth-utils-shared"
import { Avatar, Button, Card, CardBody, Input } from "@heroui/react"
import { LogOut, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { updateDisplayName } from "./actions"


export default function ProfilePage() {

    const { data: session, isPending: isSessionPending } = useSession();
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null)
    const role = getEffectiveRole(session);

    // Form states - initialize from session
    const [displayName, setDisplayName] = useState(session?.user?.name || "")

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
            setMessage({ type: "success", text: "Display name updated successfully!" })
        } else {
            setMessage({ type: "error", text: res.error || "Failed to update display name" })
        }
        setIsLoading(false)
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


    return (
        <div className="container mx-auto p-6 pt-24 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8 bg-linear-to-r from-blue-500 to-teal-500 bg-clip-text text-transparent">
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
                            </div>
                            <div className="text-center">
                                <h2 className="text-xl font-semibold">{session?.user?.name}</h2>
                                <p className="text-sm text-gray-500">{session?.user?.email || "No email"}</p>
                                <div className="mt-2 inline-flex px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium capitalize">
                                    {role || "guest"}
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Settings */}
                <div className="md:col-span-2">
                    <Card className="bg-white/50 dark:bg-black/20 backdrop-blur-xl border border-white/20 min-h-100">
                        <CardBody className="p-6">
                                <div className="flex flex-col gap-6">
                                    <div>
                                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                            <User size={18} />
                                            Personal Information
                                        </h3>
                                        <div className="flex flex-col gap-4">
                                            <Input
                                                label="Display Name"
                                                placeholder="Enter your display name"
                                                value={displayName}
                                                onValueChange={setDisplayName}
                                                variant="bordered"
                                            />
                                            <Input
                                                label="Email"
                                                value={session?.user?.email || ""}
                                                isReadOnly
                                                variant="flat"
                                                description="Email is managed by Discord"
                                            />
                                        </div>
                                    </div>

                                    {message && (
                                        <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-success-50 text-success-600' : 'bg-danger-50 text-danger-600'}`}>
                                            {message.text}
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center pt-4 border-t border-white/10">
                                        <Button
                                            color="danger"
                                            variant="flat"
                                            startContent={<LogOut size={16} />}
                                            onPress={handleLogout}
                                        >
                                            Sign Out
                                        </Button>
                                        <Button
                                            color="primary"
                                            onPress={handleUpdateDisplayName}
                                            isLoading={isLoading}
                                        >
                                            Save Changes
                                        </Button>
                                    </div>
                                </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    )
}
