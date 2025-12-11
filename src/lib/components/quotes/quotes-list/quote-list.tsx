'use client'

import { BreadcrumbItem, Breadcrumbs, Button } from "@heroui/react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Quote } from "../../../types/types";
import QuoteComponent from "../quote/quote";

export default function QuoteList({ quotes }: { quotes: Quote[] }) {
    const { data: session } = useSession();
    // @ts-expect-error Role is added by adapter
    const canUpload = session?.user?.role === "admin" || session?.user?.role === "member";

    return (
        <div className="max-w-[1600px] mx-auto px-6 py-8">
            <Breadcrumbs className="mb-6">
                <BreadcrumbItem href="/">Home</BreadcrumbItem>
                <BreadcrumbItem href="/quotes">Quotes</BreadcrumbItem>
            </Breadcrumbs>

            <div className="flex justify-between items-center my-6">
                <h1 className="text-3xl font-semibold">Quotes</h1>
                {canUpload && (
                    <Button
                        as={Link}
                        href="/quotes/upload"
                        color="primary"
                        variant="flat"
                    >
                        Upload Quote
                    </Button>
                )}
            </div>

            {quotes && quotes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {quotes.map((quote) => (
                        <QuoteComponent key={quote.id} quote={quote} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <p className="text-default-500 text-lg">No quotes available yet.</p>
                    {canUpload && (
                        <Button
                            as={Link}
                            href="/quotes/upload"
                            color="primary"
                            variant="flat"
                            className="mt-4"
                        >
                            Upload First Quote
                        </Button>
                    )}
                </div>
            )}
        </div>
    )
}
