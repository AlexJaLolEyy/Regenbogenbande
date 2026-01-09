"use client";

import { createQuote } from "@/src/app/(content)/quotes/(detail)/upload/actions";
import { getAllSelectableParticipants } from "@/src/app/current-storage/storage";
import { useSession } from "@/src/lib/auth-client";
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
  Button,
  Chip,
  DateInput,
  Progress,
  Select,
  SelectItem,
  Textarea
} from "@heroui/react";
import { fromDate, getLocalTimeZone } from "@internationalized/date";
import { AnimatePresence, motion, Reorder } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import type { Participant, User } from "../../../types/types";

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
  participants: Participant[];
}

export default function QuoteUpload() {
  const { data: session, isPending: isSessionPending } = useSession();
  const router = useRouter();

  const [participants, setParticipants] = useState<Participant[]>([]);

  const {
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<QuoteFormData>({
    defaultValues: {
      uploadedAt: new Date(),
      createdAt: new Date(),
      messages: [{ id: '1', userId: "", message: "", isContext: false }],
      participants: [],
    }
  });

  const messages = watch("messages");

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
      };
      setValue('uploadedBy', currentUser);

      // If first message has no user, set to current user
      if (messages.length === 1 && !messages[0].userId) {
        const updatedMsgs = [...messages];
        updatedMsgs[0].userId = currentUser.id;
        setValue('messages', updatedMsgs);
      }
    }
  }, [session, setValue]);

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

  const handleReorder = (newOrder: Message[]) => {
    setValue("messages", newOrder);
  };

  const onSubmit: SubmitHandler<QuoteFormData> = async (data) => {
    const validMessages = data.messages.filter(msg => msg.userId && msg.message.trim());

    if (validMessages.length === 0) {
      return;
    }

    try {
      setUploadStatus({ stage: 'saving', message: 'Saving quote...', progress: 40 });

      // Automatically determine participants from message authors
      const uniqueAuthorIds = Array.from(new Set(data.messages.map(m => m.userId)));
      const selectedParticipants = participants.filter(p => uniqueAuthorIds.includes(p.data.id));

      const quoteData = {
        ...data,
        messages: validMessages.map(m => ({
          userId: m.userId,
          message: m.message
        })),
        participants: selectedParticipants,
      };

      await createQuote(quoteData);
      setUploadStatus({ stage: 'done', message: 'Quote saved!', progress: 100 });
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'digest' in error &&
        typeof error.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT')) {
        return;
      }
      setUploadStatus({ stage: 'error', message: 'Error saving quote' });
    }
  };

  const getParticipant = (id: string) => participants.find(p => p.data.id === id);

  return (
    <div className="w-full h-full px-4 md:px-12 pt-6">

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-[1600px] bg-[#050505]/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-2 overflow-hidden shadow-2xl relative mx-auto"
      >
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="flex flex-col lg:flex-row h-full min-h-[750px]">

          {/* Left Column: Live Preview */}
          <div className="lg:w-[45%] bg-black/40 rounded-[2rem] m-2 border border-white/5 flex flex-col overflow-hidden relative">
            <div className="p-6 border-b border-white/5 bg-black/20 backdrop-blur-md z-10 rounded-t-[2rem]">
              <h2 className="text-white font-bold flex items-center gap-2">
                <FontAwesomeIcon icon={faQuoteRight} className="text-primary-500" /> Preview
              </h2>
            </div>

            <div className="flex-1 p-8 space-y-6 overflow-y-auto custom-scrollbar max-h-[500px] bg-[url('/noise.png')] bg-opacity-5 relative">
              <AnimatePresence initial={false}>
                {messages.map((msg, idx) => {
                  const participant = getParticipant(msg.userId);
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

                  const displayName = participant ? participant.data.username : "Selecting...";
                  const profilePicture = participant?.data.profilePicture;

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, x: isLeft ? -20 : 20, y: 10 }}
                      animate={{ opacity: 1, x: 0, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className={`flex gap-3 ${!isLeft ? 'flex-row-reverse' : ''}`}
                    >
                      <Avatar
                        src={profilePicture || undefined}
                        className={`w-10 h-10 shrink-0 border-2 border-white/10 shadow-lg ${participant?.data.status === 'INVITED' ? 'bg-warning/20' : ''}`}
                        showFallback
                      />
                      <div className={`flex flex-col ${!isLeft ? 'items-end' : 'items-start'} max-w-[80%]`}>
                        <div className="text-[10px] font-bold text-white/40 mb-1 px-1 flex items-center gap-1">
                          {displayName}
                          {participant?.data.status === 'INVITED' && <span className="text-[8px] text-warning opacity-60">(Pending)</span>}
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

          {/* Right Column: Builder */}
          <div className="lg:w-[55%] p-8 lg:p-10 flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-2xl font-bold text-white">Redact Quote</h1>
              <div className="flex gap-2">
                <Chip variant="flat" className="bg-white/5 text-white/50 border border-white/5">
                  {messages.length} Items
                </Chip>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/50">Uploaded By</label>
                <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl h-12">
                  {isSessionPending ? (
                    <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  ) : session?.user ? (
                    <>
                      <Avatar src={session.user.image || undefined} size="sm" className="w-6 h-6" />
                      <span className="text-sm text-white">{session.user.name}</span>
                    </>
                  ) : (
                    <span className="text-sm text-white/40 italic">Not logged in</span>
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
                    classNames={{ inputWrapper: "bg-white/5 border-white/10 h-12 hover:border-white/20 transition-colors", label: "text-white/50" }}
                    value={field.value ? fromDate(field.value, getLocalTimeZone()) as any : null}
                    onChange={(date) => field.onChange(date ? (date as any).toDate(getLocalTimeZone()) : new Date())}
                  />
                )}
              />
            </div>

            {/* Message Manager List with Reorder */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 mb-6 space-y-3 min-h-0 max-h-[350px]">
              <div className="flex justify-between items-center sticky top-0 bg-[#070707]/80 backdrop-blur-md py-3 z-20">
                <h3 className="text-xs font-bold text-white/30 uppercase tracking-widest">
                  Conversation Flow
                </h3>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="flat"
                    className="bg-white/10 text-white font-medium h-9 px-4 rounded-xl"
                    startContent={<FontAwesomeIcon icon={faPlus} />}
                    onPress={() => addMessage(false)}
                  >
                    Message
                  </Button>
                  <Button
                    size="sm"
                    variant="flat"
                    className="bg-white/5 text-white/60 font-medium h-9 px-4 rounded-xl border border-white/5 hover:bg-white/10"
                    startContent={<FontAwesomeIcon icon={faInfoCircle} />}
                    onPress={() => addMessage(true)}
                  >
                    Context
                  </Button>
                </div>
              </div>

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
                              onChange={(e) => updateMessage(msg.id, 'userId', e.target.value)}
                              items={participants}
                              renderValue={() => {
                                const participant = participants.find(p => p.data.id === msg.userId);
                                if (!participant) return null;
                                return (
                                  <div className="flex items-center gap-2">
                                    <Avatar src={participant.data.profilePicture || undefined} size="sm" className={`w-5 h-5 ${participant.data.status === 'INVITED' ? 'bg-warning/20' : ''}`} />
                                    <span>{participant.data.username}</span>
                                  </div>
                                );
                              }}
                            >
                              {(p) => (
                                <SelectItem
                                  key={p.data.id}
                                  textValue={p.data.username}
                                  startContent={
                                    <Avatar src={p.data.profilePicture || undefined} size="sm" className={`w-5 h-5 ${p.data.status === 'INVITED' ? 'bg-warning/20' : ''}`} />
                                  }
                                >
                                  <div className="flex items-center gap-2">
                                    <span>{p.data.username}</span>
                                    {p.data.status === 'INVITED' && <Chip size="sm" variant="flat" color="warning" className="h-4 text-[8px]">Pending</Chip>}
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

            {/* Action Area */}
            <div className="pt-6 border-t border-white/10 space-y-4">
              {/* Progress Bar */}
              {uploadStatus.stage !== 'idle' && (
                <div className="space-y-2 p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/70">{uploadStatus.message}</span>
                    {uploadStatus.progress !== undefined && (
                      <span className="text-white/50">{uploadStatus.progress}%</span>
                    )}
                  </div>
                  <Progress
                    aria-label="Upload progress"
                    value={uploadStatus.progress}
                    isIndeterminate={uploadStatus.progress === undefined}
                    color={uploadStatus.stage === 'error' ? 'danger' : uploadStatus.stage === 'done' ? 'success' : 'primary'}
                    size="sm"
                  />
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-primary text-white font-bold h-14 rounded-2xl shadow-lg shadow-primary/20"
                  startContent={<FontAwesomeIcon icon={faSave} />}
                  onPress={() => handleSubmit(onSubmit)()}
                  isLoading={uploadStatus.stage === 'saving'}
                >
                  Save Quote
                </Button>
                <Button
                  as={Link}
                  href="/quotes"
                  variant="bordered"
                  className="px-8 h-14 rounded-2xl border-white/10 text-white hover:bg-white/5 font-medium"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
