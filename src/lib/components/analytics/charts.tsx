"use client";

import { useChartColors } from "@/src/lib/hooks/use-chart-colors";
import { cn } from "@/src/lib/utils";
import {
    ArcElement,
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Filler,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Tooltip,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";

// Registered once here, not at page scope.
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);

interface SeriesPoint {
    date: string;
    [key: string]: number | string;
}

const formatDate = (iso: string) => {
    const d = new Date(`${iso}T00:00:00Z`);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
};

function useBaseOptions() {
    const colors = useChartColors();
    return {
        colors,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: colors.grid },
                    ticks: { color: colors.tick, font: { size: 10 }, precision: 0 },
                },
                x: {
                    grid: { display: false },
                    ticks: { color: colors.tick, font: { size: 10 }, maxTicksLimit: 8 },
                },
            },
        },
    };
}

export function UploadsChart({ data }: { data: SeriesPoint[] }) {
    const { colors, options } = useBaseOptions();
    const palette = { video: colors.accent, picture: colors.success, quote: colors.warning };
    return (
        <Bar
            data={{
                labels: data.map((d) => formatDate(d.date)),
                datasets: (["video", "picture", "quote"] as const).map((k) => ({
                    label: k[0].toUpperCase() + k.slice(1) + "s",
                    data: data.map((d) => Number(d[k] ?? 0)),
                    backgroundColor: palette[k],
                    borderRadius: 4,
                    stack: "uploads",
                })),
            }}
            options={{
                ...options,
                plugins: { legend: { display: true, position: "bottom", labels: { color: colors.tick, usePointStyle: true, font: { size: 11 } } } },
                scales: { ...options.scales, x: { ...options.scales.x, stacked: true }, y: { ...options.scales.y, stacked: true } },
            }}
        />
    );
}

export function ViewsChart({ data }: { data: SeriesPoint[] }) {
    const { colors, options } = useBaseOptions();
    return (
        <Line
            data={{
                labels: data.map((d) => formatDate(d.date)),
                datasets: [
                    {
                        label: "Views",
                        data: data.map((d) => Number(d.views ?? 0)),
                        borderColor: colors.accent,
                        backgroundColor: `color-mix(in srgb, ${colors.accent} 15%, transparent)`,
                        fill: true,
                        tension: 0.35,
                        pointRadius: 2,
                    },
                ],
            }}
            options={options}
        />
    );
}

export function RatingBars({ received, given }: { received: number[]; given: number[] }) {
    const { colors, options } = useBaseOptions();
    return (
        <Bar
            data={{
                labels: ["1★", "2★", "3★", "4★", "5★"],
                datasets: [
                    { label: "Received", data: received, backgroundColor: colors.accent, borderRadius: 4 },
                    { label: "Given", data: given, backgroundColor: colors.success, borderRadius: 4 },
                ],
            }}
            options={{
                ...options,
                plugins: { legend: { display: true, position: "bottom", labels: { color: colors.tick, usePointStyle: true, font: { size: 11 } } } },
            }}
        />
    );
}

export function TypeDoughnut({ video, picture, quote }: { video: number; picture: number; quote: number }) {
    const colors = useChartColors();
    return (
        <Doughnut
            data={{
                labels: ["Videos", "Pictures", "Quotes"],
                datasets: [
                    {
                        data: [video, picture, quote],
                        backgroundColor: [colors.accent, colors.success, colors.warning],
                        borderColor: colors.grid,
                        borderWidth: 2,
                    },
                ],
            }}
            options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: "bottom", labels: { color: colors.tick, usePointStyle: true, font: { size: 11 }, padding: 16 } } },
            }}
        />
    );
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Weekday x hour heatmap (plain CSS, no chart.js needed). */
export function Heatmap({ data }: { data: number[][] }) {
    const max = Math.max(1, ...data.flat());
    return (
        <div className="overflow-x-auto">
            <div className="min-w-[520px]">
                <div className="mb-1 ml-9 grid gap-0.5 text-[9px] text-faint" style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}>
                    {Array.from({ length: 24 }, (_, h) => (
                        <span key={h} className="text-center">{h % 6 === 0 ? h : ""}</span>
                    ))}
                </div>
                {data.map((row, dow) => (
                    <div key={dow} className="mb-0.5 flex items-center gap-1">
                        <span className="w-8 text-[10px] text-faint">{DAYS[dow]}</span>
                        <div className="grid flex-1 gap-0.5" style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}>
                            {row.map((count, hour) => (
                                <div
                                    key={hour}
                                    title={`${DAYS[dow]} ${hour}:00 – ${count} action${count === 1 ? "" : "s"}`}
                                    className={cn("aspect-square rounded-[3px] bg-muted")}
                                    style={count > 0 ? { background: `color-mix(in srgb, var(--theme-accent) ${Math.round(15 + (count / max) * 85)}%, transparent)` } : undefined}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
