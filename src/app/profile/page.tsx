"use client"

import { signOut, useSession } from "@/src/lib/auth-client"
import { getEffectiveRole } from "@/src/lib/auth-utils-shared"
import { queryKeys } from "@/src/lib/queries/query-keys"
import { Avatar, Button, Card, CardBody, Input, Tab, Tabs } from "@heroui/react"
import { useQuery } from "@tanstack/react-query"
import {
    ArcElement,
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip,
} from 'chart.js'
import { BarChart3, LogOut, Settings, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Doughnut, Line } from 'react-chartjs-2'
import { getUserStats, updateDisplayName } from "./actions"

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
)

export default function ProfilePage() {
    const { data: session, isPending: isSessionPending } = useSession();
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null)
    const role = getEffectiveRole(session);

    // Form states - use null for initial state to allow fallback to session name
    const [localDisplayName, setLocalDisplayName] = useState<string | null>(null)
    const displayName = localDisplayName ?? session?.user?.name ?? "";

    // Stats fetching with TanStack Query
    const { data: statsData, isLoading: isStatsLoading } = useQuery({
        queryKey: queryKeys.user.stats(),
        queryFn: async () => {
            const res = await getUserStats();
            if (!res.success) throw new Error(res.error || "Failed to fetch stats");
            return res.stats;
        },
        enabled: !!session?.user,
    });
    const stats = statsData;

    // Handle session redirection
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
            // We don't need to manually update local state here if session refreshes,
            // but for immediate UI feedback we can. However, revalidatePath will handle it.
            setLocalDisplayName(null); // Reset to use session's updated name
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

    if (isSessionPending) return null;

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)',
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.5)',
                }
            },
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.5)',
                }
            }
        }
    };

    const activityData = {
        labels: stats?.monthlyActivity.map((a: any) => a.label) || [],
        datasets: [{
            label: 'Uploads',
            data: stats?.monthlyActivity.map((a: any) => a.count) || [],
            borderColor: 'rgb(20, 184, 166)',
            backgroundColor: 'rgba(20, 184, 166, 0.5)',
            tension: 0.4,
            fill: true,
        }]
    };

    const distributionData = {
        labels: ['Videos', 'Pictures', 'Quotes'],
        datasets: [{
            data: [stats?.counts.videos || 0, stats?.counts.pictures || 0, stats?.counts.quotes || 0],
            backgroundColor: [
                'rgba(59, 130, 246, 0.6)',
                'rgba(168, 85, 247, 0.6)',
                'rgba(20, 184, 166, 0.6)',
            ],
            borderColor: [
                'rgba(59, 130, 246, 1)',
                'rgba(168, 85, 247, 1)',
                'rgba(20, 184, 166, 1)',
            ],
            borderWidth: 1,
        }]
    };

    return (
        <div className="container mx-auto p-6 pt-24 max-w-6xl">
            <h1 className="text-3xl font-bold mb-8 bg-linear-to-r from-blue-500 to-teal-500 bg-clip-text text-transparent">
                My Profile
            </h1>

            <Tabs
                aria-label="Profile options"
                variant="underlined"
                classNames={{
                    tabList: "gap-6 w-full relative rounded-none border-b border-divider",
                    cursor: "w-full bg-primary",
                    tab: "max-w-fit px-0 h-12",
                    tabContent: "group-data-[selected=true]:text-primary"
                }}
            >
                <Tab
                    key="info"
                    title={
                        <div className="flex items-center space-x-2">
                            <User size={18} />
                            <span>Info</span>
                        </div>
                    }
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-6">
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
                            <Card className="bg-white/50 dark:bg-black/20 backdrop-blur-xl border border-white/20">
                                <CardBody className="p-6">
                                    <div className="flex flex-col gap-6">
                                        <div>
                                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                                <Settings size={18} />
                                                Account Settings
                                            </h3>
                                            <div className="flex flex-col gap-4">
                                                <Input
                                                    label="Display Name"
                                                    placeholder="Enter your display name"
                                                    value={displayName}
                                                    onValueChange={setLocalDisplayName}
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
                </Tab>

                <Tab
                    key="stats"
                    title={
                        <div className="flex items-center space-x-2">
                            <BarChart3 size={18} />
                            <span>Statistics</span>
                        </div>
                    }
                >
                    <div className="mt-6">
                        {isStatsLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
                                {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-white/5 rounded-2xl" />)}
                            </div>
                        ) : stats ? (
                            <div className="flex flex-col gap-8">
                                {/* Metric Cards */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <Card className="bg-blue-500/10 border-blue-500/20">
                                        <CardBody className="p-4 flex flex-col items-center">
                                            <p className="text-xs text-blue-400 uppercase font-bold tracking-wider">Total Uploads</p>
                                            <p className="text-3xl font-bold mt-1">{stats.counts.total}</p>
                                        </CardBody>
                                    </Card>
                                    <Card className="bg-teal-500/10 border-teal-500/20">
                                        <CardBody className="p-4 flex flex-col items-center">
                                            <p className="text-xs text-teal-400 uppercase font-bold tracking-wider">Total Views</p>
                                            <p className="text-3xl font-bold mt-1">{stats.views}</p>
                                        </CardBody>
                                    </Card>
                                    <Card className="bg-purple-500/10 border-purple-500/20">
                                        <CardBody className="p-4 flex flex-col items-center">
                                            <p className="text-xs text-purple-400 uppercase font-bold tracking-wider">Avg Rating</p>
                                            <p className="text-3xl font-bold mt-1">{stats.ratings.average || "N/A"}</p>
                                        </CardBody>
                                    </Card>
                                    <Card className="bg-orange-500/10 border-orange-500/20">
                                        <CardBody className="p-4 flex flex-col items-center">
                                            <p className="text-xs text-orange-400 uppercase font-bold tracking-wider">Ratings Given</p>
                                            <p className="text-3xl font-bold mt-1">{stats.ratings.count}</p>
                                        </CardBody>
                                    </Card>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Activity Chart */}
                                    <Card className="bg-white/50 dark:bg-black/20 backdrop-blur-xl border border-white/20">
                                        <CardBody className="p-6">
                                            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                                                Upload Activity (Last 6 Months)
                                            </h3>
                                            <div className="h-64">
                                                <Line data={activityData} options={chartOptions} />
                                            </div>
                                        </CardBody>
                                    </Card>

                                    {/* Distribution Chart */}
                                    <Card className="bg-white/50 dark:bg-black/20 backdrop-blur-xl border border-white/20">
                                        <CardBody className="p-6">
                                            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                                                Content Distribution
                                            </h3>
                                            <div className="h-64 flex justify-center">
                                                <Doughnut
                                                    data={distributionData}
                                                    options={{
                                                        ...chartOptions,
                                                        scales: { x: { display: false }, y: { display: false } },
                                                        plugins: { legend: { display: true, position: 'bottom', labels: { color: 'white' } } }
                                                    }}

                                                />
                                            </div>
                                        </CardBody>
                                    </Card>
                                </div>
                            </div>
                        ) : (
                            <p className="text-center text-default-400 py-20">Failed to load statistics.</p>
                        )}
                    </div>
                </Tab>
            </Tabs>
        </div>
    )
}
