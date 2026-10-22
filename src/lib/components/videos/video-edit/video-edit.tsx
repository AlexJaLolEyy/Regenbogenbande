"use client";

import { updateVideoElement } from "@/src/app/(content)/videos/(detail)/[id]/edit/actions";
import { UserAvatar } from "@/src/lib/components/ui/user-avatar";
import { getAllCategories, getAllUsers } from "@/src/lib/actions/data-fetching";
import { useSession } from "@/src/lib/auth-client";
import { getEffectiveRole } from "@/src/lib/auth-utils-shared";
import { AuroraBackground } from "@/src/lib/components/home/aurora-background";
import { queryKeys } from "@/src/lib/queries/query-keys";
import { VideoActionInput } from "@/src/lib/utils/video-utils";
import {
    faArrowUpFromBracket,
    faInfoCircle,
    faPenToSquare
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, Chip, DateInput, Input, Progress, Select, SelectItem, Textarea } from "@heroui/react";
import { fromDate, getLocalTimeZone } from "@internationalized/date";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { Category, User, Video } from "../../../types/types";

export default function VideoEdit({ video }: { video: Video }) {
    const { data: session, isPending: isSessionPending } = useSession();
    const router = useRouter();
    const queryClient = useQueryClient();

    const {
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<VideoActionInput>({
        defaultValues: {
            title: video.title,
            description: video.description || "",
            id: video.id,
            createdAt: video.createdAt,
            uploadedAt: video.uploadedAt,
            uploadedBy: video.uploadedBy,
            participants: video.participants,
            categoryId: video.category.id,
        }
    });

    const [users, setUsers] = useState<User[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [manualDateOverride, setManualDateOverride] = useState(false);
    const [status, setStatus] = useState<{
        stage: 'idle' | 'saving' | 'done' | 'error';
        progress?: number;
        message: string;
    }>({ stage: 'idle', message: '' });

    // Permission checks
    const role = getEffectiveRole(session);
    const isOwner = session?.user?.id === video.uploadedBy.id;
    const canEdit = role === 'owner' || role === 'admin' || isOwner;

    useEffect(() => {
        if (!isSessionPending && !session?.user) {
            router.push('/login');
        }
    }, [session, isSessionPending, router]);

    useEffect(() => {
        getAllUsers().then(setUsers);
        getAllCategories().then(setCategories);
    }, []);

    const onSubmit: SubmitHandler<VideoActionInput> = async (data) => {
        try {
            setStatus({ stage: 'saving', message: 'Saving changes...', progress: 40 });
            await updateVideoElement(data);
            queryClient.invalidateQueries({ queryKey: queryKeys.videos.all });
            setStatus({ stage: 'done', message: 'Changes saved!', progress: 100 });
        } catch (error) {
            if (error && typeof error === 'object' && 'digest' in error && typeof error.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT')) {
                return;
            }
            console.error('Error saving video:', error);
            setStatus({ stage: 'error', message: 'Error saving changes' });
        }
    };

    return (
        <AuroraBackground className="fixed inset-x-0 bottom-0 top-12 md:left-(--sidebar-w) z-0">
            <div className="relative z-10 w-full h-full overflow-y-auto pt-8 pb-32 px-4 md:px-12">

                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full max-w-400 bg-card/70 backdrop-blur-md border border-border rounded-2xl p-2 overflow-hidden shadow-2xl relative mx-auto"
                >

                    <div className="flex flex-col lg:flex-row h-full">
                        {/* Left Column: Visuals */}
                        <div className="lg:w-[60%] bg-muted/50 rounded-2xl m-2 relative group overflow-hidden border border-border flex flex-col min-h-72 lg:h-175">

                            <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-30">
                                <div className="flex gap-2">
                                    <Chip size="sm" variant="shadow" classNames={{ base: "bg-black/60 backdrop-blur-md border border-border", content: "text-white/80 font-mono text-[10px]" }}>{video.videoUrl.split("?")[0].split(".").pop()?.toUpperCase() || "VIDEO"}</Chip>
                                    <Chip size="sm" variant="shadow" classNames={{ base: "bg-black/60 backdrop-blur-md border border-border", content: "text-white/80 text-[10px]" }}>{video.category.name}</Chip>
                                </div>
                                <Chip size="sm" variant="flat" className="bg-muted text-muted-foreground border border-border">Edit mode</Chip>
                            </div>

                            <div className="flex-1 flex items-center justify-center p-8 relative">
                                <div className="w-full h-full flex flex-col items-center justify-center relative">
                                    <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-border flex items-center justify-center">
                                        <video src={video.videoUrl} controls className="max-w-full max-h-full object-contain" />
                                    </div>
                                    <div className="mt-6 text-center">
                                        <h2 className="text-xl font-bold text-foreground mb-1 truncate max-w-md">{video.title}</h2>
                                        <p className="text-muted-foreground text-sm">Editing video metadata</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Form */}
                        <div className="lg:w-[40%] p-8 lg:p-10 flex flex-col lg:h-175">
                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <FontAwesomeIcon icon={faPenToSquare} className="text-2xl text-muted-foreground" />
                                    <h2 className="text-2xl font-bold text-foreground">Video Details</h2>
                                </div>

                                {!isSessionPending && !canEdit && (
                                    <div className="p-4 bg-danger-500/10 border border-danger-500/20 rounded-xl text-danger-500 flex items-center gap-3">
                                        <FontAwesomeIcon icon={faInfoCircle} />
                                        <p className="text-sm">You do not have permission to edit this video.</p>
                                    </div>
                                )}

                                <motion.form
                                    variants={{
                                        hidden: { opacity: 0 },
                                        show: {
                                            opacity: 1,
                                            transition: {
                                                staggerChildren: 0.1
                                            }
                                        }
                                    }}
                                    initial="hidden"
                                    animate="show"
                                    className="space-y-6"
                                >
                                    <motion.div
                                        variants={{
                                            hidden: { opacity: 0, y: 10 },
                                            show: { opacity: 1, y: 0 }
                                        }}
                                    >
                                        <Controller
                                            name="title"
                                            control={control}
                                            rules={{ required: true }}
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    label="Title"
                                                    variant="bordered"
                                                    labelPlacement="outside"
                                                    placeholder="Enter video title"
                                                    isRequired
                                                    isInvalid={!!errors.title}
                                                    errorMessage="Title is required"
                                                    classNames={{
                                                        inputWrapper: "bg-muted border-border h-12 hover:border-border transition-colors",
                                                        input: "text-foreground font-medium",
                                                        label: "text-muted-foreground"
                                                    }}
                                                />
                                            )}
                                        />
                                    </motion.div>

                                    <motion.div
                                        variants={{
                                            hidden: { opacity: 0, y: 10 },
                                            show: { opacity: 1, y: 0 }
                                        }}
                                    >
                                        <Controller
                                            name="description"
                                            control={control}
                                            render={({ field }) => (
                                                <Textarea
                                                    {...field}
                                                    label="Description"
                                                    variant="bordered"
                                                    labelPlacement="outside"
                                                    placeholder="Tell the story..."
                                                    minRows={3}
                                                    classNames={{
                                                        inputWrapper: "bg-muted border-border hover:border-border transition-colors",
                                                        input: "text-foreground",
                                                        label: "text-muted-foreground"
                                                    }}
                                                />
                                            )}
                                        />
                                    </motion.div>

                                    <motion.div
                                        variants={{
                                            hidden: { opacity: 0, y: 10 },
                                            show: { opacity: 1, y: 0 }
                                        }}
                                        className="grid grid-cols-2 gap-4"
                                    >
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-muted-foreground">Uploaded By</label>
                                            <div className="flex items-center gap-3 p-3 bg-muted border border-border rounded-xl h-12 opacity-50">
                                                <UserAvatar src={video.uploadedBy.profilePicture || undefined} size="sm" className="w-6 h-6" />
                                                <span className="text-sm text-foreground">{video.uploadedBy.username}</span>
                                            </div>
                                        </div>

                                        <Controller
                                            name="uploadedAt"
                                            control={control}
                                            render={({ field }) => (
                                                <DateInput
                                                    {...field}
                                                    label="Uploaded At"
                                                    variant="bordered"
                                                    labelPlacement="outside"
                                                    isRequired
                                                    isReadOnly
                                                    classNames={{
                                                        inputWrapper: "bg-muted border-border h-12 opacity-50",
                                                        label: "text-muted-foreground"
                                                    }}
                                                    value={field.value ? fromDate(new Date(field.value), getLocalTimeZone()) : null}
                                                />
                                            )}
                                        />
                                    </motion.div>

                                    <motion.div
                                        variants={{
                                            hidden: { opacity: 0, y: 10 },
                                            show: { opacity: 1, y: 0 }
                                        }}
                                        className="grid grid-cols-2 gap-4"
                                    >
                                        <Controller
                                            name="categoryId"
                                            control={control}
                                            rules={{ required: true }}
                                            render={({ field }) => (
                                                <Select
                                                    {...field}
                                                    label="Category"
                                                    variant="bordered"
                                                    labelPlacement="outside"
                                                    placeholder="Select Category"
                                                    isRequired
                                                    isInvalid={!!errors.categoryId}
                                                    errorMessage="Category is required"
                                                    classNames={{
                                                        trigger: "bg-muted border-border h-12",
                                                        label: "text-muted-foreground",
                                                        value: "text-foreground"
                                                    }}
                                                    items={categories}
                                                    selectedKeys={field.value ? [field.value] : []}
                                                    onSelectionChange={(keys) => field.onChange(Array.from(keys)[0])}
                                                >
                                                    {(category) => (
                                                        <SelectItem key={category.id} textValue={category.name}>
                                                            {category.name}
                                                        </SelectItem>
                                                    )}
                                                </Select>
                                            )}
                                        />

                                        <div className="space-y-2">
                                            <Controller
                                                name="createdAt"
                                                control={control}
                                                rules={{ required: true }}
                                                render={({ field }) => (
                                                    <DateInput
                                                        {...field}
                                                        label="Recorded At"
                                                        variant="bordered"
                                                        labelPlacement="outside"
                                                        isRequired
                                                        isReadOnly={!manualDateOverride}
                                                        isInvalid={!!errors.createdAt}
                                                        errorMessage="Date is required"
                                                        classNames={{
                                                            inputWrapper: `bg-muted border-border h-12 ${!manualDateOverride ? 'opacity-50' : ''}`,
                                                            label: "text-muted-foreground"
                                                        }}
                                                        value={field.value ? fromDate(new Date(field.value), getLocalTimeZone()) : null}
                                                        onChange={(date) => field.onChange(date ? date.toDate() : new Date())}
                                                    />
                                                )}
                                            />
                                            <Button
                                                size="sm"
                                                variant="light"
                                                className="text-[10px] text-muted-foreground h-auto p-0 min-w-0"
                                                onPress={() => setManualDateOverride(!manualDateOverride)}
                                            >
                                                {manualDateOverride ? "Cancel manual override" : "Change recorded date"}
                                            </Button>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        variants={{
                                            hidden: { opacity: 0, y: 10 },
                                            show: { opacity: 1, y: 0 }
                                        }}
                                    >
                                        <Controller
                                            name="participants"
                                            control={control}
                                            rules={{ required: true }}
                                            render={({ field }) => (
                                                <Select
                                                    label="Participants"
                                                    variant="bordered"
                                                    labelPlacement="outside"
                                                    placeholder="Who is in this video?"
                                                    selectionMode="multiple"
                                                    isRequired
                                                    isInvalid={!!errors.participants}
                                                    errorMessage="At least one participant is required"
                                                    classNames={{
                                                        trigger: "bg-muted border-border min-h-12",
                                                        label: "text-muted-foreground",
                                                        value: "text-foreground"
                                                    }}
                                                    items={users}
                                                    isMultiline
                                                    selectedKeys={new Set(field.value?.map(u => u.id) || [])}
                                                    onSelectionChange={(keys) => {
                                                        const selectedIds = Array.from(keys) as string[];
                                                        const selectedUsers = users.filter(u => selectedIds.includes(u.id));
                                                        field.onChange(selectedUsers);
                                                    }}
                                                >
                                                    {(user) => (
                                                        <SelectItem key={user.id} textValue={user.username}>
                                                            <div className="flex items-center gap-2">
                                                                <UserAvatar src={user.profilePicture || undefined} size="sm" />
                                                                <span>{user.username}</span>
                                                            </div>
                                                        </SelectItem>
                                                    )}
                                                </Select>
                                            )}
                                        />
                                    </motion.div>
                                </motion.form>
                            </div>

                            {/* Action area fixed at bottom */}
                            <div className="mt-6 pt-6 border-t border-border space-y-4">
                                {status.stage !== 'idle' && (
                                    <div className="space-y-2 p-4 bg-muted rounded-2xl border border-border">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">{status.message}</span>
                                            {status.progress !== undefined && (
                                                <span className="text-muted-foreground">{status.progress}%</span>
                                            )}
                                        </div>
                                        <Progress
                                            aria-label="Action progress"
                                            value={status.progress}
                                            isIndeterminate={status.progress === undefined}
                                            color={status.stage === 'error' ? 'danger' : status.stage === 'done' ? 'success' : 'primary'}
                                            size="sm"
                                        />
                                    </div>
                                )}
                                <div className="flex gap-4">
                                    <Button
                                        color="primary"
                                        size="lg"
                                        className="flex-1 font-bold h-12 rounded-2xl shadow-lg shadow-primary/20"
                                        startContent={<FontAwesomeIcon icon={faArrowUpFromBracket} />}
                                        onPress={() => handleSubmit(onSubmit)()}
                                        isDisabled={!canEdit || isSessionPending}
                                        isLoading={status.stage === 'saving'}
                                    >
                                        Save Changes
                                    </Button>
                                    <Button
                                        as={Link}
                                        href={`/videos/${video.id}`}
                                        variant="bordered"
                                        size="lg"
                                        className="px-8 h-12 rounded-2xl border-border text-foreground hover:bg-muted"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AuroraBackground>
    );
}
