"use client";

import dynamic from "next/dynamic";

const ChartSkeleton = () => <div className="h-full w-full animate-pulse rounded-xl bg-muted" />;

// Charts are loaded on demand so chart.js stays out of the initial bundle.
export const UploadsChart = dynamic(() => import("./charts").then((m) => m.UploadsChart), { ssr: false, loading: ChartSkeleton });
export const ViewsChart = dynamic(() => import("./charts").then((m) => m.ViewsChart), { ssr: false, loading: ChartSkeleton });
export const RatingBars = dynamic(() => import("./charts").then((m) => m.RatingBars), { ssr: false, loading: ChartSkeleton });
export const TypeDoughnut = dynamic(() => import("./charts").then((m) => m.TypeDoughnut), { ssr: false, loading: ChartSkeleton });
export const Heatmap = dynamic(() => import("./charts").then((m) => m.Heatmap), { ssr: false, loading: ChartSkeleton });
