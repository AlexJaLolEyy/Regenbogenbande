"use client";

import { Avatar } from "@heroui/react";
import type { ComponentProps } from "react";

/**
 * HeroUI Avatar that works with third-party profile images (Google, Discord, ...).
 * Those hosts often reject requests that carry a referrer, so we drop it.
 */
export function UserAvatar(props: ComponentProps<typeof Avatar>) {
    return (
        <Avatar
            {...props}
            imgProps={{ referrerPolicy: "no-referrer", ...(props.imgProps ?? {}) }}
        />
    );
}
