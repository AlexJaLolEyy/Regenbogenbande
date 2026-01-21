import React from "react"

export default function DetailViewLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div>{children}</div>
    )
}