import React from "react"

export default function DetailViewLayout({
    params,
    children,
}: {
    params: {
        // empty for now (maybe pass an id later)
    }
    children: React.ReactNode
}) {
    return (
        <div>{children}</div>
    )
}