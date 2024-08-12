"use client"

import Link from "next/link";
import { useParams, usePathname } from "next/navigation"
import "./navigation.css"

// maybe add currentPath as variable
export default function Navigation({ }: {}
) {

    const pathname = usePathname();
    const params = useParams();
    const currentPath = pathname.split("/").length >= 3 ? pathname.split("/")[2] : ""
    return (
        <div>

            {/* TODO: replace with navbar component */}
            <div className="navbar">
                <Link href="/home">Home</Link>
                <Link href="/videos/list">Videos</Link>
                <Link href="/pictures">Pictures</Link>
                <Link href="/quotes">Quote</Link>
            </div>

            {/* div for printing the current path (temporary) */}
            <div>
                <label>Pathname</label>
                <p>{pathname}</p>

                <label>Params</label>
                <p>{params.toString()}</p>

                <label>currentPath</label>
                <p>{currentPath}</p>
            </div>

        </div>
    )
}