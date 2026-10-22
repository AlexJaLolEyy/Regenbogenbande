"use client";

import { createQuote } from "@/src/app/(content)/quotes/(detail)/upload/actions";
import { UserAvatar } from "@/src/lib/components/ui/user-avatar";
import { getAllSelectableParticipants } from "@/src/lib/actions/data-fetching";
import { useSession } from "@/src/lib/auth-client";
import { queryKeys } from "@/src/lib/queries/query-keys";
import {
  faCommentDots,
  faGripLines,
  faInfoCircle,
  faPlus,
  faQuoteLeft,
  faSave,
  faTrash
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Button,
  Chip,
  DateInput,
  Progress,
  Select,
  SelectItem,
  Textarea
} from "@heroui/react";
import { fromDate, getLocalTimeZone } from "@internationalized/date";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion, Reorder } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, SubmitHandler, useForm, useWatch } from "react-hook-form";
import type { QuoteUploadForm, User } from "../../../types/types";
import { PageShell } from "../../ui/page-shell";

type Message = QuoteUploadForm['messages'][number];


export default function QuoteUpload() {
  const { data: session, isPending: isSessionPending } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [participants, setParticipants] = useState<User[]>([]);

  const {
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<QuoteUploadForm>({
    defaultValues: {
      uploadedAt: new Date(),
      createdAt: new Date(),
      messages: [{ id: '1', userId: "", message: "", isContext: false }],
      participants: [],
    }
  });

  const messages = useWatch({
    control,
    name: "messages",
    defaultValue: [{ id: '1', userId: "", message: "", isContext: false }]
  });

  // Progress tracking
  const [uploadStatus, setUploadStatus] = useState<{
    stage: 'idle' | 'saving' | 'done' | 'error';
    progress?: number;
    message: string;
  }>({ stage: 'idle', message: '' });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isSessionPending && !session?.user) {
      router.push('/login');
    }
  }, [session, isSessionPending, router]);

  // Auto-populate uploadedBy when session is available
  useEffect(() => {
    if (session?.user) {
      const currentUser: User = {
        id: session.user.id,
        username: session.user.name,
        profilePicture: session.user.image || null,
        status: 'ACTIVE',
      };
      setValue('uploadedBy', currentUser);

      // If first message has no user, set to current user
      if (messages.length === 1 && !messages[0].userId) {
        const updatedMsgs = [...messages];
        updatedMsgs[0].userId = currentUser.id;
        setValue('messages', updatedMsgs);
      }
    }
  }, [session, setValue, messages]);

  useEffect(() => {
    getAllSelectableParticipants().then((p) => {
      setParticipants(p);
    });
  }, []);

  const addMessage = (isContext = false) => {
    const currentMsgs = [...messages];
    const newId = Math.random().toString(36).substr(2, 9);

    // For context messages, default user is uploader
    let userId = "";
    if (isContext && session?.user) {
      userId = session.user.id;
    } else if (currentMsgs.length > 0) {
      // Try to alternate users if only 2 users are involved? 
      // For now just keep empty for regular messages
    }

    setValue("messages", [
      ...currentMsgs,
      { id: newId, userId, message: "", isContext }
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

  const handleReorder = (newOrder: QuoteUploadForm['messages']) => {
    setValue("messages", newOrder);
  };

  const onSubmit: SubmitHandler<QuoteUploadForm> = async (data) => {
    const validMessages = data.messages.filter(msg => (msg.isContext || msg.userId) && msg.message.trim());

    if (validMessages.length === 0) {
      return;
    }

    try {
      setUploadStatus({ stage: 'saving', message: 'Saving quote...', progress: 40 });

      // Automatically determine participants from message authors
      const uniqueAuthorIds = Array.from(new Set(data.messages.map(m => m.userId)));
      const selectedParticipants = participants.filter(p => uniqueAuthorIds.includes(p.id));

      const quoteData: QuoteUploadForm = {
        ...data,
        messages: validMessages.map(m => ({
          id: m.id,
          userId: m.userId,
          message: m.message,
          isContext: m.isContext
        })),
        participants: selectedParticipants,
      };

      await createQuote(quoteData);

      queryClient.invalidateQueries({ queryKey: queryKeys.quotes.all });
      setUploadStatus({ stage: 'done', message: 'Quote saved!', progress: 100 });
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'digest' in error &&
        typeof error.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT')) {
        return;
      }
      setUploadStatus({ stage: 'error', message: 'Error saving quote' });
    }
  };

  const getParticipant = (id: string) => participants.find(p => p.id === id);

  return (
    <PageShell variant="aurora">
      <div className="fixed inset-x-0 bottom-0 top-12 md:left-(--sidebar-w) pt-4 pb-4 md:pb-8 px-4 md:px-8">
        <div className="flex flex-col xl:flex-row gap-8 xl:items-stretch max-w-400 mx-auto h-full">

          {/* Left Box: Preview area */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="w-full xl:w-[45%] flex flex-col gap-6"
          >
            <div className="flex-1 bg-card/70 backdrop-blur-md border border-border rounded-2xl p-5 md:p-8 shadow-sm relative overflow-hidden group transition-all duration-300 flex flex-col">

              <h2 className="text-2xl font-bold text-foreground mb-8 flex items-center gap-2">
                <FontAwesomeIcon icon={faQuoteLeft} className="text-muted-foreground text-sm" />
                Live Preview
              </h2>

              <div className="relative flex-1 bg-muted/50 rounded-2xl overflow-hidden border border-border group/preview">
                <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-8 space-y-6">
                  <AnimatePresence initial={false}>
                    {(() => {
                      let side = false;
                      let lastUserId: string | null = null;
                      return messages.map((msg) => {
                        const participant = getParticipant(msg.userId);

                        if (msg.isContext) {
                          return (
                            <motion.div
                              key={msg.id}
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className="flex justify-center"
                            >
                              <div className="bg-muted backdrop-blur-sm border border-border rounded-2xl px-6 py-2 text-xs text-muted-foreground italic text-center max-w-[90%] leading-relaxed shadow-sm">
                                {msg.message || "Context description..."}
                              </div>
                            </motion.div>
                          );
                        }

                        // Side flips only when the speaker changes, so consecutive messages from one user stay together.
                        if (lastUserId !== null && lastUserId !== msg.userId) side = !side;
                        const isRight = side;
                        lastUserId = msg.userId;
                        const displayName = participant ? participant.username : "Selecting author...";
                        const profilePicture = participant?.profilePicture;

                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, x: !isRight ? -20 : 20, y: 10 }}
                            animate={{ opacity: 1, x: 0, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className={`flex gap-3 ${isRight ? 'flex-row-reverse' : ''}`}
                          >
                            <UserAvatar
                              src={profilePicture || undefined}
                              className={`w-10 h-10 shrink-0 border border-border shadow-lg rounded-full ${participant?.status === 'INVITED' ? 'border-warning/50' : ''}`}
                              showFallback
                            />
                            <div className={`flex flex-col ${isRight ? 'items-end' : 'items-start'} max-w-[85%]`}>
                              <div className="text-xs font-medium text-faint mb-1 px-1 flex items-center gap-1">
                                {displayName}
                                {participant?.status === 'INVITED' && <span className="text-[8px] text-warning/60 italic">(Pending)</span>}
                              </div>
                              <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-2xl border transition-all duration-300 ${isRight
                                ? 'bg-muted text-foreground border-border rounded-tr-none'
                                : 'bg-card text-foreground border-border rounded-tl-none'
                                }`}>
                                <p className="whitespace-pre-wrap wrap-break-word">
                                  {msg.message || <span className="italic opacity-20">Type something...</span>}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        );
                      });
                    })()}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <div className="bg-card/70 backdrop-blur-md border border-border rounded-2xl p-6 flex flex-col justify-center h-40 shrink-0">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0 border border-border text-muted-foreground">
                  <FontAwesomeIcon icon={faInfoCircle} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-foreground">Quote Drafting</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    You can reorder messages by dragging the handles. Use &quot;Context&quot; for narrator descriptions or background info to make the quote more readable.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Box: Builder area */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="w-full xl:w-[55%] flex"
          >
            <div className="flex-1 bg-card/70 backdrop-blur-md border border-border rounded-2xl p-5 md:p-5 md:p-8 lg:p-10 shadow-sm relative group transition-all duration-300 flex flex-col">

              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <FontAwesomeIcon icon={faSave} className="text-muted-foreground text-sm" />
                  Redact Quote
                </h2>
                <Chip variant="flat" size="sm" className="bg-muted text-foreground border border-border font-bold px-3">
                  {messages.length} ITEMS
                </Chip>
              </div>

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
                className="flex flex-col gap-8 flex-1"
              >
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show: { opacity: 1, y: 0 }
                  }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground">Uploaded By</label>
                    <div className="flex items-center gap-3 p-3 bg-muted border border-border rounded-2xl h-12">
                      {isSessionPending ? (
                        <div className="w-3 h-3 border-2 border-theme-accent border-t-transparent rounded-full animate-spin" />
                      ) : session?.user ? (
                        <>
                          <UserAvatar src={session.user.image || undefined} size="sm" className="w-6 h-6 rounded-full border border-border" />
                          <span className="text-xs text-foreground font-bold truncate">{session.user.name}</span>
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">Not logged in</span>
                      )}
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
                          inputWrapper: "bg-muted border-border h-12 hover:border-foreground/30 transition-colors focus-within:border-theme-accent!",
                          label: "text-sm font-medium text-muted-foreground"
                        }}
                        value={field.value ? fromDate(field.value, getLocalTimeZone()) : null}
                        onChange={(date) => field.onChange(date ? (date).toDate() : new Date())}
                      />
                    )}
                  />
                </motion.div>

                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show: { opacity: 1, y: 0 }
                  }}
                  className="flex-1 flex flex-col min-h-0"
                >
                  <div className="flex justify-between items-center sticky top-0 bg-card/80 backdrop-blur-md py-4 z-20 mb-4 px-4 rounded-2xl border border-border">
                    <div className="flex flex-col">
                      <h3 className="text-xs font-medium text-muted-foreground">
                        Conversation Flow
                      </h3>
                      <span className="text-[11px] text-foreground/60 font-medium">Reorder by dragging handles</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="flat"
                        className="bg-muted text-foreground font-bold h-8 px-4 rounded-xl border border-border hover:bg-muted transition-all"
                        startContent={<FontAwesomeIcon icon={faPlus} className="text-[10px]" />}
                        onPress={() => addMessage(false)}
                      >
                        Message
                      </Button>
                      <Button
                        size="sm"
                        variant="flat"
                        className="bg-muted text-muted-foreground font-bold h-8 px-4 rounded-xl border border-border hover:bg-muted hover:text-foreground/60 transition-all"
                        startContent={<FontAwesomeIcon icon={faInfoCircle} className="text-[10px]" />}
                        onPress={() => addMessage(true)}
                      >
                        Context
                      </Button>
                    </div>
                  </div>

                  <div className="flex-1 bg-black/20 border border-border rounded-2xl overflow-hidden flex flex-col relative min-h-0">
                    <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-4">
                      <Reorder.Group
                        axis="y"
                        values={messages}
                        onReorder={handleReorder}
                        className="space-y-3 pb-2"
                      >
                        <AnimatePresence initial={false}>
                          {messages.map((msg) => (
                            <Reorder.Item
                              key={msg.id}
                              value={msg}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className={`flex gap-3 items-start p-3 rounded-2xl border transition-all duration-300 ${msg.isContext
                                ? 'bg-muted border-border border-dashed'
                                : 'bg-muted border-border group hover:border-border'
                                }`}
                            >
                              {/* Drag Handle */}
                              <div className="w-5 flex flex-col items-center justify-center text-faint pt-3 cursor-grab active:cursor-grabbing hover:text-foreground transition-colors">
                                <FontAwesomeIcon icon={faGripLines} className="text-xs" />
                              </div>

                              <div className="flex-1 space-y-3">
                                {/* Compact Controls Header */}
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex-1">
                                    {!msg.isContext ? (
                                      <Select
                                        placeholder="Select Speaker"
                                        size="lg"
                                        variant="bordered"
                                        aria-label="Speaker"
                                        classNames={{
                                          trigger: "bg-muted text-foreground h-10 border-border hover:border-border transition-all min-w-[140px] max-w-[220px] rounded-xl",
                                          value: "text-xs font-bold"
                                        }}
                                        selectedKeys={msg.userId ? [msg.userId] : []}
                                        onChange={(e) => updateMessage(msg.id, 'userId', e.target.value)}
                                        items={participants}
                                        renderValue={() => {
                                          const participant = participants.find(p => p.id === msg.userId);
                                          if (!participant) return null;
                                          return (
                                            <div className="flex items-center gap-1.5">
                                              <UserAvatar src={participant.profilePicture || undefined} size="sm" className="w-3.5 h-3.5 border border-border shadow-sm" />
                                              <span className="truncate">{participant.username}</span>
                                            </div>
                                          );
                                        }}
                                      >
                                        {(p) => (
                                          <SelectItem
                                            key={p.id}
                                            textValue={p.username}
                                            startContent={
                                              <UserAvatar src={p.profilePicture || undefined} size="sm" className="w-4 h-4 border border-border" />
                                            }
                                          >
                                            <div className="flex items-center justify-between gap-2 w-full">
                                              <span className="text-xs font-medium">{p.username}</span>
                                              {p.status === 'INVITED' && <Chip size="sm" variant="flat" color="warning" className="h-3.5 text-[7px] font-bold">PENDING</Chip>}
                                            </div>
                                          </SelectItem>
                                        )}
                                      </Select>
                                    ) : (
                                      <div className="flex items-center gap-2 text-foreground/60 font-semibold text-[11px]">
                                        <FontAwesomeIcon icon={faInfoCircle} className="text-[10px]" />
                                        Contextual Info
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    <Button
                                      isIconOnly
                                      size="sm"
                                      variant="flat"
                                      className={`h-10 w-10 rounded-xl transition-all ${msg.isContext ? 'bg-muted text-foreground border border-border' : 'bg-muted text-faint border border-border hover:bg-muted'}`}
                                      onPress={() => updateMessage(msg.id, 'isContext', !msg.isContext)}
                                      title={msg.isContext ? "Switch to Speaker" : "Switch to Context"}
                                    >
                                      <FontAwesomeIcon icon={msg.isContext ? faCommentDots : faInfoCircle} className="text-sm" />
                                    </Button>
                                    <Button
                                      isIconOnly
                                      size="sm"
                                      variant="light"
                                      color="danger"
                                      onPress={() => removeMessage(msg.id)}
                                      className="text-faint hover:text-danger hover:bg-danger/10 transition-all rounded-xl h-10 w-10"
                                    >
                                      <FontAwesomeIcon icon={faTrash} className="text-sm" />
                                    </Button>
                                  </div>
                                </div>

                                <Textarea
                                  placeholder={msg.isContext ? "Add scene description..." : "Type what was said..."}
                                  minRows={1}
                                  maxRows={5}
                                  variant="bordered"
                                  classNames={{
                                    inputWrapper: "bg-muted border-border hover:border-foreground/30 focus-within:border-theme-accent! transition-all rounded-2xl p-4",
                                    input: "text-foreground text-sm leading-relaxed placeholder:text-faint"
                                  }}
                                  value={msg.message}
                                  onValueChange={(val) => updateMessage(msg.id, 'message', val)}
                                />
                              </div>
                            </Reorder.Item>
                          ))}
                        </AnimatePresence>
                      </Reorder.Group>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show: { opacity: 1, y: 0 }
                  }}
                  className="space-y-6 pt-6 border-t border-border"
                >
                  {uploadStatus.stage !== 'idle' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-3 p-5 bg-muted rounded-2xl border border-border"
                    >
                      <div className="flex justify-between items-center text-xs font-medium">
                        <span className="text-foreground">{uploadStatus.message}</span>
                        {uploadStatus.progress !== undefined && <span className="text-foreground">{uploadStatus.progress}%</span>}
                      </div>
                      <Progress
                        value={uploadStatus.progress}
                        isIndeterminate={uploadStatus.progress === undefined}
                        classNames={{
                          base: "h-1.5",
                          indicator: "bg-theme-accent",
                          track: "bg-muted"
                        }}
                      />
                    </motion.div>
                  )}

                  <div className="flex gap-4">
                    <Button
                      size="lg"
                      className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 text-sm"
                      startContent={<FontAwesomeIcon icon={faSave} />}
                      onPress={() => handleSubmit(onSubmit)()}
                      isLoading={uploadStatus.stage === 'saving'}
                    >
                      Publish Quote
                    </Button>
                    <Button
                      as={Link}
                      href="/quotes"
                      variant="bordered"
                      size="lg"
                      className="px-8 h-12 rounded-xl border-border text-foreground hover:bg-muted font-medium text-sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </PageShell>
  );
}
