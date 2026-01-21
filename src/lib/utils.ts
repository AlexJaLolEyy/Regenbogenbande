import { type ClassValue } from "clsx"

export function cn(...inputs: (ClassValue | undefined | null | false)[]) {
    return inputs.flat().filter(Boolean).join(" ")
}
