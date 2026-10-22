"use client"

import { useSession } from "@/src/lib/auth-client"
import {
    Button,
    Chip,
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
    Select, SelectItem,
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
    User as UserCell
} from "@heroui/react"
import { AnimatePresence, motion } from "framer-motion"
import { Crown, Fingerprint, Lock, Mail, MoreVertical, Search, ShieldCheck, Trash2, User, UserPlus, Users } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { createInvite, deleteInvite, deleteUser, getInvites, getUsers, updateUserRole } from "./actions"

type User = {
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

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [anonymousCount, setAnonymousCount] = useState(0)
    const [invites, setInvites] = useState<Invite[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<"users" | "invites">("users")

    // Search with Debounce
    const [filterValue, setFilterValue] = useState("")
    const [debouncedFilterValue, setDebouncedFilterValue] = useState("")

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedFilterValue(filterValue)
        }, 500)
        return () => clearTimeout(timer)
    }, [filterValue])

    const [sortDescriptor, setSortDescriptor] = useState<{ column: string, direction: 'ascending' | 'descending' }>({
        column: "createdAt",
        direction: "descending",
    })
    const { isOpen, onOpen, onOpenChange } = useDisclosure()

    // Create Invite Form State
    const [newDiscordId, setNewDiscordId] = useState("")
    const [newDiscordName, setNewDiscordName] = useState("")
    const [newRole, setNewRole] = useState("member")
    const [createResult, setCreateResult] = useState<{ success: boolean, error?: string } | null>(null)
    const [isCreating, setIsCreating] = useState(false)

    // Delete User State
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onOpenChange: onDeleteOpenChange } = useDisclosure()
    const [userToDelete, setUserToDelete] = useState<string | null>(null)

    // Delete Invite State
    const { isOpen: isDeleteInviteOpen, onOpen: onDeleteInviteOpen, onOpenChange: onDeleteInviteOpenChange } = useDisclosure()
    const [inviteToDelete, setInviteToDelete] = useState<string | null>(null)

    // Alert State
    const { isOpen: isAlertOpen, onOpen: onAlertOpen, onOpenChange: onAlertOpenChange } = useDisclosure()
    const [alertMessage, setAlertMessage] = useState("")

    const showAlert = (message: string) => {
        setAlertMessage(message)
        onAlertOpen()
    }

    const { data: session } = useSession()

    const loadData = async () => {
        setIsLoading(true)
        try {
            const [usersResult, invitesData] = await Promise.all([getUsers(), getInvites()])
            const { realUsers, anonymousCount } = usersResult as { realUsers: User[], anonymousCount: number }
            setUsers(realUsers)
            setAnonymousCount(anonymousCount)
            setInvites(invitesData as Invite[])
        } catch (error) {
            console.error("Failed to load data", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const sortedUsers = useMemo(() => {
        let filteredUsers = [...users]
        if (debouncedFilterValue) {
            filteredUsers = filteredUsers.filter((user) =>
                user.name.toLowerCase().includes(debouncedFilterValue.toLowerCase()) ||
                user.email?.toLowerCase().includes(debouncedFilterValue.toLowerCase()) ||
                user.discordId?.includes(debouncedFilterValue)
            )
        }

        return filteredUsers.sort((a, b) => {
            const first = a[sortDescriptor.column as keyof User] as any
            const second = b[sortDescriptor.column as keyof User] as any
            const cmp = first < second ? -1 : first > second ? 1 : 0

            return sortDescriptor.direction === "descending" ? -cmp : cmp
        })
    }, [users, debouncedFilterValue, sortDescriptor])

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
                showAlert(res.error || "Failed to delete invite")
            }
        } catch (error) {
            console.error("Failed to delete invite", error)
        } finally {
            setIsLoading(false)
            setInviteToDelete(null)
        }
    }

    const handleRoleChange = async (userId: string, newRole: string) => {
        if (!newRole) return
        if (session?.user?.id === userId && newRole !== "admin") {
            showAlert("You cannot remove your own admin status! Ask another admin to do it if necessary.")
            return
        }
        await updateUserRole(userId, newRole)
        loadData()
    }

    const handleDeleteUser = async (userId: string) => {
        if (session?.user?.id === userId) {
            showAlert("You cannot delete your own account.")
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
                showAlert(res.error || "Failed to delete user")
            }
        } catch (error) {
            console.error("Failed to delete user", error)
        } finally {
            setIsLoading(false)
            setUserToDelete(null)
        }
    }

    return (
        <div className="w-full">
            {/* Custom Prismatic Background */}
            
            <div className="relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12"
                >
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-1.5 bg-muted rounded-xl border border-border">
                                <Users className="text-foreground" size={20} />
                            </div>
                            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                                Team <span className="text-foreground">Access</span>
                            </h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <p className="text-muted-foreground font-medium">Manage permissions and orbital entry invites</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <Button
                            onPress={() => { setCreateResult(null); setNewRole("member"); onOpen(); }}
                            className="bg-primary text-primary-foreground font-medium h-11 px-6 rounded-xl hover:opacity-90"
                            startContent={<UserPlus size={20} />}
                        >
                            New Invite
                        </Button>
                    </div>
                </motion.div>

                <div className="w-full">
                    {/* Header Row: Tabs on Left, Guests on Right */}
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                        <Tabs
                            aria-label="User Management Tabs"
                            color="primary"
                            variant="bordered"
                            selectedKey={activeTab}
                            onSelectionChange={(key) => setActiveTab(key as any)}
                            className="p-1 bg-muted backdrop-blur-md rounded-2xl border border-border w-fit"
                            classNames={{
                                tabList: "gap-2 border-0 bg-transparent p-0",
                                cursor: "bg-primary text-primary-foreground rounded-xl",
                                tab: "h-11 px-8 font-semibold transition-all",
                                tabContent: "text-muted-foreground group-data-[selected=true]:text-primary-foreground"
                            }}
                        >
                            <Tab key="users" title={
                                <div className="flex items-center gap-2">
                                    <span>Active Users</span>
                                    <Chip size="sm" variant="flat" className="bg-muted text-muted-foreground group-data-[selected=true]:bg-primary-foreground/20 group-data-[selected=true]:text-primary-foreground">{users.length}</Chip>
                                </div>
                            } />
                            <Tab key="invites" title={
                                <div className="flex items-center gap-2">
                                    <span>Invites</span>
                                    {invites.length > 0 && <Chip size="sm" color="warning" variant="flat" className="font-bold">{invites.length}</Chip>}
                                </div>
                            } />
                        </Tabs>

                        <div className="flex items-center gap-3 h-12 px-6 bg-muted rounded-2xl border border-border backdrop-blur-md">
                            <Fingerprint size={16} className="text-foreground mr-1" />
                            <span className="text-[11px] font-semibold text-muted-foreground whitespace-nowrap">Guest Appearances</span>
                            <div className="h-4 w-px bg-muted mx-2" />
                            <span className="text-sm font-semibold text-foreground">{anonymousCount}</span>
                        </div>
                    </div>

                    {/* Content Row: Table Area */}
                    <AnimatePresence mode="wait">
                        {activeTab === "users" ? (
                            <motion.div
                                key="users-table"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-4"
                            >
                                <div className="flex justify-between items-center gap-4">
                                    <Input
                                        isClearable
                                        className="w-full sm:max-w-[44%]"
                                        placeholder="Search by name, email or ID..."
                                        startContent={<Search size={18} className="text-muted-foreground" />}
                                        value={filterValue}
                                        onClear={() => setFilterValue("")}
                                        onValueChange={setFilterValue}
                                        variant="bordered"
                                        classNames={{
                                            inputWrapper: "bg-muted border-border hover:border-border focus-within:border-theme-accent! rounded-2xl transition-all"
                                        }}
                                    />
                                </div>

                                <div className="bg-card/70 backdrop-blur-md border border-border rounded-2xl overflow-x-auto shadow-sm">
                                    <Table
                                        aria-label="Users table"
                                        removeWrapper
                                        className="bg-transparent"
                                        sortDescriptor={sortDescriptor as any}
                                        onSortChange={(desc) => setSortDescriptor(desc as any)}
                                    >
                                        <TableHeader>
                                            <TableColumn key="name" allowsSorting className="bg-transparent text-muted-foreground font-semibold text-[10px] py-6 pl-8">USER</TableColumn>
                                            <TableColumn key="discordId" className="bg-transparent text-muted-foreground font-semibold text-[10px] py-6">DISCORD ID</TableColumn>
                                            <TableColumn key="role" allowsSorting className="bg-transparent text-muted-foreground font-semibold text-[10px] py-6">ROLE</TableColumn>
                                            <TableColumn key="status" allowsSorting className="bg-transparent text-muted-foreground font-semibold text-[10px] py-6">STATUS</TableColumn>
                                            <TableColumn key="createdAt" allowsSorting className="bg-transparent text-muted-foreground font-semibold text-[10px] py-6">JOINED</TableColumn>
                                            <TableColumn align="end" className="bg-transparent text-muted-foreground font-semibold text-[10px] py-6 pr-8">ACTIONS</TableColumn>
                                        </TableHeader>
                                        <TableBody
                                            isLoading={isLoading}
                                            items={sortedUsers}
                                            emptyContent={<div className="py-20 text-muted-foreground font-medium">No users found matching your criteria</div>}
                                        >
                                            {(user) => (
                                                <TableRow key={user.id} className="border-b border-border last:border-0 hover:bg-muted transition-colors">
                                                    <TableCell className="pl-8">
                                                        <UserCell
                                                            name={<span className="font-bold text-foreground">{user.name}</span>}
                                                            description={<span className="text-muted-foreground font-medium">{user.email || "No email linked"}</span>}
                                                            avatarProps={{
                                                                imgProps: { referrerPolicy: "no-referrer" },
                                                                src: user.image || `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${user.id}&backgroundColor=b6e3f4,c0aede,d1d4f9`,
                                                                name: user.name[0],
                                                                size: "md",
                                                                isBordered: true,
                                                                className: "ring-border"
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2 group">
                                                            <code className="text-[11px] font-mono text-muted-foreground bg-muted px-2.5 py-1.5 rounded-xl border border-border group-hover:border-border transition-colors cursor-help">
                                                                {user.discordId || "N/A"}
                                                            </code>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            {user.role === 'owner' ? (
                                                                <div className="flex items-center gap-2 text-warning bg-warning/10 px-3 py-1.5 rounded-xl border border-warning/20">
                                                                    <Crown size={14} />
                                                                    <span className="text-xs font-medium">Owner</span>
                                                                </div>
                                                            ) : user.role === 'admin' ? (
                                                                <div className="flex items-center gap-2 text-foreground bg-muted px-3 py-1.5 rounded-xl border border-border">
                                                                    <ShieldCheck size={14} />
                                                                    <span className="text-xs font-medium">Admin</span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-2 text-muted-foreground bg-muted px-3 py-1.5 rounded-xl border border-border">
                                                                    <User size={14} />
                                                                    <span className="text-xs font-medium">Member</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            size="sm"
                                                            variant="dot"
                                                            color={user.status === "ACTIVE" ? "success" : user.status === "INVITED" ? "warning" : "danger"}
                                                            className="border-border font-bold"
                                                        >
                                                            {user.status}
                                                        </Chip>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-sm font-medium text-muted-foreground">
                                                            {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="pr-8">
                                                        <div className="flex items-center justify-end gap-1">
                                                            {user.role === 'owner' ? (
                                                                <div className="w-8 h-8 flex items-center justify-center text-warning/40">
                                                                    <Lock size={16} />
                                                                </div>
                                                            ) : session?.user?.id === user.id ? (
                                                                <Chip size="sm" variant="bordered" className="text-xs font-medium border-border bg-muted">You</Chip>
                                                            ) : (
                                                                <>
                                                                    <Dropdown placement="bottom-end">
                                                                        <DropdownTrigger>
                                                                            <Button isIconOnly size="sm" variant="light" className="text-muted-foreground hover:text-foreground rounded-xl">
                                                                                <MoreVertical size={16} />
                                                                            </Button>
                                                                        </DropdownTrigger>
                                                                        <DropdownMenu aria-label="Role Actions" variant="flat">
                                                                            <DropdownItem
                                                                                key="promote"
                                                                                className={user.role === 'admin' ? "hidden" : ""}
                                                                                onPress={() => handleRoleChange(user.id, "admin")}
                                                                                startContent={<ShieldCheck size={14} />}
                                                                            >
                                                                                Promote to Admin
                                                                            </DropdownItem>
                                                                            <DropdownItem
                                                                                key="demote"
                                                                                className={user.role === 'member' ? "hidden" : ""}
                                                                                onPress={() => handleRoleChange(user.id, "member")}
                                                                                startContent={<User size={14} />}
                                                                            >
                                                                                Demote to Member
                                                                            </DropdownItem>
                                                                        </DropdownMenu>
                                                                    </Dropdown>

                                                                    <Tooltip color="danger" content="Remove Access" closeDelay={0}>
                                                                        <Button
                                                                            isIconOnly
                                                                            size="sm"
                                                                            variant="light"
                                                                            color="danger"
                                                                            className="hover:bg-danger/10 rounded-xl transition-all"
                                                                            onPress={() => handleDeleteUser(user.id)}
                                                                        >
                                                                            <Trash2 size={20} />
                                                                        </Button>
                                                                    </Tooltip>
                                                                </>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="invites-table"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-4"
                            >
                                <div className="bg-card/70 backdrop-blur-md border border-border rounded-2xl overflow-x-auto shadow-sm">
                                    <Table aria-label="Invites table" removeWrapper className="bg-transparent">
                                        <TableHeader>
                                            <TableColumn className="bg-transparent text-muted-foreground font-semibold text-[10px] py-6 pl-8">DISCORD ENTITY</TableColumn>
                                            <TableColumn className="bg-transparent text-muted-foreground font-semibold text-[10px] py-6">ROLE ASSIGNMENT</TableColumn>
                                            <TableColumn className="bg-transparent text-muted-foreground font-semibold text-[10px] py-6">STATUS</TableColumn>
                                            <TableColumn className="bg-transparent text-muted-foreground font-semibold text-[10px] py-6">CREATED</TableColumn>
                                            <TableColumn align="end" className="bg-transparent text-muted-foreground font-semibold text-[10px] py-6 pr-8">ACTIONS</TableColumn>
                                        </TableHeader>
                                        <TableBody isLoading={isLoading} items={invites} emptyContent={<div className="py-20 text-muted-foreground font-medium">No pending invites at the moment</div>}>
                                            {(invite) => (
                                                <TableRow key={invite.id} className="border-b border-border last:border-0 hover:bg-muted transition-colors">
                                                    <TableCell className="pl-8">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground border border-border">
                                                                <Mail size={18} />
                                                            </div>
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="font-bold text-foreground leading-none">{invite.discordName || "Unnamed User"}</span>
                                                                <code className="text-[10px] font-mono text-muted-foreground opacity-50">{invite.discordId}</code>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip size="sm" variant="flat" className="bg-muted text-muted-foreground font-bold text-[10px]">
                                                            {invite.role}
                                                        </Chip>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip size="sm" color="warning" variant="dot" className="font-bold">Pending</Chip>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-sm font-medium text-muted-foreground">
                                                            {new Date(invite.createdAt).toLocaleDateString()}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="pr-8">
                                                        <div className="flex items-center justify-end">
                                                            <Button
                                                                isIconOnly
                                                                size="sm"
                                                                variant="light"
                                                                color="danger"
                                                                className="hover:bg-danger/10 rounded-xl transition-all"
                                                                onPress={() => handleDeleteInvite(invite.id)}
                                                            >
                                                                <Trash2 size={20} />
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
            </div>

            {/* Create Invite Modal */}
            <Modal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                backdrop="blur"
                classNames={{
                    base: "bg-elevated border border-border rounded-2xl shadow-lg",
                    header: "text-2xl font-semibold tracking-tight pt-8 px-8 pb-4 border-b border-border",
                    body: "px-8 py-8 gap-6",
                    footer: "px-8 pb-8 pt-4",
                    closeButton: "top-4 right-4 hover:bg-muted transition-colors p-2 rounded-xl"
                }}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-row gap-2 items-center justify-center whitespace-nowrap">
                                Generate <span className="text-foreground">Invite</span>
                            </ModalHeader>
                            <ModalBody>
                                {createResult?.success ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="bg-muted p-8 rounded-2xl border border-border text-center"
                                    >
                                        <div className="w-16 h-16 bg-muted flex items-center justify-center rounded-2xl mx-auto mb-4">
                                            <UserPlus size={32} className="text-foreground" />
                                        </div>
                                        <p className="text-foreground font-semibold text-xl mb-2">Invite Ready!</p>
                                        <p className="text-sm text-muted-foreground font-medium">
                                            The entity can now perform orbital entry using Discord credentials.
                                        </p>
                                    </motion.div>
                                ) : (
                                    <div className="space-y-6">
                                        {createResult?.error && (
                                            <div className="bg-danger/10 border border-danger/20 p-3 rounded-xl text-danger text-xs font-bold text-center">
                                                {createResult.error}
                                            </div>
                                        )}
                                        <Input
                                            autoFocus
                                            label="Discord User ID"
                                            placeholder="e.g., 123456789012345678"
                                            variant="flat"
                                            value={newDiscordId}
                                            onValueChange={setNewDiscordId}
                                            classNames={{
                                                inputWrapper: "bg-muted h-14 rounded-2xl border border-border hover:border-border transition-all",
                                                label: "text-muted-foreground font-bold",
                                                input: "font-mono"
                                            }}
                                            description="Developer Mode → Right-click User → Copy ID"
                                        />
                                        <Input
                                            label="Alias / Reference (optional)"
                                            placeholder="e.g., John #1234"
                                            variant="flat"
                                            value={newDiscordName}
                                            onValueChange={setNewDiscordName}
                                            classNames={{
                                                inputWrapper: "bg-muted h-14 rounded-2xl border border-border hover:border-border transition-all",
                                                label: "text-muted-foreground font-bold"
                                            }}
                                        />
                                        <div className="space-y-2">
                                            <p className="text-sm font-bold text-muted-foreground ml-1">Assigned Role</p>
                                            <Select
                                                selectedKeys={new Set([newRole])}
                                                variant="flat"
                                                onSelectionChange={(keys) => {
                                                    const selected = Array.from(keys)[0] as string
                                                    if (selected) setNewRole(selected)
                                                }}
                                                classNames={{
                                                    trigger: "bg-muted h-14 rounded-2xl border border-border hover:border-border transition-all"
                                                }}
                                            >
                                                {roles.filter(r => r.value !== "owner").map((role) => (
                                                    <SelectItem key={role.value} textValue={role.label}>
                                                        {role.label}
                                                    </SelectItem>
                                                ))}
                                            </Select>
                                        </div>
                                    </div>
                                )}
                            </ModalBody>
                            <ModalFooter className="flex-col gap-3">
                                {createResult?.success ? (
                                    <Button
                                        fullWidth
                                        className="font-medium h-12 rounded-xl bg-primary text-primary-foreground"
                                        onPress={() => { setCreateResult(null); onClose(); }}
                                    >
                                        DONE
                                    </Button>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3 w-full">
                                        <Button
                                            variant="flat"
                                            className="h-12 rounded-2xl font-bold bg-muted border border-border"
                                            onPress={onClose}
                                        >
                                            CANCEL
                                        </Button>
                                        <Button
                                            className="h-12 rounded-2xl font-semibold bg-primary text-primary-foreground"
                                            onPress={handleCreateInvite}
                                            isLoading={isCreating}
                                        >
                                            EXECUTE
                                        </Button>
                                    </div>
                                )}
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Delete User Modal */}
            <Modal
                isOpen={isDeleteOpen}
                onOpenChange={onDeleteOpenChange}
                backdrop="blur"
                classNames={{
                    base: "bg-elevated border border-border rounded-2xl",
                }}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-row gap-2 items-center whitespace-nowrap pt-8 px-8 pb-4 border-b border-border">
                                Revoke <span className="text-danger">Access</span>
                            </ModalHeader>
                            <ModalBody className="px-8 py-6">
                                <p className="text-muted-foreground">Are you sure you want to prune this user from the orbital core? This action is permanent.</p>
                            </ModalBody>
                            <ModalFooter className="px-8 pb-8">
                                <div className="grid grid-cols-2 gap-3 w-full">
                                    <Button variant="flat" className="h-12 rounded-xl font-bold bg-muted border border-border" onPress={onClose}>CANCEL</Button>
                                    <Button
                                        color="danger"
                                        className="h-12 rounded-xl font-bold"
                                        onPress={confirmDeleteUser}
                                        isLoading={isLoading}
                                    >
                                        CONFIRM
                                    </Button>
                                </div>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Delete Invite Modal */}
            <Modal
                isOpen={isDeleteInviteOpen}
                onOpenChange={onDeleteInviteOpenChange}
                backdrop="blur"
                classNames={{
                    base: "bg-elevated border border-border rounded-2xl",
                }}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-row gap-2 items-center whitespace-nowrap pt-8 px-8 pb-4 border-b border-border">
                                Revoke <span className="text-danger">Invite</span>
                            </ModalHeader>
                            <ModalBody className="px-8 py-6">
                                <p className="text-muted-foreground">Are you sure you want to retract this invitation? The entity will no longer be able to log in.</p>
                            </ModalBody>
                            <ModalFooter className="px-8 pb-8">
                                <div className="grid grid-cols-2 gap-3 w-full">
                                    <Button variant="flat" className="h-12 rounded-xl font-bold bg-muted border border-border" onPress={onClose}>CANCEL</Button>
                                    <Button
                                        color="danger"
                                        className="h-12 rounded-xl font-bold"
                                        onPress={confirmDeleteInvite}
                                        isLoading={isLoading}
                                    >
                                        RETRACT
                                    </Button>
                                </div>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Alert Modal */}
            <Modal
                isOpen={isAlertOpen}
                onOpenChange={onAlertOpenChange}
                backdrop="blur"
                classNames={{
                    base: "bg-elevated border border-border rounded-2xl",
                }}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1 text-warning font-semibold pt-8 px-8">Restriction Enforced</ModalHeader>
                            <ModalBody className="px-8 pb-8">
                                <p className="text-muted-foreground font-medium">{alertMessage}</p>
                            </ModalBody>
                            <ModalFooter className="px-8 pb-8">
                                <Button className="bg-muted rounded-xl font-bold w-full" onPress={onClose}>
                                    ACKNOWLEDGE
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}
