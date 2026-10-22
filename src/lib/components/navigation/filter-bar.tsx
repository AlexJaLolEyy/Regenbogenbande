"use client";

import { DateRange, FilterState, SortOption } from "@/src/lib/types/filters";
import { Select, SelectItem } from "@heroui/react";
import { Calendar, Filter, Image as ImageIcon, ListFilter, Plus, Quote, RotateCcw, Search, Video, type LucideIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const UPLOAD_ACTIONS: Record<"video" | "picture" | "quote", { href: string; label: string; icon: LucideIcon }> = {
    video: { href: "/videos/upload", label: "Upload clip", icon: Video },
    picture: { href: "/pictures/upload", label: "Upload picture", icon: ImageIcon },
    quote: { href: "/quotes/upload", label: "Add quote", icon: Quote },
};

const SORT_OPTIONS: SortOption[] = ["newest", "oldest", "popular", "random"];
const DATE_OPTIONS: DateRange[] = ["all", "this-week", "last-30-days", "this-year", "2024", "2023", "2022", "2021", "2020", "2019", "2018"];

const label = (option: string) =>
    option.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

const selectClassNames = {
    trigger: "bg-muted border border-border hover:border-foreground/20 h-10 min-h-10 rounded-xl shadow-none data-[focus=true]:border-theme-accent",
    value: "text-foreground text-sm",
};

/**
 * Horizontal filter block shown above every media list:
 * search, sort, category, timeframe, reset and the upload action.
 */
export const FilterBar = ({
    contentType,
    filters,
    onFiltersChange,
    categories,
}: {
    contentType: "video" | "picture" | "quote";
    filters: FilterState;
    onFiltersChange: (filters: FilterState) => void;
    categories: { id: string; name: string; iconUrl?: string | null }[];
}) => {
    const [localSearch, setLocalSearch] = useState(filters.search);
    const [prevSearch, setPrevSearch] = useState(filters.search);

    // Keep the input in sync when filters change from outside (e.g. reset)
    if (filters.search !== prevSearch) {
        setLocalSearch(filters.search);
        setPrevSearch(filters.search);
    }

    // Debounce search updates
    useEffect(() => {
        if (localSearch === filters.search) return;
        const timer = setTimeout(() => onFiltersChange({ ...filters, search: localSearch }), 750);
        return () => clearTimeout(timer);
    }, [localSearch, onFiltersChange, filters]);

    const upload = UPLOAD_ACTIONS[contentType];
    const UploadIcon = upload.icon;

    return (
        <div className="flex shrink-0 flex-wrap items-center gap-3 rounded-2xl border border-border bg-card/70 p-3 shadow-sm backdrop-blur-md">
            <div className="relative min-w-48 flex-1 basis-56">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
                <input
                    type="text"
                    placeholder="Search..."
                    aria-label="Search"
                    className="h-10 w-full rounded-xl border border-border bg-muted pl-10 pr-4 text-sm text-foreground transition-colors placeholder:text-faint focus:border-theme-accent focus:outline-none"
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                />
            </div>

            <Select
                aria-label="Sort by"
                selectedKeys={new Set([filters.sort])}
                onSelectionChange={(keys) => {
                    const sort = Array.from(keys)[0] as SortOption | undefined;
                    if (sort) onFiltersChange({ ...filters, sort });
                }}
                classNames={selectClassNames}
                className="w-full sm:w-40"
                startContent={<ListFilter size={14} className="text-faint" />}
                disallowEmptySelection
            >
                {SORT_OPTIONS.map((s) => (
                    <SelectItem key={s} textValue={label(s)}>{label(s)}</SelectItem>
                ))}
            </Select>

            <Select
                aria-label="Category"
                placeholder="All categories"
                selectedKeys={filters.categoryId ? new Set([filters.categoryId]) : new Set()}
                onSelectionChange={(keys) => {
                    const id = Array.from(keys)[0] as string | undefined;
                    onFiltersChange({ ...filters, categoryId: id === "all" ? null : id || null });
                }}
                classNames={selectClassNames}
                className="w-full sm:w-48"
                startContent={<Filter size={14} className="text-faint" />}
            >
                {[
                    <SelectItem key="all" textValue="All categories">All categories</SelectItem>,
                    ...categories.map((category) => (
                        <SelectItem key={category.id} textValue={category.name}>
                            <div className="flex items-center gap-2">
                                {category.iconUrl && (
                                    <div className="relative h-4 w-4 opacity-70">
                                        <Image src={category.iconUrl} alt={category.name} fill className="object-contain" />
                                    </div>
                                )}
                                {category.name}
                            </div>
                        </SelectItem>
                    )),
                ]}
            </Select>

            <Select
                aria-label="Timeframe"
                placeholder="Timeframe"
                selectedKeys={new Set([filters.dateRange])}
                onSelectionChange={(keys) => {
                    const dateRange = Array.from(keys)[0] as DateRange | undefined;
                    if (dateRange) onFiltersChange({ ...filters, dateRange });
                }}
                classNames={selectClassNames}
                className="w-full sm:w-44"
                startContent={<Calendar size={14} className="text-faint" />}
                disallowEmptySelection
            >
                {DATE_OPTIONS.map((d) => (
                    <SelectItem key={d} textValue={label(d)}>{label(d)}</SelectItem>
                ))}
            </Select>

            <button
                type="button"
                onClick={() => onFiltersChange({ ...filters, search: "", sort: "newest", categoryId: null, dateRange: "all" })}
                className="flex h-10 items-center gap-2 rounded-xl border border-border px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
                <RotateCcw size={14} />
                Reset
            </button>

            <Link
                href={upload.href}
                className="flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 max-sm:w-full"
            >
                <Plus size={16} />
                <UploadIcon size={16} />
                {upload.label}
            </Link>
        </div>
    );
};
