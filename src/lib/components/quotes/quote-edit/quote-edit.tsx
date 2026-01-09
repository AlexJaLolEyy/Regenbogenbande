"use client";

import { updateQuote } from "@/src/app/(content)/quotes/(detail)/[id]/edit/actions";
import { getAllUsers } from "@/src/app/current-storage/storage";
import { useSession } from "@/src/lib/auth-client";
import { getEffectiveRole } from "@/src/lib/auth-utils-shared";
import { AuroraBackground } from "@/src/lib/components/home/aurora-background";
import {
    faCommentDots,
    faGripLines,
    faInfoCircle,
    faPlus,
    faQuoteRight,
    faSave,
    faTrash
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    Avatar,
    BreadcrumbItem,
    Breadcrumbs,
    Button,
    Chip,
    DateInput,
    Progress,
    Select,
    SelectItem,
    Textarea
} from "@heroui/react";
import { fromDate, getLocalTimeZone } from "@internationalized/date";
import { AnimatePresence, motion, Reorder } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import type { Quote, User } from "../../../types/types";

interface Message {
    id: string;
    userId: string;
    message: string;
    isContext?: boolean;
}

interface QuoteFormData {
    uploadedBy: User | string;
    uploadedAt: Date;
    createdAt: Date;
    messages: Message[];
    participants: User[];
}

