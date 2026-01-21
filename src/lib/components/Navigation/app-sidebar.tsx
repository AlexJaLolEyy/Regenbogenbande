"use client";
import { DateRange, FilterState, SortOption } from '@/src/lib/types/filters';
import { cn } from "@/src/lib/utils";
import { faCalendar, faClock, faFilter, faImage, faPlus, faQuoteRight, faSearch, faSortAmountDown, faVideo } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Select, SelectItem } from "@heroui/react";
import Link from 'next/link';
import { useEffect, useState } from 'react';

export const AppSidebar = ({
    className,
    contentType,
    filters,
    onFiltersChange,
    categories,
}: {
    className?: string;
    contentType: 'video' | 'picture' | 'quote';
    filters: FilterState;
    onFiltersChange: (filters: FilterState) => void;
    categories: { id: string; name: string }[];
}) => {
    const [localSearch, setLocalSearch] = useState(filters.search);
    const [prevSearch, setPrevSearch] = useState(filters.search);

    // Synchronize local search if filters.search changes from outside (e.g. reset)
    if (filters.search !== prevSearch) {
        setLocalSearch(filters.search);
        setPrevSearch(filters.search);
    }

    // Debounce search updates using useEffect
    useEffect(() => {
        if (localSearch === filters.search) return;

        const timer = setTimeout(() => {
            onFiltersChange({ ...filters, search: localSearch });
        }, 750);

        return () => clearTimeout(timer);
    }, [localSearch, onFiltersChange, filters]);

    return (
        <aside className={cn(
            "hidden xl:flex flex-col w-80 shrink-0 sticky top-28 h-[calc(100vh-8rem)]",
            "rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden",
            className
        )}>
            {/* Header / Search */}
            <div className="p-6 border-b border-white/5 space-y-4">
                <h2 className="text-xl font-bold text-white tracking-tight">Library</h2>
                <div className="relative group">
                    <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-purple-400 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all placeholder:text-white/20"
                        value={localSearch}
                        onChange={(e) => {
                            setLocalSearch(e.target.value);
                        }}
                    />
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

                {/* Section: Create */}
                <div>
                    <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <FontAwesomeIcon icon={faPlus} className="text-white/20" /> Create
                    </h3>
                    <div className="grid gap-2 grid-cols-1">

                        {contentType === 'video' && (
                            <Link href="/videos/upload" className="flex items-center gap-1.5 p-3 rounded-xl bg-linear-to-br from-red-500/20 to-red-600/10 border border-red-500/20 hover:border-red-500/50 hover:from-red-500/30 transition-all group flex-row justify-center">
                                <FontAwesomeIcon icon={faVideo} className="text-red-400 group-hover:text-red-300 text-lg" />
                                <span className="font-bold text-red-200 uppercase tracking-wider text-xs">Clip</span>
                            </Link>
                        )}

                        {contentType === 'quote' && (
                            <Link href="/quotes/upload" className="flex items-center gap-1.5 p-3 rounded-xl bg-linear-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 hover:border-amber-500/50 hover:from-amber-500/30 transition-all group flex-row justify-center">
                                <FontAwesomeIcon icon={faQuoteRight} className="text-amber-400 group-hover:text-amber-300 text-lg" />
                                <span className="font-bold text-amber-200 uppercase tracking-wider text-xs">Quote</span>
                            </Link>
                        )}

                        {contentType === 'picture' && (
                            <Link href="/pictures/upload" className="flex items-center gap-1.5 p-3 rounded-xl bg-linear-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 hover:border-blue-500/50 hover:from-blue-500/30 transition-all group flex-row justify-center">
                                <FontAwesomeIcon icon={faImage} className="text-blue-400 group-hover:text-blue-300 text-lg" />
                                <span className="font-bold text-blue-200 uppercase tracking-wider text-xs">Pic</span>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Section: Sort */}
                <div>
                    <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <FontAwesomeIcon icon={faSortAmountDown} className="text-white/20" /> Sort
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                        {(['newest', 'oldest', 'popular', 'random'] as SortOption[]).map((sortOption) => (
                            <button
                                key={sortOption}
                                onClick={() => onFiltersChange({ ...filters, sort: sortOption })}
                                className={cn(
                                    "p-2.5 rounded-lg text-white text-xs font-semibold hover:bg-orange-500/30 transition-all text-left flex items-center justify-between group",
                                    filters.sort === sortOption
                                        ? "bg-orange-500/20 border border-orange-500/50"
                                        : "bg-white/5 border border-white/5 text-neutral-400 hover:text-white"
                                )}
                            >
                                {sortOption.charAt(0).toUpperCase() + sortOption.slice(1)}
                                <FontAwesomeIcon
                                    icon={sortOption === 'newest' ? faClock : faSortAmountDown} // Use faClock for newest, faSortAmountDown for others
                                    className={cn(
                                        "opacity-50 group-hover:opacity-100",
                                        filters.sort === sortOption ? "text-orange-300" : "text-neutral-400"
                                    )}
                                />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Section: Categories */}
                <div>
                    <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <FontAwesomeIcon icon={faFilter} className="text-white/20" /> Categories
                    </h3>
                    <Select
                        placeholder="Select Category"
                        selectedKeys={filters.categoryId ? new Set([filters.categoryId]) : new Set()}
                        onSelectionChange={(keys) => {
                            const newCategoryId = Array.from(keys)[0] as string | undefined;
                            onFiltersChange({ ...filters, categoryId: newCategoryId === 'all' ? null : newCategoryId || null });
                        }}
                        className="w-full"
                        classNames={{
                            trigger: "bg-white/5 border border-white/10 hover:border-purple-500/50",
                            value: "text-white",
                            popoverContent: "bg-black/80 border border-white/10 backdrop-blur-md",
                        }}
                    >
                        {[
                            <SelectItem key="all" textValue="All Categories" className="text-white">
                                All Categories
                            </SelectItem>,
                            ...categories.map((category) => (
                                <SelectItem key={category.id} textValue={category.name} className="text-white">
                                    {category.name}
                                </SelectItem>
                            ))
                        ]}
                    </Select>
                </div>

                {/* Section: Date */}
                <div>
                    <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <FontAwesomeIcon icon={faCalendar} className="text-white/20" /> Date
                    </h3>
                    <Select
                        placeholder="Select Date Range"
                        selectedKeys={new Set([filters.dateRange])}
                        onSelectionChange={(keys) => {
                            const newDateRange = Array.from(keys)[0] as DateRange;
                            onFiltersChange({ ...filters, dateRange: newDateRange });
                        }}
                        className="w-full"
                        classNames={{
                            trigger: "bg-white/5 border border-white/10 hover:border-purple-500/50",
                            value: "text-white",
                            popoverContent: "bg-black/80 border border-white/10 backdrop-blur-md",
                        }}
                    >
                        {(['all', 'this-week', 'last-30-days', 'this-year', '2024', '2023', '2022', '2021', '2020', '2019', '2018'] as DateRange[]).map((dateOption) => (
                            <SelectItem key={dateOption} textValue={dateOption.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} className="text-white">
                                {dateOption.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            </SelectItem>
                        ))}
                    </Select>
                </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/5 bg-black/20">
                <button
                    onClick={() => onFiltersChange({ ...filters, search: '', sort: 'newest', categoryId: null, dateRange: 'all' })}
                    className="w-full py-2 rounded-xl border border-white/10 hover:bg-white/5 text-xs text-white/50 hover:text-white transition-colors">
                    Reset Filters
                </button>
            </div>
        </aside>
    );
};
