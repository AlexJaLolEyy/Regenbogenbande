"use client";

import { Pagination } from "@heroui/react";

/** Footer pagination for the media lists. Renders nothing when there is only one page. */
export function ListPagination({
    page,
    total,
    pageSize,
    onChange,
}: {
    page: number;
    total: number;
    pageSize: number;
    onChange: (page: number) => void;
}) {
    const totalPages = Math.ceil(total / pageSize);
    if (totalPages <= 1) return null;
    return (
        <Pagination
            total={totalPages}
            page={page}
            onChange={onChange}
            showControls
            loop
            variant="flat"
            classNames={{ cursor: "bg-primary text-primary-foreground font-semibold" }}
        />
    );
}
