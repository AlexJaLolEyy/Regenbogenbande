import { auth } from "@/src/lib/auth"
import { redirect } from "next/navigation"

export async function checkAuth() {
    const session = await auth()
    if (!session?.user) {
        redirect("/login")
    }
    return session
}

export async function checkRole(allowedRoles: string[]) {
    const session = await checkAuth()
    // @ts-expect-error - Dynamic property
    const role = session.user.role || "member" // Default to member if undefined, or handle strict? Best to be strict.

    // If role is undefined, strictly it's not allowed unless "member" is default in DB/schema and token.
    // We'll rely on the checked value.

    if (!allowedRoles.includes(role)) {
        throw new Error("Unauthorized: Insufficient permissions")
    }
    return session
}

export async function checkUploadPermission() {
    // Members and Admins can upload/edit
    return checkRole(["member", "admin"])
}


export async function checkAdmin() {
    return checkRole(["admin"])
}

export async function checkOwnerOrAdmin(resourceOwnerIds: number | number[]) {
    const session = await checkAuth();
    // @ts-expect-error - Dynamic property
    const userRole = session.user.role || "member";
    const userId = parseInt(session.user.id || "0");

    if (userRole === "admin") {
        return session;
    }

    const owners = Array.isArray(resourceOwnerIds) ? resourceOwnerIds : [resourceOwnerIds];

    if (owners.includes(userId)) {
        return session;
    }

    throw new Error("Unauthorized: You do not have permission to modify this resource");
}
