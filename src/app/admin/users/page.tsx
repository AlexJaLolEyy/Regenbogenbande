"use client"

import { useSession } from "@/src/lib/auth-client"
import {
    Button,
    Chip,
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
import { Trash2, UserPlus } from "lucide-react"
import { useEffect, useState } from "react"
import { createInvite, deleteInvite, deleteUser, getInvites, getUsers, updateUserRole } from "./actions"

type User = {
    id: string
    name: string
    email: string | null
    role: string | null
    image: string | null
    discordId: string | null
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
    { label: "Admin", value: "admin" },
    { label: "Member", value: "member" },
    { label: "Guest", value: "guest" },
]

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [invites, setInvites] = useState<Invite[]>([])
    const [isLoading, setIsLoading] = useState(true)
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

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setIsLoading(true)
        try {
            const [usersData, invitesData] = await Promise.all([getUsers(), getInvites()])
            setUsers(usersData as User[])
            setInvites(invitesData as Invite[])
        } catch (error) {
            console.error("Failed to load data", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleCreateInvite = async () => {
        setIsCreating(true)
        setCreateResult(null)
        const res = await createInvite(newDiscordId, newDiscordName, newRole)
        if (res.success) {
            setCreateResult({ success: true })
            setNewDiscordId("")
            setNewDiscordName("")
            loadData()
        } else {
            setCreateResult(res)
        }
        setIsCreating(false)
    }

    const handleDeleteInvite = async (inviteId: string) => {
        await deleteInvite(inviteId)
        loadData()
    }

    // Alert State
    const { isOpen: isAlertOpen, onOpen: onAlertOpen, onOpenChange: onAlertOpenChange } = useDisclosure()
    const [alertMessage, setAlertMessage] = useState("")

    const showAlert = (message: string) => {
        setAlertMessage(message)
        onAlertOpen()
    }

    const { data: session } = useSession()

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
            await deleteUser(userToDelete)
            loadData()
            onDeleteOpenChange()
        } catch (error) {
            console.error("Failed to delete user", error)
        } finally {
            setIsLoading(false)
            setUserToDelete(null)
        }
    }

    return (
        <div className="container mx-auto p-6 pt-24 max-w-5xl">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">User Management</h1>
                    <p className="text-gray-500">Manage access and invites for the Regenbogenbande</p>
                </div>
                <Button
                    onPress={() => { setCreateResult(null); onOpen(); }}
                    color="primary"
                    startContent={<UserPlus size={18} />}
                    className="font-semibold shadow-lg shadow-primary/20"
                >
                    Create Invite
                </Button>
            </div>

            <Tabs aria-label="User Management Tabs" color="primary" variant="underlined" className="mb-6">
                <Tab key="users" title="Users">
                    <div className="bg-white/50 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl p-4 shadow-xl">
                        <Table aria-label="Users table" removeWrapper className="bg-transparent">
                            <TableHeader>
                                <TableColumn>USER</TableColumn>
                                <TableColumn>DISCORD ID</TableColumn>
                                <TableColumn>ROLE</TableColumn>
                                <TableColumn>JOINED</TableColumn>
                                <TableColumn align="end">ACTIONS</TableColumn>
                            </TableHeader>
                            <TableBody isLoading={isLoading} items={users} emptyContent="No users found">
                                {(user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <UserCell
                                                name={user.name}
                                                description={user.email}
                                                avatarProps={{
                                                    src: user.image || undefined,
                                                    name: user.name[0],
                                                    size: "sm",
                                                    isBordered: true,
                                                    className: "bg-gradient-to-tr from-purple-500 to-pink-500"
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                                {user.discordId || "N/A"}
                                            </code>
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                size="sm"
                                                variant="bordered"
                                                selectedKeys={[user.role || "guest"]}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                className="max-w-[120px]"
                                                aria-label="Change Role"
                                                classNames={{
                                                    trigger: "border-small"
                                                }}
                                            >
                                                {roles.map((role) => (
                                                    <SelectItem key={role.value}>
                                                        {role.label}
                                                    </SelectItem>
                                                ))}
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-xs text-gray-500">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="relative flex items-center justify-end gap-2">
                                                <Tooltip color="danger" content="Delete User">
                                                    <span className="text-lg text-danger cursor-pointer active:opacity-50" onClick={() => handleDeleteUser(user.id)}>
                                                        <Trash2 size={18} />
                                                    </span>
                                                </Tooltip>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Tab>
                <Tab key="invites" title="Pending Invites">
                    <div className="bg-white/50 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl p-4 shadow-xl">
                        <Table aria-label="Invites table" removeWrapper className="bg-transparent">
                            <TableHeader>
                                <TableColumn>DISCORD NAME</TableColumn>
                                <TableColumn>DISCORD ID</TableColumn>
                                <TableColumn>ROLE</TableColumn>
                                <TableColumn>STATUS</TableColumn>
                                <TableColumn>CREATED</TableColumn>
                                <TableColumn align="end">ACTIONS</TableColumn>
                            </TableHeader>
                            <TableBody isLoading={isLoading} items={invites} emptyContent="No pending invites">
                                {(invite) => (
                                    <TableRow key={invite.id}>
                                        <TableCell>
                                            <span className="font-medium">{invite.discordName || "Unknown"}</span>
                                        </TableCell>
                                        <TableCell>
                                            <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                                {invite.discordId}
                                            </code>
                                        </TableCell>
                                        <TableCell>
                                            <Chip size="sm" variant="flat" color={invite.role === "admin" ? "secondary" : "primary"}>
                                                {invite.role}
                                            </Chip>
                                        </TableCell>
                                        <TableCell>
                                            {invite.usedAt ? (
                                                <Chip size="sm" color="success" variant="flat">Used</Chip>
                                            ) : (
                                                <Chip size="sm" color="warning" variant="flat">Pending</Chip>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-xs text-gray-500">
                                                {new Date(invite.createdAt).toLocaleDateString()}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="relative flex items-center justify-end gap-2">
                                                <Tooltip color="danger" content="Delete Invite">
                                                    <span 
                                                        className="text-lg text-danger cursor-pointer active:opacity-50" 
                                                        onClick={() => handleDeleteInvite(invite.id)}
                                                    >
                                                        <Trash2 size={18} />
                                                    </span>
                                                </Tooltip>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Tab>
            </Tabs>

            {/* Create Invite Modal */}
            <Modal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                backdrop="blur"
                classNames={{
                    base: "bg-white/90 dark:bg-black/90 backdrop-blur-2xl border border-white/20",
                }}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">Create Invite</ModalHeader>
                            <ModalBody>
                                {createResult?.success ? (
                                    <div className="bg-success-50 dark:bg-success-900/20 p-4 rounded-xl border border-success-200 dark:border-success-800">
                                        <p className="text-success-600 font-semibold mb-2">Invite created successfully!</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            The user can now sign in with their Discord account.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        {createResult?.error && (
                                            <div className="text-danger text-sm mb-2">{createResult.error}</div>
                                        )}
                                        <Input
                                            autoFocus
                                            label="Discord User ID"
                                            placeholder="e.g., 123456789012345678"
                                            variant="bordered"
                                            value={newDiscordId}
                                            onValueChange={setNewDiscordId}
                                            description="Right-click on user in Discord → Copy User ID (Developer Mode required)"
                                        />
                                        <Input
                                            label="Discord Name (optional)"
                                            placeholder="e.g., John#1234"
                                            variant="bordered"
                                            value={newDiscordName}
                                            onValueChange={setNewDiscordName}
                                            description="For your reference only"
                                        />
                                        <Select
                                            label="Role"
                                            defaultSelectedKeys={["member"]}
                                            variant="bordered"
                                            onChange={(e) => setNewRole(e.target.value)}
                                        >
                                            {roles.filter(r => r.value !== "guest").map((role) => (
                                                <SelectItem key={role.value}>
                                                    {role.label}
                                                </SelectItem>
                                            ))}
                                        </Select>
                                    </>
                                )}
                            </ModalBody>
                            <ModalFooter>
                                {createResult?.success ? (
                                    <Button color="primary" onPress={() => { setCreateResult(null); onClose(); }}>
                                        Done
                                    </Button>
                                ) : (
                                    <>
                                        <Button color="danger" variant="light" onPress={onClose}>
                                            Cancel
                                        </Button>
                                        <Button color="primary" onPress={handleCreateInvite} isLoading={isCreating}>
                                            Create Invite
                                        </Button>
                                    </>
                                )}
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteOpen}
                onOpenChange={onDeleteOpenChange}
                backdrop="blur"
                classNames={{
                    base: "bg-white/90 dark:bg-black/90 backdrop-blur-2xl border border-white/20",
                }}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">Confirm Deletion</ModalHeader>
                            <ModalBody>
                                <p>Are you sure you want to delete this user? This action cannot be undone.</p>
                            </ModalBody>
                            <ModalFooter>
                                <Button color="default" variant="light" onPress={onClose}>
                                    Cancel
                                </Button>
                                <Button
                                    color="danger"
                                    onPress={confirmDeleteUser}
                                    isLoading={isLoading}
                                >
                                    Delete
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Generic Alert Modal */}
            <Modal
                isOpen={isAlertOpen}
                onOpenChange={onAlertOpenChange}
                backdrop="blur"
                classNames={{
                    base: "bg-white/90 dark:bg-black/90 backdrop-blur-2xl border border-white/20",
                }}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1 text-warning">Attention</ModalHeader>
                            <ModalBody>
                                <p>{alertMessage}</p>
                            </ModalBody>
                            <ModalFooter>
                                <Button color="primary" onPress={onClose}>
                                    Understood
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    )
}
