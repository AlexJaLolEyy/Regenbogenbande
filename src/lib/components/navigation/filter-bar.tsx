"use client";

import { useSession } from "@/src/lib/auth-client";
import { canUpload, getEffectiveRole, isGuest } from "@/src/lib/auth-utils-shared";
import { HeaderAction } from "./header-action";
import { DateRange, DEFAULT_FILTERS, FilterState, SortOption } from "@/src/lib/types/filters";
import { Button, Drawer, DrawerBody, DrawerContent, DrawerFooter, DrawerHeader, Select, SelectItem, useDisclosure } from "@heroui/react";
import { Calendar, Eye, Filter, Image as ImageIcon, ListFilter, Plus, Quote, RotateCcw, Search, SlidersHorizontal, Users, Video, type LucideIcon } from "lucide-react";
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
 * search, sort, category, person, timeframe, unseen toggle, reset and the upload action.
 * On small screens the filters move into a bottom drawer.
 */
export const FilterBar = ({
    contentType,
    filters,
    onFiltersChange,
    categories,
    people = [],
}: {
    contentType: "video" | "picture" | "quote";
    filters: FilterState;
    onFiltersChange: (filters: FilterState) => void;
    categories: { id: string; name: string; iconUrl?: string | null }[];
    /** Users that are tagged in at least one item of this type */
    people?: { id: string; name: string }[];
}) => {
    const [localSearch, setLocalSearch] = useState(filters.search);
    const [prevSearch, setPrevSearch] = useState(filters.search);
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

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

    const { data: session, isPending } = useSession();
    const mayUpload = canUpload(getEffectiveRole(session));
    const showUnseen = !isPending && !isGuest(session);
    const upload = UPLOAD_ACTIONS[contentType];
    const UploadIcon = upload.icon;
    const showCategory = contentType !== "quote"; // quotes have no category

    const activeCount =
        (filters.sort !== DEFAULT_FILTERS.sort ? 1 : 0) +
        (filters.categoryId ? 1 : 0) +
        (filters.dateRange !== DEFAULT_FILTERS.dateRange ? 1 : 0) +
        (filters.participantId ? 1 : 0) +
        (filters.unseenOnly ? 1 : 0);

    const isDirty = activeCount > 0 || filters.search !== DEFAULT_FILTERS.search;
    const reset = () =>
        onFiltersChange({ ...DEFAULT_FILTERS });

    const controls = (className: { sort: string; category: string; person: string; date: string }) => (
        <>
            <Select
                aria-label="Sort by"
                selectedKeys={new Set([filters.sort])}
                onSelectionChange={(keys) => {
                    const sort = Array.from(keys)[0] as SortOption | undefined;
                    if (sort) onFiltersChange({ ...filters, sort });
                }}
                classNames={selectClassNames}
                className={className.sort}
                startContent={<ListFilter size={14} className="text-faint" />}
                disallowEmptySelection
            >
                {SORT_OPTIONS.map((s) => (
                    <SelectItem key={s} textValue={label(s)}>{label(s)}</SelectItem>
                ))}
            </Select>

            {showCategory && (
                <Select
                    aria-label="Category"
                    placeholder="All categories"
                    selectedKeys={filters.categoryId ? new Set([filters.categoryId]) : new Set()}
                    onSelectionChange={(keys) => {
                        const id = Array.from(keys)[0] as string | undefined;
                        onFiltersChange({ ...filters, categoryId: id === "all" ? null : id || null });
                    }}
                    classNames={selectClassNames}
                    className={className.category}
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
            )}

            {people.length > 0 && (
                <Select
                    aria-label="Person"
                    placeholder="Everyone"
                    selectedKeys={filters.participantId ? new Set([filters.participantId]) : new Set()}
                    onSelectionChange={(keys) => {
                        const id = Array.from(keys)[0] as string | undefined;
                        onFiltersChange({ ...filters, participantId: id === "all" ? null : id || null });
                    }}
                    classNames={selectClassNames}
                    className={className.person}
                    startContent={<Users size={14} className="text-faint" />}
                >
                    {[
                        <SelectItem key="all" textValue="Everyone">Everyone</SelectItem>,
                        ...people.map((person) => (
                            <SelectItem key={person.id} textValue={person.name}>{person.name}</SelectItem>
                        )),
                    ]}
                </Select>
            )}

            <Select
                aria-label="Timeframe"
                placeholder="Timeframe"
                selectedKeys={new Set([filters.dateRange])}
                onSelectionChange={(keys) => {
                    const dateRange = Array.from(keys)[0] as DateRange | undefined;
                    if (dateRange) onFiltersChange({ ...filters, dateRange });
                }}
                classNames={selectClassNames}
                className={className.date}
                startContent={<Calendar size={14} className="text-faint" />}
                disallowEmptySelection
            >
                {DATE_OPTIONS.map((d) => (
                    <SelectItem key={d} textValue={label(d)}>{label(d)}</SelectItem>
                ))}
            </Select>

            {showUnseen && (
                <button
                    type="button"
                    aria-pressed={filters.unseenOnly}
                    onClick={() => onFiltersChange({ ...filters, unseenOnly: !filters.unseenOnly })}
                    className={`flex h-10 items-center gap-2 rounded-xl border px-3 text-sm transition-colors ${
                        filters.unseenOnly
                            ? "border-transparent bg-primary text-primary-foreground"
                            : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                >
                    <Eye size={14} />
                    Unseen only
                </button>
            )}
        </>
    );

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

            {/* Desktop: inline filters */}
            <div className="contents max-sm:hidden">
                {controls({ sort: "w-40", category: "w-48", person: "w-44", date: "w-44" })}
                {isDirty && (
                    <button
                        type="button"
                        onClick={reset}
                        className="flex h-10 items-center gap-2 rounded-xl border border-border px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 outline-theme-accent"
                    >
                        <RotateCcw size={14} />
                        Reset
                        {activeCount > 0 && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-soft px-1 text-[11px] font-semibold text-theme-accent">
                                {activeCount}
                            </span>
                        )}
                    </button>
                )}
            </div>

            {/* Mobile: filters live in a drawer */}
            <button
                type="button"
                onClick={onOpen}
                className="relative flex h-10 items-center justify-center gap-2 rounded-xl border border-border px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:hidden"
            >
                <SlidersHorizontal size={14} />
                Filters
                {activeCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-soft px-1 text-[11px] font-semibold text-theme-accent">
                        {activeCount}
                    </span>
                )}
            </button>

            {/* Primary action lives in the app header; guests never see it. */}
            {!isPending && mayUpload && (
                <HeaderAction>
                    <Link
                        href={upload.href}
                        className="flex h-9 items-center justify-center gap-2 rounded-xl bg-primary px-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 outline-theme-accent"
                    >
                        <Plus size={16} />
                        <UploadIcon size={16} className="max-sm:hidden" />
                        <span className="max-sm:sr-only">{upload.label}</span>
                    </Link>
                </HeaderAction>
            )}

            <Drawer isOpen={isOpen} onOpenChange={onOpenChange} placement="bottom" size="lg">
                <DrawerContent>
                    {(onClose) => (
                        <>
                            <DrawerHeader>Filters</DrawerHeader>
                            <DrawerBody className="gap-3">
                                {controls({ sort: "w-full", category: "w-full", person: "w-full", date: "w-full" })}
                            </DrawerBody>
                            <DrawerFooter>
                                <Button variant="light" onPress={reset} isDisabled={!isDirty} startContent={<RotateCcw size={14} />}>
                                    Reset
                                </Button>
                                <Button color="primary" onPress={onClose}>
                                    Show results
                                </Button>
                            </DrawerFooter>
                        </>
                    )}
                </DrawerContent>
            </Drawer>
        </div>
    );
};
