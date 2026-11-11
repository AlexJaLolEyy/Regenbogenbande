"use client"

import { useSession } from "@/src/lib/auth-client"
import type { EffectiveRole } from "@/src/lib/auth-utils-shared"
import { RolePill } from "@/src/lib/components/navigation/role-pill"
import { MODAL_CLASSNAMES } from "@/src/lib/components/ui/form-kit"
import { UserAvatar } from "@/src/lib/components/ui/user-avatar"
import { cn } from "@/src/lib/utils"
import { formatDate } from "@/src/lib/utils/format"
import {
    addToast,
    Button,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownTrigger,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Select,
    SelectItem,
    SortDescriptor,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
    Tabs,
    Tooltip,
    useDisclosure,
} from "@heroui/react"
import { AnimatePresence, motion } from "framer-motion"
import { Lock, Mail, MoreVertical, Search, ShieldCheck, Trash2, User, UserPlus, Users } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { createInvite, deleteInvite, deleteUser, getInvites, getUsers, updateUserRole } from "./actions"

type AdminUser = {
    id: string
    name: string
    email: string | null
    role: string | null
    image: string | null
    discordId: string | null
    status: string
    createdAt: Date
}

type Invite = {
    id: string
    discordId: string
    discordName: string | null
    role: string
    usedAt: Date | null
    createdAt: Date
}

const roles = [
    { label: "Owner", value: "owner" },
    { label: "Admin", value: "admin" },
    { label: "Member", value: "member" },
]

const ROLE_FILTERS = [{ label: "All", value: "all" }, ...roles]

const tableHead = "bg-transparent py-4 text-[11px] font-medium text-muted-foreground"

const asRole = (role: string | null): EffectiveRole =>
    role === "owner" || role === "admin" ? role : "member"

/** Status as a colored dot + label: Active = success, Invited = warning, Disabled = faint. */
function StatusDot({ status }: { status: string }) {
    const tone =
        status === "ACTIVE" ? "bg-success" : status === "INVITED" ? "bg-warning" : "bg-faint"
    const label = status.charAt(0) + status.slice(1).toLowerCase()
    return (
        <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <span className={cn("h-2 w-2 rounded-full", tone)} />
            {label}
        </span>
    )
}

