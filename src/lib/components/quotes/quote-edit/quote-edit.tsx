"use client";

import { updateQuoteElement } from "@/src/app/(content)/quotes/(detail)/[id]/edit/actions";
import { UserAvatar } from "@/src/lib/components/ui/user-avatar";
import { getAllUsers } from "@/src/lib/actions/data-fetching";
import { useSession } from "@/src/lib/auth-client";
import { getEffectiveRole } from "@/src/lib/auth-utils-shared";
import { AuroraBackground } from "@/src/lib/components/home/aurora-background";
import { queryKeys } from "@/src/lib/queries/query-keys";
import { QuoteActionInput } from "@/src/lib/utils/quote-utils";
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
import { Button, Chip, DateInput, Progress, Select, SelectItem, Textarea } from "@heroui/react";
import { fromDate, getLocalTimeZone } from "@internationalized/date";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion, Reorder } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, SubmitHandler, useForm, useWatch } from "react-hook-form";
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
    const queryClient = useQueryClient();

    const [users, setUsers] = useState<User[]>([]);

    // Transform initial messages from quote.messages to local Message interface
    const initialMessages: Message[] = quote.messages.map((m, idx) => ({
        id: m.id || String(idx + 1),
        userId: m.user.id,
        message: m.message,
        isContext: m.isContext
    }));

    // Transform participants
    const initialParticipants = quote.participants;

    const {
        handleSubmit,
        control,
        setValue,
        formState: { errors },
    } = useForm<QuoteActionInput>({
        defaultValues: {
            uploadedBy: quote.uploadedBy,
            uploadedAt: new Date(quote.uploadedAt),
            createdAt: new Date(quote.createdAt),
            messages: initialMessages,
            participants: initialParticipants,
        }
    });

    const messages = useWatch({
        control,
        name: "messages",
        defaultValue: initialMessages
    });

    // Permission checks
    const role = getEffectiveRole(session);
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

    const updateMessage = (id: string, field: keyof Message, value: string | boolean) => {
        const updated = messages.map(m => m.id === id ? { ...m, [field]: value } : m);
        setValue("messages", updated);
    };

    const handleReorder = (newOrder: Message[]) => {
        setValue("messages", newOrder);
    };

    const onSubmit: SubmitHandler<QuoteActionInput> = async (data) => {
        const validMessages = data.messages.filter(msg => (msg.isContext || msg.userId) && msg.message.trim());

        if (validMessages.length === 0) {
            alert("Please add at least one valid message");
            return;
        }

        try {
            setStatus({ stage: 'saving', message: 'Updating quote...', progress: 40 });

            const quoteData = {
                ...data,
                messages: validMessages.map(m => ({
                    id: m.id,
                    userId: m.userId,
                    message: m.message,
                    isContext: m.isContext
                })),
            };

            await updateQuoteElement(quote.id, quoteData);
            queryClient.invalidateQueries({ queryKey: queryKeys.quotes.all });
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
        <AuroraBackground className="fixed inset-x-0 bottom-0 top-12 md:left-(--sidebar-w) z-0">
            <div className="relative z-10 w-full h-full overflow-y-auto pt-8 pb-32 px-4 md:px-12">

                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full max-w-400 bg-card/70 backdrop-blur-md border border-border rounded-2xl p-2 overflow-hidden shadow-2xl relative mx-auto"
                >

                    <div className="flex flex-col lg:flex-row h-full min-h-187.5">

                        {/* Left Column: Live Preview Panel */}
                        <div className="lg:w-[45%] bg-muted/50 rounded-2xl m-2 border border-border flex flex-col overflow-hidden relative">
                            <div className="p-6 border-b border-border bg-muted/50 backdrop-blur-md z-10">
                                <h2 className="text-foreground font-bold flex items-center gap-2">
                                    <FontAwesomeIcon icon={faQuoteRight} className="text-muted-foreground" /> Preview
                                </h2>
                            </div>

                            <div className="flex-1 p-8 space-y-6 overflow-y-auto custom-scrollbar relative max-h-150">
                                <AnimatePresence initial={false}>
                                    {(() => {
                                        let side = false;
                                        let lastUserId: string | null = null;
                                        return messages.map((msg, idx) => {
                                            const user = getUser(msg.userId);

                                            if (msg.isContext) {
                                                return (
                                                    <motion.div
                                                        key={msg.id}
                                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.9 }}
                                                        className="flex justify-center"
                                                    >
                                                        <div className="bg-muted backdrop-blur-sm border border-border rounded-full px-6 py-2 text-xs text-faint italic text-center max-w-[80%] leading-relaxed shadow-sm">
                                                            {msg.message || "Context description..."}
                                                        </div>
                                                    </motion.div>
                                                );
                                            }

                                            // Side flips only when the speaker changes, so consecutive messages from one user stay together.
                                            if (lastUserId !== null && lastUserId !== msg.userId) side = !side;
                                            const isRight = side;
                                            lastUserId = msg.userId;

                                            return (
                                                <motion.div
                                                    key={msg.id}
                                                    initial={{ opacity: 0, x: !isRight ? -20 : 20, y: 10 }}
                                                    animate={{ opacity: 1, x: 0, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.9 }}
                                                    className={`flex gap-3 ${isRight ? 'flex-row-reverse' : ''}`}
                                                >
                                                    <UserAvatar
                                                        src={user?.profilePicture || undefined}
                                                        className={`w-10 h-10 shrink-0 border-2 border-border shadow-lg ${user?.status === 'INVITED' ? 'bg-warning/20' : ''}`}
                                                        showFallback
                                                    />
                                                    <div className={`flex flex-col ${isRight ? 'items-end' : 'items-start'} max-w-[80%]`}>
                                                        <div className="text-xs font-medium text-muted-foreground mb-1 px-1 flex items-center gap-1">
                                                            {user?.username || "Selecting..."}
                                                            {user?.status === 'INVITED' && <span className="text-[8px] text-warning opacity-60">(Pending)</span>}
                                                        </div>
                                                        <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-xl border ${isRight
                                                            ? 'bg-muted text-foreground border-border rounded-tr-none'
                                                            : 'bg-card text-foreground border-border rounded-tl-none backdrop-blur-md'
                                                            }`}>
                                                            <p className="whitespace-pre-wrap wrap-break-word">
                                                                {msg.message || <span className="italic opacity-30">Type content...</span>}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        });
                                    })()}
                                </AnimatePresence>
                                {messages.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-faint italic space-y-4">
                                        <FontAwesomeIcon icon={faCommentDots} className="text-4xl opacity-20" />
                                        <p>Start the conversation...</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Builder Panel */}
                        <div className="lg:w-[55%] p-8 lg:p-10 flex flex-col h-187.5">
                            <div className="flex justify-between items-center mb-8">
                                <h1 className="text-2xl font-bold text-foreground">Edit Quote #{quote.id}</h1>
                                <div className="flex gap-2">
                                    <Chip variant="flat" className="bg-muted text-faint border border-border">
                                        {messages.length} Items
                                    </Chip>
                                    <Chip size="sm" variant="flat" className="bg-muted text-muted-foreground border border-border">Edit mode</Chip>
                                </div>
                            </div>

                            {!isSessionPending && !canEdit && (
                                <div className="mb-6 p-4 bg-danger-500/10 border border-danger-500/20 rounded-xl text-danger-500 flex items-center gap-3">
                                    <FontAwesomeIcon icon={faInfoCircle} />
                                    <p className="text-sm">You do not have permission to edit this quote.</p>
                                </div>
                            )}

                            <motion.div
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
                                className="flex flex-col flex-1 min-h-0"
                            >
                                <motion.div
                                    variants={{
                                        hidden: { opacity: 0, y: 10 },
                                        show: { opacity: 1, y: 0 }
                                    }}
                                    className="grid grid-cols-2 gap-4 mb-8"
                                >
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-faint">Uploaded By</label>
                                        <div className="flex items-center gap-3 p-3 bg-muted border border-border rounded-xl h-12 opacity-50">
                                            <UserAvatar src={quote.uploadedBy.profilePicture || undefined} size="sm" className="w-6 h-6" />
                                            <span className="text-sm text-foreground">{quote.uploadedBy.username}</span>
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
                                                    inputWrapper: "bg-muted border-border h-12 hover:border-border transition-colors",
                                                    label: "text-faint"
                                                }}
                                                value={field.value ? fromDate(new Date(field.value), getLocalTimeZone()) : null}
                                                onChange={(date) => field.onChange(date ? date.toDate() : new Date())}
                                            />
                                        )}
                                    />
                                </motion.div>

                                <motion.div
                                    variants={{
                                        hidden: { opacity: 0, y: 10 },
                                        show: { opacity: 1, y: 0 }
                                    }}
                                    className="mb-8"
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
                                                placeholder="Who is in this quote?"
                                                selectionMode="multiple"
                                                isRequired
                                                isInvalid={!!errors.participants}
                                                errorMessage="At least one participant is required"
                                                classNames={{
                                                    trigger: "bg-muted border-border min-h-12",
                                                    label: "text-faint",
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
                                                            <UserAvatar src={user.profilePicture || undefined} size="sm" className={user.status === 'INVITED' ? 'bg-warning/20' : ''} />
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
                                </motion.div>

                                {/* Message Manager List with Reorder */}
                                <motion.div
                                    variants={{
                                        hidden: { opacity: 0, y: 10 },
                                        show: { opacity: 1, y: 0 }
                                    }}
                                    className="flex-1 overflow-y-auto custom-scrollbar pr-2 mb-6 space-y-3 min-h-0"
                                >
                                    <h3 className="text-xs font-bold text-faint sticky top-0 bg-card/80 backdrop-blur-md py-3 z-20">
                                        Conversation Flow
                                    </h3>

                                    <Reorder.Group
                                        axis="y"
                                        values={messages}
                                        onReorder={handleReorder}
                                        className="space-y-3"
                                    >
                                        <AnimatePresence initial={false}>
                                            {messages.map((msg) => (
                                                <Reorder.Item
                                                    key={msg.id}
                                                    value={msg}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    className={`flex gap-3 items-start p-4 rounded-2xl border transition-all duration-300 ${msg.isContext
                                                        ? 'bg-muted border-border border-dashed'
                                                        : 'bg-muted border-border group hover:border-border shadow-sm'
                                                        }`}
                                                >
                                                    <div className="w-6 flex flex-col items-center justify-center text-faint pt-4 cursor-grab active:cursor-grabbing">
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
                                                                    classNames={{ trigger: "bg-muted text-foreground h-10 border-border", value: "text-foreground" }}
                                                                    selectedKeys={msg.userId ? [msg.userId] : []}
                                                                    onSelectionChange={(keys) => updateMessage(msg.id, 'userId', String(Array.from(keys)[0]))}
                                                                    items={users}
                                                                >
                                                                    {(u) => (
                                                                        <SelectItem
                                                                            key={u.id}
                                                                            textValue={u.username}
                                                                            startContent={<UserAvatar src={u.profilePicture || undefined} size="sm" className={`w-5 h-5 ${u.status === 'INVITED' ? 'bg-warning/20' : ''}`} />}
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
                                                                className={`h-10 px-4 font-medium ${msg.isContext ? 'bg-muted text-foreground border border-border' : 'bg-muted text-muted-foreground'}`}
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
                                                            classNames={{ inputWrapper: "bg-transparent border-border hover:border-border focus-within:border-theme-accent", input: "text-foreground" }}
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
                                </motion.div>

                                {/* Action Area fixed at bottom */}
                                <motion.div
                                    variants={{
                                        hidden: { opacity: 0, y: 10 },
                                        show: { opacity: 1, y: 0 }
                                    }}
                                    className="pt-6 border-t border-border space-y-4"
                                >
                                    {status.stage !== 'idle' && (
                                        <div className="space-y-2 p-4 bg-muted rounded-2xl border border-border">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-muted-foreground">{status.message}</span>
                                                {status.progress !== undefined && (
                                                    <span className="text-faint">{status.progress}%</span>
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
                                                className="bg-muted text-foreground font-medium h-12 px-6 rounded-2xl"
                                                startContent={<FontAwesomeIcon icon={faPlus} />}
                                                onPress={() => addMessage(false)}
                                            >
                                                Add Message
                                            </Button>
                                            <Button
                                                variant="flat"
                                                className="bg-muted text-muted-foreground font-medium h-12 px-6 rounded-2xl border border-border hover:bg-muted"
                                                startContent={<FontAwesomeIcon icon={faInfoCircle} />}
                                                onPress={() => addMessage(true)}
                                            >
                                                Add Context
                                            </Button>
                                        </div>

                                        <div className="flex gap-3 flex-1">
                                            <Button
                                                className="flex-1 bg-primary text-foreground font-bold h-12 rounded-2xl shadow-lg shadow-primary/20"
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
                                                className="px-8 h-12 rounded-2xl border-border text-foreground hover:bg-muted font-medium"
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>

                        </div>
                    </div>
                </motion.div>
            </div>
        </AuroraBackground>
    );
}
