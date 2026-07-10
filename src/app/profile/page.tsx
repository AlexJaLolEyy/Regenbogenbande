"use client"

import { signOut, useSession } from "@/src/lib/auth-client"
import { getEffectiveRole } from "@/src/lib/auth-utils-shared"
import { queryKeys } from "@/src/lib/queries/query-keys"
import { Avatar, Button, Input, Tab, Tabs } from "@heroui/react"
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
import { Activity, Crown, LogOut, Settings, ShieldCheck, User as UserIcon } from "lucide-react"
import { motion } from "motion/react"
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
            setMessage({ type: "success", text: "Display name synchronized with the orbital core." })
            setLocalDisplayName(null); // Reset to use session's updated name
        } else {
            setMessage({ type: "error", text: res.error || "Transmission failure during update." })
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
                    color: 'rgba(255, 255, 255, 0.05)',
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.3)',
                    font: { size: 10, weight: 'bold' }
                }
            },
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.3)',
                    font: { size: 10, weight: 'bold' }
                }
            }
        }
    };

    const activityData = {
        labels: stats?.monthlyActivity.map((a: any) => a.label) || [],
        datasets: [{
            label: 'Uploads',
            data: stats?.monthlyActivity.map((a: any) => a.count) || [],
            borderColor: 'rgb(147, 51, 234)',
            backgroundColor: 'rgba(147, 51, 234, 0.2)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: 'rgb(147, 51, 234)',
            pointBorderColor: '#fff',
            pointHoverRadius: 6,
        }]
    };

    const distributionData = {
        labels: ['Videos', 'Pictures', 'Quotes'],
        datasets: [{
            data: [stats?.counts.videos || 0, stats?.counts.pictures || 0, stats?.counts.quotes || 0],
            backgroundColor: [
                'rgba(147, 51, 234, 0.4)',
                'rgba(59, 130, 246, 0.4)',
                'rgba(236, 72, 153, 0.4)',
            ],
            borderColor: [
                'rgba(147, 51, 234, 1)',
                'rgba(59, 130, 246, 1)',
                'rgba(236, 72, 153, 1)',
            ],
            borderWidth: 2,
            hoverOffset: 10
        }]
    };

    return (
        <div className="min-h-screen w-full relative overflow-x-hidden bg-[#0a0a0b] text-white">
            {/* Custom Prismatic Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/5 blur-[150px] rounded-full" />
                <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-pink-900/5 blur-[100px] rounded-full animate-bounce [animation-duration:10s]" />
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay" />
            </div>

            <div className="container mx-auto p-6 pt-24 max-w-5xl relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-1.5 bg-linear-to-tr from-purple-500/20 to-blue-500/20 rounded-xl border border-white/10">
                            <UserIcon className="text-purple-400" size={20} />
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-white drop-shadow-sm">
                            Identity <span className="text-purple-500">Node</span>
                        </h1>
                    </div>
                    <p className="text-gray-400 font-medium text-sm">Synchronize your presence within the orbital collective</p>
                </motion.div>

                <Tabs
                    aria-label="Profile options"
                    variant="bordered"
                    className="p-1 bg-white/5 backdrop-blur-md rounded-2xl border border-white/5 w-fit mb-8"
                    classNames={{
                        tabList: "gap-2 border-0 bg-transparent p-0",
                        cursor: "bg-purple-600 rounded-xl shadow-lg shadow-purple-900/40",
                        tab: "h-11 px-8 font-black transition-all",
                        tabContent: "group-data-[selected=true]:text-white text-gray-500"
                    }}
                >
                    <Tab
                        key="info"
                        title={
                            <div className="flex items-center space-x-2">
                                <Settings size={16} />
                                <span>Core Settings</span>
                            </div>
                        }
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-4">
                            {/* Profile Card */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="md:col-span-1"
                            >
                                <div className="bg-[#121214]/60 backdrop-blur-2xl border border-white/5 rounded-3xl p-8 flex flex-col items-center gap-6 shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 blur-3xl -mr-16 -mt-16 group-hover:bg-purple-600/10 transition-all" />

                                    <div className="relative">
                                        <Avatar
                                            src={session?.user?.image || undefined}
                                            className="w-32 h-32 text-4xl ring-4 ring-purple-600/20"
                                            name={session?.user?.name?.[0]}
                                            isBordered
                                            color="secondary"
                                        />
                                        <div className="absolute -bottom-2 -right-2 bg-purple-600 p-2 rounded-xl shadow-lg border-2 border-[#121214]">
                                            {role === 'owner' ? <Crown size={16} /> : role === 'admin' ? <ShieldCheck size={16} /> : <UserIcon size={16} />}
                                        </div>
                                    </div>

                                    <div className="text-center">
                                        <h2 className="text-2xl font-black tracking-tight text-white mb-1 uppercase">{session?.user?.name}</h2>
                                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{session?.user?.email || "No direct uplink"}</p>

                                        <div className="mt-6 flex items-center justify-center">
                                            <div className="px-4 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-widest">
                                                Level: {role || "Entity"}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Settings */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="md:col-span-2"
                            >
                                <div className="bg-[#121214]/60 backdrop-blur-2xl border border-white/5 rounded-3xl p-8 shadow-2xl">
                                    <div className="flex flex-col gap-8">
                                        <div>
                                            <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-6">Uplink Configuration</h3>
                                            <div className="flex flex-col gap-6">
                                                <Input
                                                    label="DISPLAY ALIAS"
                                                    placeholder="Enter your collective name"
                                                    value={displayName}
                                                    onValueChange={setLocalDisplayName}
                                                    variant="flat"
                                                    classNames={{
                                                        inputWrapper: "bg-white/5 h-14 rounded-2xl border border-white/5 hover:border-white/10 transition-all",
                                                        label: "text-gray-500 font-bold"
                                                    }}
                                                />
                                                <Input
                                                    label="ACCESS EMAIL"
                                                    value={session?.user?.email || ""}
                                                    isReadOnly
                                                    variant="flat"
                                                    description={<span className="text-[10px] uppercase font-bold text-gray-600">Locked to Discord authorization</span>}
                                                    classNames={{
                                                        inputWrapper: "bg-white/5 h-14 rounded-2xl border border-white/5 opacity-50",
                                                        label: "text-gray-500 font-bold"
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {message && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className={`p-4 rounded-2xl text-xs font-bold text-center border ${message.type === 'success'
                                                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                                        : 'bg-danger/10 text-danger border-danger/20'
                                                    }`}
                                            >
                                                {message.text}
                                            </motion.div>
                                        )}

                                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 border-t border-white/5">
                                            <Button
                                                color="danger"
                                                variant="flat"
                                                className="h-12 w-full sm:w-auto px-8 rounded-2xl font-black bg-danger/10 text-danger hover:bg-danger/20 transition-all"
                                                startContent={<LogOut size={18} />}
                                                onPress={handleLogout}
                                            >
                                                TERMINATE SESSION
                                            </Button>
                                            <Button
                                                className="h-12 w-full sm:w-auto px-10 rounded-2xl font-black bg-purple-600 text-white shadow-lg shadow-purple-900/40 hover:bg-purple-500 transition-all"
                                                onPress={handleUpdateDisplayName}
                                                isLoading={isLoading}
                                            >
                                                SYNC IDENTITY
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </Tab>

                    <Tab
                        key="stats"
                        title={
                            <div className="flex items-center space-x-2">
                                <Activity size={16} />
                                <span>Transmission Data</span>
                            </div>
                        }
                    >
                        <div className="mt-4">
                            {isStatsLoading ? (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
                                    {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-white/5 rounded-3xl" />)}
                                </div>
                            ) : stats ? (
                                <div className="flex flex-col gap-8">
                                    {/* Metric Cards */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            { label: "Total Uploads", value: stats.counts.total, color: "purple" },
                                            { label: "Total Views", value: stats.views, color: "blue" },
                                            { label: "Avg Rating", value: stats.ratings.average || "0.0", color: "pink" },
                                            { label: "Evaluations", value: stats.ratings.count, color: "orange" },
                                        ].map((m, i) => (
                                            <motion.div
                                                key={m.label}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                                className={`bg-[#121214]/60 border border-white/5 p-6 rounded-3xl shadow-xl flex flex-col items-center text-center`}
                                            >
                                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2">{m.label}</p>
                                                <p className="text-3xl font-black text-white tracking-tight">{m.value}</p>
                                            </motion.div>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Activity Chart */}
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="bg-[#121214]/60 backdrop-blur-2xl border border-white/5 rounded-3xl p-8 shadow-2xl"
                                        >
                                            <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-8 flex items-center gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                                                Uplink Activity <span className="text-white/20">(6M)</span>
                                            </h3>
                                            <div className="h-64">
                                                <Line data={activityData} options={chartOptions} />
                                            </div>
                                        </motion.div>

                                        {/* Distribution Chart */}
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="bg-[#121214]/60 backdrop-blur-2xl border border-white/5 rounded-3xl p-8 shadow-2xl"
                                        >
                                            <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-8 flex items-center gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                                Media Distribution
                                            </h3>
                                            <div className="h-64 flex justify-center">
                                                <Doughnut
                                                    data={distributionData}
                                                    options={{
                                                        ...chartOptions,
                                                        scales: { x: { display: false }, y: { display: false } },
                                                        plugins: {
                                                            legend: {
                                                                display: true,
                                                                position: 'bottom',
                                                                labels: {
                                                                    color: 'rgba(255,255,255,0.5)',
                                                                    font: { size: 10, weight: 'bold' },
                                                                    usePointStyle: true,
                                                                    padding: 20
                                                                }
                                                            }
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </motion.div>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-20 text-center bg-[#121214]/60 rounded-3xl border border-white/5 backdrop-blur-xl">
                                    <p className="text-gray-500 font-black uppercase tracking-widest text-sm">Transmission synchronization failed</p>
                                </div>
                            )}
                        </div>
                    </Tab>
                </Tabs>
            </div>
        </div>
    )
}