function Identity({ user }: { user: AdminUser }) {
    return (
        <div className="flex min-w-0 items-center gap-3">
            <UserAvatar src={user.image || undefined} name={user.name?.[0]} className="h-9 w-9 shrink-0" />
            <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium text-foreground">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email || "No email linked"}</span>
            </div>
        </div>
    )
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<AdminUser[]>([])
    const [anonymousCount, setAnonymousCount] = useState(0)
    const [invites, setInvites] = useState<Invite[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<"users" | "invites">("users")
    const [roleFilter, setRoleFilter] = useState("all")

    // Search with debounce
    const [filterValue, setFilterValue] = useState("")
    const [debouncedFilterValue, setDebouncedFilterValue] = useState("")

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedFilterValue(filterValue), 500)
        return () => clearTimeout(timer)
    }, [filterValue])

    const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
        column: "createdAt",
        direction: "descending",
    })
    const { isOpen, onOpen, onOpenChange } = useDisclosure()

    // Create invite form state
    const [newDiscordId, setNewDiscordId] = useState("")
    const [newDiscordName, setNewDiscordName] = useState("")
    const [newRole, setNewRole] = useState("member")
    const [createResult, setCreateResult] = useState<{ success: boolean; error?: string } | null>(null)
    const [isCreating, setIsCreating] = useState(false)

    // Delete user state
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onOpenChange: onDeleteOpenChange } = useDisclosure()
    const [userToDelete, setUserToDelete] = useState<string | null>(null)

    // Delete invite state
    const { isOpen: isDeleteInviteOpen, onOpen: onDeleteInviteOpen, onOpenChange: onDeleteInviteOpenChange } = useDisclosure()
    const [inviteToDelete, setInviteToDelete] = useState<string | null>(null)

    const showError = (title: string) => addToast({ title, color: "danger" })

    const { data: session } = useSession()

    const loadData = async () => {
        setIsLoading(true)
        try {
            const [usersResult, invitesData] = await Promise.all([getUsers(), getInvites()])
            const { realUsers, anonymousCount } = usersResult as { realUsers: AdminUser[]; anonymousCount: number }
            setUsers(realUsers)
            setAnonymousCount(anonymousCount)
            setInvites(invitesData as Invite[])
        } catch (error) {
            console.error("Failed to load data", error)
            showError("Could not load users")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const roleCounts = useMemo(() => {
        const counts: Record<string, number> = { all: users.length, owner: 0, admin: 0, member: 0 }
        for (const u of users) counts[asRole(u.role)]++
        return counts
    }, [users])

    const sortedUsers = useMemo(() => {
        let filtered = [...users]
        if (roleFilter !== "all") filtered = filtered.filter((u) => asRole(u.role) === roleFilter)
        if (debouncedFilterValue) {
            const q = debouncedFilterValue.toLowerCase()
            filtered = filtered.filter(
                (user) =>
                    user.name.toLowerCase().includes(q) ||
                    user.email?.toLowerCase().includes(q) ||
                    user.discordId?.includes(debouncedFilterValue)
            )
        }

        return filtered.sort((a, b) => {
            const first = a[sortDescriptor.column as keyof AdminUser] ?? ""
            const second = b[sortDescriptor.column as keyof AdminUser] ?? ""
            const cmp = first < second ? -1 : first > second ? 1 : 0
            return sortDescriptor.direction === "descending" ? -cmp : cmp
        })
    }, [users, roleFilter, debouncedFilterValue, sortDescriptor])

    const handleCreateInvite = async () => {
        setIsCreating(true)
        setCreateResult(null)
        const res = await createInvite(newDiscordId, newDiscordName, newRole)
        if (res.success) {
            setCreateResult({ success: true })
            setNewDiscordId("")
            setNewDiscordName("")
            setNewRole("member")
            loadData()
        } else {
            setCreateResult(res)
        }
        setIsCreating(false)
    }

    const handleDeleteInvite = (inviteId: string) => {
        setInviteToDelete(inviteId)
        onDeleteInviteOpen()
    }

    const confirmDeleteInvite = async () => {
        if (!inviteToDelete) return
        setIsLoading(true)
        try {
            const res = await deleteInvite(inviteToDelete)
            if (res.success) {
                loadData()
                onDeleteInviteOpenChange()
            } else {
                showError(res.error || "Failed to delete invite")
            }
        } catch (error) {
            console.error("Failed to delete invite", error)
            showError("Failed to delete invite")
        } finally {
            setIsLoading(false)
            setInviteToDelete(null)
        }
    }

    const handleRoleChange = async (userId: string, nextRole: string) => {
        if (!nextRole) return
        if (session?.user?.id === userId && nextRole !== "admin") {
            showError("You cannot remove your own admin status. Ask another admin to do it.")
            return
        }
        await updateUserRole(userId, nextRole)
        loadData()
    }

    const handleDeleteUser = async (userId: string) => {
        if (session?.user?.id === userId) {
            showError("You cannot delete your own account.")
            return
        }
        setUserToDelete(userId)
        onDeleteOpen()
    }

    const confirmDeleteUser = async () => {
        if (!userToDelete) return

        setIsLoading(true)
        try {
            const res = await deleteUser(userToDelete)
            if (res.success) {
                loadData()
                onDeleteOpenChange()
            } else {
                showError(res.error || "Failed to delete user")
            }
        } catch (error) {
            console.error("Failed to delete user", error)
            showError("Failed to delete user")
        } finally {
            setIsLoading(false)
            setUserToDelete(null)
        }
    }

    const renderActions = (user: AdminUser) => {
        if (user.role === "owner") {
            return (
                <Tooltip content="The owner cannot be changed" closeDelay={0}>
                    <span className="flex h-8 w-8 items-center justify-center text-faint"><Lock size={16} /></span>
                </Tooltip>
            )
        }
        if (session?.user?.id === user.id) {
            return <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">You</span>
        }
        return (
            <>
                <Dropdown placement="bottom-end">
                    <DropdownTrigger>
                        <Button isIconOnly size="sm" variant="light" aria-label="Change role" className="rounded-xl text-muted-foreground hover:text-foreground">
                            <MoreVertical size={16} />
                        </Button>
                    </DropdownTrigger>
                    <DropdownMenu aria-label="Role actions" variant="flat">
                        <DropdownItem key="promote" className={user.role === "admin" ? "hidden" : ""} onPress={() => handleRoleChange(user.id, "admin")} startContent={<ShieldCheck size={14} />}>
                            Promote to admin
                        </DropdownItem>
                        <DropdownItem key="demote" className={user.role === "member" ? "hidden" : ""} onPress={() => handleRoleChange(user.id, "member")} startContent={<User size={14} />}>
                            Demote to member
                        </DropdownItem>
                    </DropdownMenu>
                </Dropdown>
                <Tooltip color="danger" content="Remove access" closeDelay={0}>
                    <Button isIconOnly size="sm" variant="light" color="danger" aria-label="Remove access" className="rounded-xl hover:bg-danger/10" onPress={() => handleDeleteUser(user.id)}>
                        <Trash2 size={18} />
                    </Button>
                </Tooltip>
            </>
        )
    }

    return (
        <div className="w-full">
            <div className="relative z-10 px-4 pt-6 md:px-8">
                <motion.div
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end"
                >
                    <div>
                        <h1 className="mb-1 flex items-center gap-3 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                            <Users size={22} className="text-muted-foreground" />
                            Users
                        </h1>
                        <p className="text-sm text-muted-foreground">Manage who has access and what they can do.</p>
                    </div>
                    <Button
                        onPress={() => { setCreateResult(null); setNewRole("member"); onOpen(); }}
                        className="h-11 rounded-xl bg-primary px-6 font-medium text-primary-foreground hover:opacity-90"
                        startContent={<UserPlus size={18} />}
                    >
                        New invite
                    </Button>
                </motion.div>

                <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <Tabs
                        aria-label="User management"
                        variant="underlined"
                        selectedKey={activeTab}
                        onSelectionChange={(key) => setActiveTab(key as "users" | "invites")}
                        classNames={{
                            tabList: "gap-4 border-b border-divider p-0",
                            cursor: "w-full bg-theme-accent",
                            tab: "h-11 px-1",
                            tabContent: "text-muted-foreground group-data-[selected=true]:text-foreground group-data-[selected=true]:font-medium",
                        }}
                    >
                        <Tab key="users" title={`Active · ${users.length}`} />
                        <Tab key="invites" title={`Invites · ${invites.length}`} />
                    </Tabs>
                    <span className="text-xs text-muted-foreground">Guest sessions so far: <span className="font-medium text-foreground">{anonymousCount}</span></span>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === "users" ? (
                        <motion.div key="users" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <Input
                                    isClearable
                                    className="w-full sm:max-w-sm"
                                    placeholder="Search by name, email or ID..."
                                    aria-label="Search users"
                                    startContent={<Search size={16} className="text-muted-foreground" />}
                                    value={filterValue}
                                    onClear={() => setFilterValue("")}
                                    onValueChange={setFilterValue}
                                    variant="bordered"
                                    classNames={{ inputWrapper: "bg-muted border-border hover:border-foreground/30 focus-within:border-theme-accent! rounded-xl" }}
                                />
                                <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by role">
                                    {ROLE_FILTERS.map((r) => (
                                        <button
                                            key={r.value}
                                            type="button"
                                            aria-pressed={roleFilter === r.value}
                                            onClick={() => setRoleFilter(r.value)}
                                            className={cn(
                                                "rounded-full border px-3 py-1 text-xs transition-colors focus-visible:outline-2 outline-theme-accent",
                                                roleFilter === r.value
                                                    ? "border-transparent bg-accent-soft font-medium text-theme-accent"
                                                    : "border-border text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            {r.label} · {roleCounts[r.value] ?? 0}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Mobile: stacked cards */}
                            <div className="space-y-3 md:hidden">
                                {sortedUsers.map((user) => (
                                    <div key={user.id} className="space-y-3 rounded-2xl border border-border bg-card/70 p-4">
                                        <div className="flex items-start justify-between gap-2">
                                            <Identity user={user} />
                                            <div className="flex shrink-0 items-center">{renderActions(user)}</div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <RolePill role={asRole(user.role)} />
                                            <StatusDot status={user.status} />
                                            <span className="text-xs text-faint">Joined {formatDate(user.createdAt)}</span>
                                        </div>
                                    </div>
                                ))}
                                {!isLoading && sortedUsers.length === 0 && (
                                    <p className="py-12 text-center text-sm text-muted-foreground">No users match your filters.</p>
                                )}
                            </div>

                            {/* Desktop: table */}
                            <div className="hidden overflow-x-auto rounded-2xl border border-border bg-card/70 shadow-sm backdrop-blur-md md:block">
                                <Table aria-label="Users" removeWrapper className="bg-transparent" sortDescriptor={sortDescriptor} onSortChange={setSortDescriptor}>
                                    <TableHeader>
                                        <TableColumn key="name" allowsSorting className={cn(tableHead, "pl-6")}>User</TableColumn>
                                        <TableColumn key="discordId" className={tableHead}>Discord ID</TableColumn>
                                        <TableColumn key="role" allowsSorting className={tableHead}>Role</TableColumn>
                                        <TableColumn key="status" allowsSorting className={tableHead}>Status</TableColumn>
                                        <TableColumn key="createdAt" allowsSorting className={tableHead}>Joined</TableColumn>
                                        <TableColumn align="end" className={cn(tableHead, "pr-6")}>Actions</TableColumn>
                                    </TableHeader>
                                    <TableBody
                                        isLoading={isLoading}
                                        items={sortedUsers}
                                        emptyContent={<div className="py-16 text-sm text-muted-foreground">No users match your filters.</div>}
                                    >
                                        {(user) => (
                                            <TableRow key={user.id} className="border-b border-border transition-colors last:border-0 hover:bg-muted/50">
                                                <TableCell className="pl-6"><Identity user={user} /></TableCell>
                                                <TableCell>
                                                    <code className="rounded-lg border border-border bg-muted px-2 py-1 font-mono text-[11px] text-muted-foreground">{user.discordId || "N/A"}</code>
                                                </TableCell>
                                                <TableCell><RolePill role={asRole(user.role)} /></TableCell>
                                                <TableCell><StatusDot status={user.status} /></TableCell>
                                                <TableCell><span className="text-sm text-muted-foreground">{formatDate(user.createdAt)}</span></TableCell>
                                                <TableCell className="pr-6"><div className="flex items-center justify-end gap-1">{renderActions(user)}</div></TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="invites" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                            <div className="overflow-x-auto rounded-2xl border border-border bg-card/70 shadow-sm backdrop-blur-md">
                                <Table aria-label="Invites" removeWrapper className="bg-transparent">
                                    <TableHeader>
                                        <TableColumn className={cn(tableHead, "pl-6")}>Person</TableColumn>
                                        <TableColumn className={tableHead}>Role</TableColumn>
                                        <TableColumn className={tableHead}>Status</TableColumn>
                                        <TableColumn className={tableHead}>Created</TableColumn>
                                        <TableColumn align="end" className={cn(tableHead, "pr-6")}>Actions</TableColumn>
                                    </TableHeader>
                                    <TableBody isLoading={isLoading} items={invites} emptyContent={<div className="py-16 text-sm text-muted-foreground">No pending invites.</div>}>
                                        {(invite) => (
                                            <TableRow key={invite.id} className="border-b border-border transition-colors last:border-0 hover:bg-muted/50">
                                                <TableCell className="pl-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground">
                                                            <Mail size={16} />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium text-foreground">{invite.discordName || "Unnamed"}</span>
                                                            <code className="font-mono text-[11px] text-muted-foreground">{invite.discordId}</code>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell><RolePill role={asRole(invite.role)} /></TableCell>
                                                <TableCell><StatusDot status="INVITED" /></TableCell>
                                                <TableCell><span className="text-sm text-muted-foreground">{formatDate(invite.createdAt)}</span></TableCell>
                                                <TableCell className="pr-6">
                                                    <div className="flex items-center justify-end">
                                                        <Button isIconOnly size="sm" variant="light" color="danger" aria-label="Delete invite" className="rounded-xl hover:bg-danger/10" onPress={() => handleDeleteInvite(invite.id)}>
                                                            <Trash2 size={18} />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Create invite */}
            <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur" classNames={MODAL_CLASSNAMES}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader>Create invite</ModalHeader>
                            <ModalBody className="gap-4 py-6">
                                {createResult?.success ? (
                                    <div className="rounded-2xl border border-border bg-muted p-8 text-center">
                                        <UserPlus size={28} className="mx-auto mb-3 text-theme-accent" />
                                        <p className="mb-1 text-lg font-semibold text-foreground">Invite created</p>
                                        <p className="text-sm text-muted-foreground">This person can now sign in with Discord.</p>
                                    </div>
                                ) : (
                                    <>
                                        {createResult?.error && (
                                            <div role="alert" className="rounded-xl border border-danger/20 bg-danger/10 p-3 text-center text-xs font-medium text-danger">
                                                {createResult.error}
                                            </div>
                                        )}
                                        <Input
                                            autoFocus
                                            label="Discord user ID"
                                            placeholder="e.g. 123456789012345678"
                                            variant="bordered"
                                            value={newDiscordId}
                                            onValueChange={setNewDiscordId}
                                            classNames={{ inputWrapper: "bg-muted border-border h-12 focus-within:border-theme-accent!", input: "font-mono" }}
                                            description="Enable Developer Mode in Discord, right-click the user, then Copy ID."
                                        />
                                        <Input
                                            label="Name (optional)"
                                            placeholder="e.g. John"
                                            variant="bordered"
                                            value={newDiscordName}
                                            onValueChange={setNewDiscordName}
                                            classNames={{ inputWrapper: "bg-muted border-border h-12 focus-within:border-theme-accent!" }}
                                        />
                                        <Select
                                            label="Role"
                                            variant="bordered"
                                            selectedKeys={new Set([newRole])}
                                            onSelectionChange={(keys) => {
                                                const selected = Array.from(keys)[0] as string
                                                if (selected) setNewRole(selected)
                                            }}
                                            classNames={{ trigger: "bg-muted border-border h-12" }}
                                        >
                                            {roles.filter((r) => r.value !== "owner").map((role) => (
                                                <SelectItem key={role.value} textValue={role.label}>{role.label}</SelectItem>
                                            ))}
                                        </Select>
                                    </>
                                )}
                            </ModalBody>
                            <ModalFooter>
                                {createResult?.success ? (
                                    <Button fullWidth className="h-11 rounded-xl bg-primary font-medium text-primary-foreground" onPress={() => { setCreateResult(null); onClose(); }}>
                                        Done
                                    </Button>
                                ) : (
                                    <>
                                        <Button variant="light" className="h-11 rounded-xl" onPress={onClose}>Cancel</Button>
                                        <Button className="h-11 rounded-xl bg-primary px-6 font-medium text-primary-foreground" onPress={handleCreateInvite} isLoading={isCreating}>
                                            Create invite
                                        </Button>
                                    </>
                                )}
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Remove user */}
            <Modal isOpen={isDeleteOpen} onOpenChange={onDeleteOpenChange} backdrop="blur" classNames={MODAL_CLASSNAMES}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader>Remove user?</ModalHeader>
                            <ModalBody className="py-6">
                                <p className="text-sm text-muted-foreground">This user will lose access immediately. This cannot be undone.</p>
                            </ModalBody>
                            <ModalFooter>
                                <Button variant="light" className="h-11 rounded-xl" onPress={onClose}>Cancel</Button>
                                <Button color="danger" className="h-11 rounded-xl font-medium" onPress={confirmDeleteUser} isLoading={isLoading}>Remove</Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Delete invite */}
            <Modal isOpen={isDeleteInviteOpen} onOpenChange={onDeleteInviteOpenChange} backdrop="blur" classNames={MODAL_CLASSNAMES}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader>Delete invite?</ModalHeader>
                            <ModalBody className="py-6">
                                <p className="text-sm text-muted-foreground">This person will no longer be able to sign in with this invite.</p>
                            </ModalBody>
                            <ModalFooter>
                                <Button variant="light" className="h-11 rounded-xl" onPress={onClose}>Cancel</Button>
                                <Button color="danger" className="h-11 rounded-xl font-medium" onPress={confirmDeleteInvite} isLoading={isLoading}>Delete</Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    )
}
