"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import {
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
    User as UserCell, Tooltip, Button,
    Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure,
    Input, Select, SelectItem, Snippet
} from "@heroui/react"
import { Plus, Trash2 } from "lucide-react"
import { getUsers, createUser, updateUserRole, deleteUser } from "./actions"

type User = {
    id: string
    username: string
    email: string | null
    role: string | null
    profilePicture: string | null
    createdAt: Date
}

const roles = [
    { label: "Admin", value: "admin" },
    { label: "Member", value: "member" },
    { label: "Viewer", value: "viewer" },
]

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const { isOpen, onOpen, onOpenChange } = useDisclosure()

    // Create User Form State
    const [newUsername, setNewUsername] = useState("")
    const [newRole, setNewRole] = useState("member")
    const [createResult, setCreateResult] = useState<{ success: boolean, tempPassword?: string, error?: string } | null>(null)
    const [isCreating, setIsCreating] = useState(false)

    // Delete User State
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onOpenChange: onDeleteOpenChange } = useDisclosure()
    const [userToDelete, setUserToDelete] = useState<string | null>(null)

    useEffect(() => {
        loadUsers()
    }, [])

    const loadUsers = async () => {
        setIsLoading(true)
        try {
            const data = await getUsers()
            // @ts-expect-error - Prisma enum mapping
            setUsers(data)
        } catch (error) {
            console.error("Failed to load users", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleCreateUser = async () => {
        setIsCreating(true)
        setCreateResult(null)
        const res = await createUser(newUsername, newRole)
        if (res.success) {
            setCreateResult(res)
            setNewUsername("") // Keep modal open to show password
            loadUsers()
        } else {
            setCreateResult(res)
        }
        setIsCreating(false)
    }

    const { data: session } = useSession()

    const handleRoleChange = async (userId: string, newRole: string) => {
        if (!newRole) return; // Handle empty selection
        if (session?.user?.id === userId && newRole !== "admin") {
            alert("You cannot remove your own admin status! Ask another admin to do it if necessary.")
            return
        }
        await updateUserRole(userId, newRole)
        loadUsers()
    }

    const handleDeleteUser = async (userId: string) => {
        if (session?.user?.id === userId) {
            alert("You cannot delete your own account.")
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
            loadUsers()
            onDeleteOpenChange() // Close modal
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
                    <p className="text-gray-500">Manage access and roles for the Regenbogenbande</p>
                </div>
                <Button
                    onPress={() => { setCreateResult(null); onOpen(); }}
                    color="primary"
                    startContent={<Plus size={18} />}
                    className="font-semibold shadow-lg shadow-primary/20"
                >
                    Invite User
                </Button>
            </div>

            <div className="bg-white/50 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl p-4 shadow-xl">
                <Table aria-label="Users table" removeWrapper className="bg-transparent">
                    <TableHeader>
                        <TableColumn>USER</TableColumn>
                        <TableColumn>ROLE</TableColumn>
                        <TableColumn>JOINED</TableColumn>
                        <TableColumn align="end">ACTIONS</TableColumn>
                    </TableHeader>
                    <TableBody isLoading={isLoading} items={users} emptyContent="No users found">
                        {(user) => (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <UserCell
                                        name={user.username}
                                        description={user.email}
                                        avatarProps={{
                                            src: user.profilePicture || undefined,
                                            name: user.username[0],
                                            size: "sm",
                                            isBordered: true,
                                            className: "bg-gradient-to-tr from-purple-500 to-pink-500"
                                        }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Select
                                        size="sm"
                                        variant="bordered"
                                        selectedKeys={[user.role || "member"]}
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

            {/* Create User Modal */}
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
                            <ModalHeader className="flex flex-col gap-1">Invite New User</ModalHeader>
                            <ModalBody>
                                {createResult?.success ? (
                                    <div className="bg-success-50 dark:bg-success-900/20 p-4 rounded-xl border border-success-200 dark:border-success-800">
                                        <p className="text-success-600 font-semibold mb-2">User created successfully!</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Share this temporary password with the user:</p>
                                        <Snippet symbol="" className="w-full" color="success">{createResult.tempPassword}</Snippet>
                                        <p className="text-xs text-gray-400 mt-2">They can change it after logging in (not implemented yet, tell them to keep it safe).</p>
                                    </div>
                                ) : (
                                    <>
                                        {createResult?.error && (
                                            <div className="text-danger text-sm mb-2">{createResult.error}</div>
                                        )}
                                        <Input
                                            autoFocus
                                            label="Username"
                                            placeholder="Enter username"
                                            variant="bordered"
                                            value={newUsername}
                                            onValueChange={setNewUsername}
                                        />
                                        <Select
                                            label="Role"
                                            defaultSelectedKeys={["member"]}
                                            variant="bordered"
                                            onChange={(e) => setNewRole(e.target.value)}
                                        >
                                            {roles.map((role) => (
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
                                        <Button color="primary" onPress={handleCreateUser} isLoading={isCreating}>
                                            Create
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
        </div>
    )
}
