"use client";

import { updateVideo } from "@/src/app/(content)/videos/(detail)/[id]/edit/actions";
import { getAllCategories, getAllUsers } from "@/src/app/current-storage/storage";
import { useSession } from "@/src/lib/auth-client";
import { getEffectiveRole } from "@/src/lib/auth-utils-shared";
import { AuroraBackground } from "@/src/lib/components/home/aurora-background";
import { 
    faArrowUpFromBracket, 
    faInfoCircle, 
    faPenToSquare
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
    Avatar, 
    BreadcrumbItem, 
    Breadcrumbs, 
    Button, 
    Chip, 
    DateInput, 
    Input, 
    Select, 
    SelectItem, 
    Textarea 
} from "@heroui/react";
import { fromDate, getLocalTimeZone } from "@internationalized/date";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { Category, UploadVideo, User, Video } from "../../../types/types";

export default function VideoEdit({ video }: { video: Video }) {
    const { data: session, isPending: isSessionPending } = useSession();
    const router = useRouter();

    const {
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<UploadVideo>({
        defaultValues: {
            title: video.title,
            description: video.description || "",
            id: video.id,
            createdAt: video.createdAt,
            uploadedAt: video.uploadedAt,
            uploadedBy: video.uploadedBy,
            participants: video.participants.map(p => p.type === 'user' ? p.data : null).filter(Boolean) as User[],
            categoryId: video.category.id,
            video: undefined
        }
    });

    const [users, setUsers] = useState<User[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [manualDateOverride, setManualDateOverride] = useState(false);

    // Permission checks
    const role = getEffectiveRole(session as any);
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

    const onSubmit: SubmitHandler<UploadVideo> = async (data) => {
        // Strip the video file property since we are not updating it
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { video: _, ...rest } = data;

        // Re-inject the video property using the original string path if needed 
        // or just let the backend handle it since we're only updating metadata
        const submitData = { ...rest, video: video.videoUrl };

        console.log("Submitting edit data: ", submitData);
        await updateVideo(submitData as any);
    };

    return (
        <AuroraBackground className="fixed inset-0 !h-screen z-0">
            <div className="relative z-10 w-full h-full overflow-y-auto pt-24 pb-32 px-4 md:px-12">
                
                <div className="max-w-[1600px] mx-auto mb-6">
                    <Breadcrumbs variant="bordered" classNames={{ list: "bg-black/40 border-white/10 backdrop-blur-md" }}>
                        <BreadcrumbItem href="/">Home</BreadcrumbItem>
                        <BreadcrumbItem href="/videos">Videos</BreadcrumbItem>
                        <BreadcrumbItem>Edit</BreadcrumbItem>
                    </Breadcrumbs>
                </div>

                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full max-w-[1600px] bg-[#050505]/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-2 overflow-hidden shadow-2xl relative mx-auto"
                >
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                    <div className="flex flex-col lg:flex-row h-full">
                        {/* Left Column: Visuals */}
                        <div className="lg:w-[60%] bg-black/40 rounded-[2rem] m-2 relative group overflow-hidden border border-white/5 flex flex-col h-[700px]">
                            
                            <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-30">
                                <div className="flex gap-2">
                                    <Chip size="sm" variant="shadow" classNames={{ base: "bg-black/60 backdrop-blur-md border border-white/10", content: "text-white/80 font-mono text-[10px]" }}>MP4</Chip>
                                    <Chip size="sm" variant="shadow" classNames={{ base: "bg-black/60 backdrop-blur-md border border-white/10", content: "text-white/80 font-mono text-[10px]" }}>1080P</Chip>
                                </div>
                                <Chip size="sm" color="warning" variant="flat" className="bg-amber-500/10 text-amber-500 border border-amber-500/20">EDIT MODE</Chip>
                            </div>

                            <div className="flex-1 flex items-center justify-center p-8 relative">
                                <div className="w-full h-full flex flex-col items-center justify-center relative">
                                    <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex items-center justify-center">
                                        <video src={video.videoUrl} controls className="max-w-full max-h-full object-contain" />
                                    </div>
                                    <div className="mt-6 text-center">
                                        <h2 className="text-xl font-bold text-white mb-1 truncate max-w-md">{video.title}</h2>
                                        <p className="text-white/40 text-sm">Editing video metadata</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Form */}
                        <div className="lg:w-[40%] p-8 lg:p-10 flex flex-col h-[700px]">
                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <FontAwesomeIcon icon={faPenToSquare} className="text-2xl text-secondary" />
                                    <h2 className="text-2xl font-bold text-white">Video Details</h2>
                                </div>

                                {!isSessionPending && !canEdit && (
                                    <div className="p-4 bg-danger-500/10 border border-danger-500/20 rounded-xl text-danger-500 flex items-center gap-3">
                                        <FontAwesomeIcon icon={faInfoCircle} />
                                        <p className="text-sm">You do not have permission to edit this video.</p>
                                    </div>
                                )}

                                <form className="space-y-6">
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
                                                    inputWrapper: "bg-white/5 border-white/10 h-12 hover:border-white/20 transition-colors", 
                                                    input: "text-white font-medium", 
                                                    label: "text-white/50" 
                                                }}
                                            />
                                        )}
                                    />

                                    <Controller
                                        name="description"
                                        control={control}
                                        rules={{ required: true }}
                                        render={({ field }) => (
                                            <Textarea
                                                {...field}
                                                label="Description"
                                                variant="bordered"
                                                labelPlacement="outside"
                                                placeholder="Tell the story..."
                                                minRows={3}
                                                isRequired
                                                isInvalid={!!errors.description}
                                                errorMessage="Description is required"
                                                classNames={{ 
                                                    inputWrapper: "bg-white/5 border-white/10 hover:border-white/20 transition-colors", 
                                                    input: "text-white", 
                                                    label: "text-white/50" 
                                                }}
                                            />
                                        )}
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-white/50">Uploaded By</label>
                                            <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl h-12 opacity-50">
                                                <Avatar src={video.uploadedBy.profilePicture || undefined} size="sm" className="w-6 h-6" />
                                                <span className="text-sm text-white">{video.uploadedBy.username}</span>
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
                                                        inputWrapper: "bg-white/5 border-white/10 h-12 opacity-50", 
                                                        label: "text-white/50" 
                                                    }}
                                                    value={field.value ? fromDate(new Date(field.value), getLocalTimeZone()) as any : null}
                                                />
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
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
                                                        trigger: "bg-white/5 border-white/10 h-12", 
                                                        label: "text-white/50", 
                                                        value: "text-white" 
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
                                                            inputWrapper: `bg-white/5 border-white/10 h-12 ${!manualDateOverride ? 'opacity-50' : ''}`,
                                                            label: "text-white/50"
                                                        }}
                                                        value={field.value ? fromDate(new Date(field.value), getLocalTimeZone()) as any : null}
                                                        onChange={(date) => field.onChange(date ? date.toDate(getLocalTimeZone()) : new Date())}
                                                    />
                                                )}
                                            />
                                            <Button
                                                size="sm"
                                                variant="light"
                                                className="text-[10px] text-white/40 h-auto p-0 min-w-0"
                                                onPress={() => setManualDateOverride(!manualDateOverride)}
                                            >
                                                {manualDateOverride ? "Cancel manual override" : "Change recorded date"}
                                            </Button>
                                        </div>
                                    </div>

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
                                                    trigger: "bg-white/5 border-white/10 min-h-12", 
                                                    label: "text-white/50", 
                                                    value: "text-white" 
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
                                                            <Avatar src={user.profilePicture || undefined} size="sm" />
                                                            <span>{user.username}</span>
                                                        </div>
                                                    </SelectItem>
                                                )}
                                            </Select>
                                        )}
                                    />
                                </form>
                            </div>

                            {/* Action area fixed at bottom */}
                            <div className="mt-6 pt-6 border-t border-white/10 flex gap-4">
                                <Button
                                    color="primary"
                                    size="lg"
                                    className="flex-1 font-bold h-14 rounded-2xl shadow-lg shadow-primary/20"
                                    startContent={<FontAwesomeIcon icon={faArrowUpFromBracket} />}
                                    onPress={() => handleSubmit(onSubmit)()}
                                    isDisabled={!canEdit || isSessionPending}
                                >
                                    Save Changes
                                </Button>
                                <Button
                                    as={Link}
                                    href={`/videos/${video.id}`}
                                    variant="bordered"
                                    size="lg"
                                    className="px-8 h-14 rounded-2xl border-white/10 text-white hover:bg-white/5"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AuroraBackground>
    );
}