export default function QuoteEdit({ quote }: { quote: Quote }) {
    const { data: session, isPending: isSessionPending } = useSession();
    const router = useRouter();

    const [users, setUsers] = useState<User[]>([]);

    // Transform initial messages from quote.messages to local Message interface
    const initialMessages: Message[] = quote.messages.map((m, idx) => ({
        id: m.id || String(idx + 1),
        userId: m.user.id,
        message: m.message,
        isContext: false // Default to false as we don't have this in DB yet
    }));

    // Transform participants
    const initialParticipants = quote.participants
        .map(p => p.type === 'user' ? p.data : null)
        .filter(Boolean) as User[];

    const {
        handleSubmit,
        control,
        setValue,
        watch,
        formState: { errors },
    } = useForm<QuoteFormData>({
        defaultValues: {
            uploadedBy: quote.uploadedBy,
            uploadedAt: new Date(quote.uploadedAt),
            createdAt: new Date(quote.createdAt),
            messages: initialMessages,
            participants: initialParticipants,
        }
    });

    const messages = watch("messages");

    // Permission checks
    const role = getEffectiveRole(session as any);
    const isOwner = session?.user?.id === quote.uploadedBy.id;
    const canEdit = role === 'owner' || role === 'admin' || isOwner;

    // Status tracking (similar to upload)
    const [status, setStatus] = useState<{
        stage: 'idle' | 'saving' | 'done' | 'error';
        progress?: number;
        message: string;
    }>({ stage: 'idle', message: '' });

    useEffect(() => {
        if (!isSessionPending && !session?.user) {
            router.push('/login');
        }
    }, [session, isSessionPending, router]);

    useEffect(() => {
        getAllUsers().then(setUsers);
    }, []);

    const addMessage = (isContext = false) => {
        const currentMsgs = [...messages];
        const newId = Math.random().toString(36).substr(2, 9);
        
        setValue("messages", [
            ...currentMsgs,
            { id: newId, userId: "", message: "", isContext }
        ]);
    };

    const removeMessage = (id: string) => {
        if (messages.length > 1) {
            setValue("messages", messages.filter(m => m.id !== id));
        }
    };

    const updateMessage = (id: string, field: keyof Message, value: any) => {
        const updated = messages.map(m => m.id === id ? { ...m, [field]: value } : m);
        setValue("messages", updated);
    };

    const handleReorder = (newOrder: Message[]) => {
        setValue("messages", newOrder);
    };

    const onSubmit: SubmitHandler<QuoteFormData> = async (data) => {
        const validMessages = data.messages.filter(msg => msg.userId && msg.message.trim());

        if (validMessages.length === 0) {
            alert("Please add at least one valid message");
            return;
        }

        try {
            setStatus({ stage: 'saving', message: 'Updating quote...', progress: 40 });
            
            const quoteData = {
                ...data,
                messages: validMessages.map(m => ({
                    userId: m.userId,
                    message: m.message
                })),
            };

            await updateQuote(quote.id, quoteData as any);
            setStatus({ stage: 'done', message: 'Quote updated!', progress: 100 });
        } catch (error: unknown) {
            if (error && typeof error === 'object' && 'digest' in error &&
                typeof error.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT')) {
                return;
            }
            console.error('Error updating quote:', error);
            setStatus({ stage: 'error', message: 'Error updating quote' });
        }
    };

    const getUser = (id: string) => users.find(u => u.id === id);

    return (
        <AuroraBackground className="fixed inset-0 !h-screen z-0">
            <div className="relative z-10 w-full h-full overflow-y-auto pt-24 pb-32 px-4 md:px-12">

                <div className="max-w-[1600px] mx-auto mb-6">
                    <Breadcrumbs variant="bordered" classNames={{ list: "bg-black/40 border-white/10 backdrop-blur-md" }}>
                        <BreadcrumbItem href="/">Home</BreadcrumbItem>
                        <BreadcrumbItem href="/quotes">Quotes</BreadcrumbItem>
                        <BreadcrumbItem href={`/quotes/${quote.id}`}>Quote #{quote.id}</BreadcrumbItem>
                        <BreadcrumbItem>Edit</BreadcrumbItem>
                    </Breadcrumbs>
                </div>

                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full max-w-[1600px] bg-[#050505]/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-2 overflow-hidden shadow-2xl relative mx-auto"
                >
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                    <div className="flex flex-col lg:flex-row h-full min-h-[750px]">

                        {/* Left Column: Live Preview Panel */}
                        <div className="lg:w-[45%] bg-black/40 rounded-[2rem] m-2 border border-white/5 flex flex-col overflow-hidden relative">
                            <div className="p-6 border-b border-white/5 bg-black/20 backdrop-blur-md z-10">
                                <h2 className="text-white font-bold flex items-center gap-2">
                                    <FontAwesomeIcon icon={faQuoteRight} className="text-primary-500" /> Preview
                                </h2>
                            </div>

                            <div className="flex-1 p-8 space-y-6 overflow-y-auto custom-scrollbar bg-[url('/noise.png')] bg-opacity-5 relative max-h-[600px]">
                                <AnimatePresence initial={false}>
                                    {messages.map((msg, idx) => {
                                        const user = getUser(msg.userId);
                                        const isLeft = idx % 2 === 0;

                                        if (msg.isContext) {
                                            return (
                                                <motion.div
                                                    key={msg.id}
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.9 }}
                                                    className="flex justify-center"
                                                >
                                                    <div className="bg-white/5 backdrop-blur-sm border border-white/5 rounded-full px-6 py-2 text-xs text-white/50 italic text-center max-w-[80%] leading-relaxed shadow-sm">
                                                        {msg.message || "Context description..."}
                                                    </div>
                                                </motion.div>
                                            );
                                        }

                                        return (
                                            <motion.div
                                                key={msg.id}
                                                initial={{ opacity: 0, x: isLeft ? -20 : 20, y: 10 }}
                                                animate={{ opacity: 1, x: 0, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                className={`flex gap-3 ${!isLeft ? 'flex-row-reverse' : ''}`}
                                            >
                                                <Avatar
                                                    src={user?.profilePicture || undefined}
                                                    className={`w-10 h-10 shrink-0 border-2 border-white/10 shadow-lg ${user?.status === 'INVITED' ? 'bg-warning/20' : ''}`}
                                                    showFallback
                                                />
                                                <div className={`flex flex-col ${!isLeft ? 'items-end' : 'items-start'} max-w-[80%]`}>
                                                    <div className="text-[10px] font-bold text-white/40 mb-1 px-1 flex items-center gap-1">
                                                        {user?.username || "Selecting..."}
                                                        {user?.status === 'INVITED' && <span className="text-[8px] text-warning opacity-60">(Pending)</span>}
                                                    </div>
                                                    <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-xl border ${!isLeft
                                                        ? 'bg-primary-600 text-white border-primary-400/30 rounded-tr-none'
                                                        : 'bg-white/10 text-white/90 border-white/5 rounded-tl-none backdrop-blur-md'
                                                        }`}>
                                                        <p className="whitespace-pre-wrap break-words">
                                                            {msg.message || <span className="italic opacity-30">Type content...</span>}
                                                        </p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                                {messages.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-white/20 italic space-y-4">
                                        <FontAwesomeIcon icon={faCommentDots} className="text-4xl opacity-20" />
                                        <p>Start the conversation...</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Builder Panel */}
                        <div className="lg:w-[55%] p-8 lg:p-10 flex flex-col h-[750px]">
                            <div className="flex justify-between items-center mb-8">
                                <h1 className="text-2xl font-bold text-white">Edit Quote #{quote.id}</h1>
                                <div className="flex gap-2">
                                    <Chip variant="flat" className="bg-white/5 text-white/50 border border-white/5">
                                        {messages.length} Items
                                    </Chip>
                                    <Chip size="sm" color="warning" variant="flat" className="bg-amber-500/10 text-amber-500 border border-amber-500/20">EDIT MODE</Chip>
                                </div>
                            </div>

                            {!isSessionPending && !canEdit && (
                                <div className="mb-6 p-4 bg-danger-500/10 border border-danger-500/20 rounded-xl text-danger-500 flex items-center gap-3">
                                    <FontAwesomeIcon icon={faInfoCircle} />
                                    <p className="text-sm">You do not have permission to edit this quote.</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white/50">Uploaded By</label>
                                    <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl h-12 opacity-50">
                                        <Avatar src={quote.uploadedBy.profilePicture || undefined} size="sm" className="w-6 h-6" />
                                        <span className="text-sm text-white">{quote.uploadedBy.username}</span>
                                    </div>
                                </div>

                                <Controller
                                    name="createdAt"
                                    control={control}
                                    rules={{ required: true }}
                                    render={({ field }) => (
                                        <DateInput
                                            {...field}
                                            label="Event Date"
                                            variant="bordered"
                                            labelPlacement="outside"
                                            isRequired
                                            isInvalid={!!errors.createdAt}
                                            classNames={{ 
                                                inputWrapper: "bg-white/5 border-white/10 h-12 hover:border-white/20 transition-colors", 
                                                label: "text-white/50" 
                                            }}
                                            value={field.value ? fromDate(new Date(field.value), getLocalTimeZone()) as any : null}
                                            onChange={(date) => field.onChange(date ? date.toDate(getLocalTimeZone()) : new Date())}
                                        />
                                    )}
                                />
                            </div>

                            <div className="mb-8">
                                <Controller
                                    name="participants"
                                    control={control}
                                    rules={{ required: true }}
                                    render={({ field }) => (
                                        <Select
                                            label="Participants"
                                            variant="bordered"
                                            labelPlacement="outside"
                                            placeholder="Who is in this quote?"
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
                                                        <Avatar src={user.profilePicture || undefined} size="sm" className={user.status === 'INVITED' ? 'bg-warning/20' : ''} />
                                                        <span>{user.username}</span>
                                                        {user.status === 'INVITED' && (
                                                            <Chip size="sm" variant="flat" color="warning" className="ml-auto h-5 text-[10px]">Pending</Chip>
                                                        )}
                                                    </div>
                                                </SelectItem>
                                            )}
                                        </Select>
                                    )}
                                />
                            </div>

                            {/* Message Manager List with Reorder */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 mb-6 space-y-3 min-h-0">
                                <h3 className="text-xs font-bold text-white/30 uppercase tracking-widest sticky top-0 bg-[#070707]/80 backdrop-blur-md py-3 z-20">
                                    Conversation Flow
                                </h3>

                                <Reorder.Group
                                    axis="y"
                                    values={messages}
                                    onReorder={handleReorder}
                                    className="space-y-3"
                                >
                                    <AnimatePresence initial={false}>
                                        {messages.map((msg, index) => (
                                            <Reorder.Item
                                                key={msg.id}
                                                value={msg}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className={`flex gap-3 items-start p-4 rounded-2xl border transition-all duration-300 ${msg.isContext
                                                    ? 'bg-white/5 border-white/5 border-dashed'
                                                    : 'bg-white/5 border-white/5 group hover:border-white/10 shadow-sm'
                                                    }`}
                                            >
                                                <div className="w-6 flex flex-col items-center justify-center text-white/20 pt-4 cursor-grab active:cursor-grabbing">
                                                    <FontAwesomeIcon icon={faGripLines} className="text-sm" />
                                                </div>

                                                <div className="flex-1 space-y-3">
                                                    <div className="flex gap-3">
                                                        {!msg.isContext && (
                                                            <Select
                                                                placeholder="Select Speaker"
                                                                size="sm"
                                                                variant="bordered"
                                                                aria-label="Speaker"
                                                                classNames={{ trigger: "bg-black/40 text-white h-10 border-white/10", value: "text-white" }}
                                                                selectedKeys={msg.userId ? [msg.userId] : []}
                                                                onSelectionChange={(keys) => updateMessage(msg.id, 'userId', Array.from(keys)[0])}
                                                                items={users}
                                                            >
                                                                {(u) => (
                                                                    <SelectItem
                                                                        key={u.id}
                                                                        textValue={u.username}
                                                                        startContent={<Avatar src={u.profilePicture || undefined} size="sm" className={`w-5 h-5 ${u.status === 'INVITED' ? 'bg-warning/20' : ''}`} />}
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            <span>{u.username}</span>
                                                                            {u.status === 'INVITED' && <Chip size="sm" variant="flat" color="warning" className="h-4 text-[8px]">Pending</Chip>}
                                                                        </div>
                                                                    </SelectItem>
                                                                )}
                                                            </Select>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            variant="flat"
                                                            className={`h-10 px-4 font-medium ${msg.isContext ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30' : 'bg-white/5 text-white/40'}`}
                                                            onPress={() => updateMessage(msg.id, 'isContext', !msg.isContext)}
                                                        >
                                                            {msg.isContext ? "Context Message" : "Set as Context"}
                                                        </Button>
                                                    </div>

                                                    <Textarea
                                                        placeholder={msg.isContext ? "Add context about what's happening..." : "What did they say?"}
                                                        minRows={1}
                                                        maxRows={5}
                                                        variant="bordered"
                                                        classNames={{ inputWrapper: "bg-transparent border-white/10 hover:border-white/20 focus-within:border-primary-500/50", input: "text-white" }}
                                                        value={msg.message}
                                                        onValueChange={(val) => updateMessage(msg.id, 'message', val)}
                                                    />
                                                </div>

                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    variant="light"
                                                    color="danger"
                                                    onPress={() => removeMessage(msg.id)}
                                                    className="opacity-40 hover:opacity-100 transition-opacity"
                                                >
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </Button>
                                            </Reorder.Item>
                                        ))}
                                    </AnimatePresence>
                                </Reorder.Group>
                            </div>

                            {/* Action Area fixed at bottom */}
                            <div className="pt-6 border-t border-white/10 space-y-4">
                                {status.stage !== 'idle' && (
                                    <div className="space-y-2 p-4 bg-white/5 rounded-2xl border border-white/10">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-white/70">{status.message}</span>
                                            {status.progress !== undefined && (
                                                <span className="text-white/50">{status.progress}%</span>
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

                                <div className="flex justify-between items-center gap-4">
                                    <div className="flex gap-2">
                                        <Button
                                            variant="flat"
                                            className="bg-white/10 text-white font-medium h-14 px-6 rounded-2xl"
                                            startContent={<FontAwesomeIcon icon={faPlus} />}
                                            onPress={() => addMessage(false)}
                                        >
                                            Add Message
                                        </Button>
                                        <Button
                                            variant="flat"
                                            className="bg-white/5 text-white/60 font-medium h-14 px-6 rounded-2xl border border-white/5 hover:bg-white/10"
                                            startContent={<FontAwesomeIcon icon={faInfoCircle} />}
                                            onPress={() => addMessage(true)}
                                        >
                                            Add Context
                                        </Button>
                                    </div>

                                    <div className="flex gap-3 flex-1">
                                        <Button
                                            className="flex-1 bg-primary text-white font-bold h-14 rounded-2xl shadow-lg shadow-primary/20"
                                            startContent={<FontAwesomeIcon icon={faSave} />}
                                            onPress={() => handleSubmit(onSubmit)()}
                                            isLoading={status.stage === 'saving'}
                                            isDisabled={!canEdit || isSessionPending}
                                        >
                                            Save Changes
                                        </Button>
                                        <Button
                                            as={Link}
                                            href={`/quotes/${quote.id}`}
                                            variant="bordered"
                                            className="px-8 h-14 rounded-2xl border-white/10 text-white hover:bg-white/5 font-medium"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </motion.div>
            </div>
        </AuroraBackground>
    );
}
