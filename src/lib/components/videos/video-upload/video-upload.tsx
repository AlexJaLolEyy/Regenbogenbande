"use client"

import { createVideo } from "@/src/app/(content)/videos/(detail)/upload/actions";
import { getAllCategories, getAllSelectableParticipants } from "@/src/lib/actions/data-fetching";
import { scrapeMedalClip } from "@/src/lib/actions/medal-upload";
import { useSession } from "@/src/lib/auth-client";
import { queryKeys } from "@/src/lib/queries/query-keys";
import { Category, User, VideoUploadForm } from "@/src/lib/types/types";
import { formatDuration, formatFileSize } from "@/src/lib/utils/format";
import {
  faCloudArrowUp,
  faFilm,
  faInfoCircle,
  faLink,
  faTimes
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Avatar,
  Button,
  Checkbox,
  Chip,
  DateInput,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Progress,
  Select,
  SelectItem,
  Tab,
  Tabs,
  Textarea
} from "@heroui/react";
import { fromDate, getLocalTimeZone } from "@internationalized/date";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { createFile } from 'mp4box';
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { GlassDropZone } from "../../ui/glass-drop-zone";
import { PageShell } from "../../ui/page-shell";

export default function VideoUpload() {
  const { data: session, isPending: isSessionPending } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    reset,
    control,
    formState: { errors },
  } = useForm<VideoUploadForm>({
    defaultValues: {
      participants: [],
    }
  })

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
    }
  }, [session, setValue]);

  // Mode State
  const [uploadMode, setUploadMode] = useState<"file" | "link">("file");
  const [linkUrl, setLinkUrl] = useState("");
  const [isScraping, setIsScraping] = useState(false);

  const [preview, setPreview] = useState<File | null>(null);
  const [creationDate, setCreationDate] = useState<Date | null>(null);
  const [participants, setParticipants] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [manualDateOverride, setManualDateOverride] = useState(false);
  const [qualityMode, setQualityMode] = useState(false);

  // Progress tracking
  const [uploadStatus, setUploadStatus] = useState<{
    stage: 'idle' | 'compressing' | 'uploading' | 'saving' | 'done' | 'error';
    progress?: number;
    message: string;
  }>({ stage: 'idle', message: '' });


  // Metadata for preview (applies to both file and link)
  const [videoMetadata, setVideoMetadata] = useState<{
    duration?: number;
    size?: string;
    resolution?: string;
    videoUrl?: string; // For link preview
    thumbnailUrl?: string; // For link preview
  }>({});

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  useEffect(() => {
    getAllSelectableParticipants().then((p) => {
      setParticipants(p);
    });
    getAllCategories().then((cats) => {
      setCategories(cats);
    });
    if (creationDate && !manualDateOverride) {
      setValue('createdAt', creationDate);
    }
  }, [creationDate, setValue, manualDateOverride]);


  const getCreationDate = (file: File) => {
    if (file) {
      const fileReader = new FileReader();
      fileReader.readAsArrayBuffer(file);
      fileReader.addEventListener("load", () => {
        const buffer = fileReader.result as ArrayBuffer;
        const mp4boxBuffer = buffer as ArrayBuffer & { fileStart: number };
        mp4boxBuffer.fileStart = 0;
        const mp4boxFile = createFile();
        mp4boxFile.onError = console.error;
        mp4boxFile.onReady = function (info) {
          const defaultDate = new Date(1904, 0, 1);
          const isDefaultDate = info.created.getTime() === defaultDate.getTime();
          const isInvalidDate = isNaN(info.created.getTime());
          const isTooOld = info.created.getFullYear() < 1990;
          if (isDefaultDate || isInvalidDate || isTooOld) {
            setCreationDate(new Date(file.lastModified));
          } else {
            setCreationDate(info.created);
          }
        };
        mp4boxFile.appendBuffer(mp4boxBuffer);
        mp4boxFile.flush();
      })
    }
  }

  const handleFileChange = (file: File) => {
    if (file) {
      setPreview(file);
      getCreationDate(file);
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        setVideoMetadata({
          duration: video.duration,
          size: formatFileSize(file.size),
          resolution: `${video.videoWidth}x${video.videoHeight}`
        });
      };
      video.src = URL.createObjectURL(file);
      setValue("video", file, { shouldValidate: true });
    }
  };

  // Error Modal State
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleImportLink = async () => {
    if (!linkUrl) return;
    setIsScraping(true);

    try {
      const result = await scrapeMedalClip(linkUrl);
      if (result.success && result.data) {
        const { title, description, image, videoUrl, datePublished, fileSize, duration } = result.data;

        if (!videoUrl) {
          setErrorMessage("Could not extract video file! This link might be a Cloud Storage link or unsupported.");
          setErrorModalOpen(true);
          return;
        }

        const currentValues = getValues();
        let newDate = new Date();
        if (datePublished) {
          const parsed = new Date(datePublished);
          if (!isNaN(parsed.getTime())) newDate = parsed;
        }
        setCreationDate(newDate);

        reset({
          ...currentValues,
          title: title || "",
          description: description || "",
          createdAt: newDate,
          duration: duration ? Math.round(duration) : 0,
        });

        setVideoMetadata(prev => ({
          ...prev,
          videoUrl: videoUrl,
          thumbnailUrl: image || undefined,
          size: fileSize || "External",
          duration: duration ? Math.round(duration) : undefined
        }));

        setPreview(null);
      } else {
        setErrorMessage("Failed to import link. Please check if it's valid.");
        setErrorModalOpen(true);
      }
    } catch {
      setErrorMessage("An error occurred during import.");
      setErrorModalOpen(true);
    } finally {
      setIsScraping(false);
    }
  };

  const onSubmit: SubmitHandler<VideoUploadForm> = async (data) => {
    if (uploadMode === "file" && !preview) return;
    if (uploadMode === "link" && !videoMetadata.videoUrl) return;

    try {
      let videoPath = "";
      let thumbnailPath = "";

      if (uploadMode === "file" && preview) {
        setUploadStatus({ stage: 'compressing', message: 'Compressing video...' });

        const formData = new FormData();
        formData.append('video', preview);
        formData.append('title', data.title);
        formData.append('compress', "true");
        formData.append('qualityMode', qualityMode.toString());

        const uploadResponse = await fetch('/api/compress', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          setUploadStatus({ stage: 'error', message: 'File upload failed' });
          return;
        }

        setUploadStatus({ stage: 'uploading', message: 'Uploading to server...', progress: 50 });

        const uploadResult = await uploadResponse.json();

        videoPath = uploadResult.path;
        thumbnailPath = uploadResult.thumbnailPath;
      } else if (uploadMode === "link") {
        setUploadStatus({ stage: 'uploading', message: 'Importing to storage (R2)...', progress: 30 });

        const importResponse = await fetch('/api/upload-from-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoUrl: videoMetadata.videoUrl,
            thumbnailUrl: videoMetadata.thumbnailUrl,
            title: data.title
          }),
        });

        if (!importResponse.ok) {
          setUploadStatus({ stage: 'error', message: 'Failed to import files to storage' });
          return;
        }

        const importResult = await importResponse.json();
        videoPath = importResult.videoPath;
        thumbnailPath = importResult.thumbnailPath;
      }

      const { video: _video, thumbnail: _thumbnail, ...metadata } = data;
      const videoData = { ...metadata, id: "", uploadedAt: new Date() };

      await createVideo(videoData, videoPath, thumbnailPath);

      queryClient.invalidateQueries({ queryKey: queryKeys.videos.all });
      setUploadStatus({ stage: 'done', message: 'Upload complete!', progress: 100 });
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'digest' in error && typeof error.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT')) {
        return;
      }
      setUploadStatus({ stage: 'error', message: 'Error uploading video' });
    }
  }

  return (
    <PageShell variant="aurora">
      <div className="w-full h-full pt-24 pb-4 md:pb-8 px-4 md:px-8 min-h-screen">

        <Modal isOpen={errorModalOpen} onOpenChange={setErrorModalOpen} backdrop="blur">
          <ModalContent className="glass-panel border border-white/10 text-white bg-black/80">
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">Import Error</ModalHeader>
                <ModalBody>
                  <p>{errorMessage}</p>
                </ModalBody>
                <ModalFooter>
                  <Button color="danger" variant="light" onPress={onClose}>
                    Close
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        {/* Fullscreen Preview Modal */}
        <Modal
          isOpen={isPreviewModalOpen}
          onOpenChange={setIsPreviewModalOpen}
          size="5xl"
          backdrop="blur"
          classNames={{
            base: "bg-[#050505]/90 border border-white/10",
            header: "border-b border-white/5",
            body: "p-0",
          }}
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="text-white">Video Preview</ModalHeader>
                <ModalBody>
                  <div className="aspect-video bg-black flex items-center justify-center">
                    <video
                      src={uploadMode === 'file' && preview ? URL.createObjectURL(preview) : videoMetadata.videoUrl}
                      controls
                      className="w-full h-full"
                    />
                  </div>
                </ModalBody>
              </>
            )}
          </ModalContent>
        </Modal>

        <div className="flex flex-col xl:flex-row gap-8 xl:items-stretch max-w-400 mx-auto">
          {/* Left Box: Upload & Preview */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="w-full xl:w-[55%] flex flex-col gap-6"
          >
            <div className="flex-1 bg-[#050505]/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group hover:border-purple-500/30 transition-all duration-500 flex flex-col">
              <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-purple-500/20 to-transparent" />

              <div className="flex justify-center mb-8">
                <Tabs
                  aria-label="Upload Method"
                  radius="full"
                  variant="bordered"
                  selectedKey={uploadMode}
                  onSelectionChange={(k) => {
                    setUploadMode(k as "file" | "link");
                    if (k === 'file') {
                      setVideoMetadata(prev => ({ ...prev, videoUrl: undefined, thumbnailUrl: undefined }));
                    } else {
                      setPreview(null);
                    }
                  }}
                  classNames={{
                    tabList: "bg-black/40 border border-white/10 backdrop-blur-md p-1",
                    cursor: "bg-purple-600 shadow-[0_0_15px_rgba(168,85,247,0.5)]",
                    tabContent: "text-white/60 group-data-[selected=true]:text-white font-bold"
                  }}
                >
                  <Tab key="file" title={<div className="flex items-center gap-2 px-2"><FontAwesomeIcon icon={faCloudArrowUp} /><span>File Upload</span></div>} />
                  <Tab key="link" title={<div className="flex items-center gap-2 px-2"><FontAwesomeIcon icon={faLink} /><span>Medal.tv Link</span></div>} />
                </Tabs>
              </div>

              <div className="relative flex-1 bg-black/40 rounded-3xl overflow-hidden border border-white/5 group/preview flex flex-col">
                <AnimatePresence mode="wait">
                  {uploadMode === "file" ? (
                    <motion.div
                      key="file-upload"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full h-full"
                    >
                      {preview ? (
                        <div className="w-full h-full relative flex items-center justify-center">
                          <video src={URL.createObjectURL(preview)} controls className="max-w-full max-h-full object-contain" />
                          <button
                            onClick={() => setPreview(null)}
                            className="absolute top-4 right-4 w-10 h-10 bg-black/60 hover:bg-red-500/80 text-white rounded-full flex items-center justify-center transition-all z-50 backdrop-blur-md border border-white/10 opacity-0 group-hover/preview:opacity-100"
                          >
                            <FontAwesomeIcon icon={faTimes} />
                          </button>
                        </div>
                      ) : (
                        <GlassDropZone
                          onFileSelect={handleFileChange}
                          title="Upload Video"
                          subtitle="MP4, WebM (Max 500MB)"
                          className="w-full h-full border-none bg-transparent hover:bg-white/5 transition-colors"
                        />
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="link-import"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full h-full flex flex-col items-center justify-center p-8"
                    >
                      {videoMetadata.videoUrl ? (
                        <div className="w-full h-full relative flex items-center justify-center">
                          <video src={videoMetadata.videoUrl} poster={videoMetadata.thumbnailUrl} controls className="max-w-full max-h-full object-contain" />
                          <button
                            onClick={() => setVideoMetadata(prev => ({ ...prev, videoUrl: undefined }))}
                            className="absolute top-4 right-4 w-10 h-10 bg-black/60 hover:bg-red-500/80 text-white rounded-full flex items-center justify-center transition-all z-50 backdrop-blur-md border border-white/10"
                          >
                            <FontAwesomeIcon icon={faTimes} />
                          </button>
                        </div>
                      ) : (
                        <div className="w-full max-w-sm space-y-6 text-center">
                          <div className="w-20 h-20 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4 border border-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.1)]">
                            <FontAwesomeIcon icon={faLink} className="text-3xl text-purple-400" />
                          </div>
                          <h3 className="text-xl font-bold text-white">Import from Medal.tv</h3>
                          <div className="flex flex-col gap-3">
                            <Input
                              placeholder="https://medal.tv/clip/..."
                              value={linkUrl}
                              onValueChange={setLinkUrl}
                              variant="bordered"
                              classNames={{
                                inputWrapper: "bg-white/5 border-white/10 h-14 hover:border-purple-500/30 transition-colors focus-within:!border-purple-500/50",
                                input: "text-white placeholder:text-white/20"
                              }}
                            />
                            <Button
                              type="button"
                              color="secondary"
                              size="lg"
                              onPress={handleImportLink}
                              isLoading={isScraping}
                              className="h-12 font-bold bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-900/20 text-sm"
                            >
                              Import Clip
                            </Button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Video Info Strip - Moved below preview */}
              <AnimatePresence>
                {(preview || videoMetadata.videoUrl) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mt-6 flex flex-wrap gap-4 justify-center"
                  >
                    <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                      <span className="text-[10px] uppercase tracking-wider text-white/30 font-bold">Size</span>
                      <span className="text-sm text-purple-300 font-mono">{videoMetadata.size || '...'}</span>
                    </div>
                    <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                      <span className="text-[10px] uppercase tracking-wider text-white/30 font-bold">Resolution</span>
                      <span className="text-sm text-purple-300 font-mono">{videoMetadata.resolution || '...'}</span>
                    </div>
                    <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                      <span className="text-[10px] uppercase tracking-wider text-white/30 font-bold">Duration</span>
                      <span className="text-sm text-purple-300 font-mono">{videoMetadata.duration ? formatDuration(videoMetadata.duration) : '...'}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="flat"
                      className="bg-purple-500/20 text-purple-300 border border-purple-500/20 px-4 h-9 font-bold"
                      onPress={() => setIsPreviewModalOpen(true)}
                    >
                      Fullscreen Preview
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="bg-[#1A1A1A]/40 backdrop-blur-xl border border-white/10 rounded-4xl p-6 flex flex-col justify-center min-h-35">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0 border border-purple-500/20 text-purple-400">
                  <FontAwesomeIcon icon={faInfoCircle} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">Processing Info</h4>
                  <p className="text-xs text-white/50 leading-relaxed">
                    {uploadMode === 'file'
                      ? "Videos are automatically compressed using specialized codecs for optimal web performance without visible quality loss."
                      : "Medal clips are already optimized. We'll import the source file directly to our secure storage."}
                  </p>
                </div>
              </div>

              {uploadMode === 'file' && (
                <div className="pt-2 pl-14">
                  <Checkbox
                    isSelected={qualityMode}
                    onValueChange={setQualityMode}
                    size="sm"
                    classNames={{ label: "text-white/70 text-xs font-bold", wrapper: "after:bg-purple-600" }}
                  >
                    Enable High Quality Mode (Maximum Bitrate)
                  </Checkbox>
                </div>
              )}
            </div>
          </motion.div>

          {/* Right Box: Metadata Form */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="w-full xl:w-[45%] flex"
          >
            <div className="flex-1 bg-[#050505]/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 lg:p-10 shadow-2xl relative group hover:border-purple-500/30 transition-all duration-500 flex flex-col">
              <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-purple-500/20 to-transparent" />

              <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
                <FontAwesomeIcon icon={faFilm} className="text-white/40 text-sm" />
                Clip Metadata
              </h2>

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
                className="space-y-8"
              >
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show: { opacity: 1, y: 0 }
                  }}
                  className="flex flex-col md:flex-row gap-6"
                >
                  <div className="md:w-2/3">
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
                          placeholder="e.g. Wieso hat der ne lilane RPG?"
                          isRequired
                          isInvalid={!!errors.title}
                          errorMessage="Title is required"
                          classNames={{
                            inputWrapper: "bg-white/5 border-white/10 h-14 hover:border-purple-500/30 transition-all focus-within:!border-purple-500/50",
                            input: "text-white placeholder:text-white/20",
                            label: "text-sm font-medium text-white/50"
                          }}
                        />
                      )}
                    />
                  </div>
                  <div className="md:w-1/3">
                    <Select
                      label="Category"
                      variant="bordered"
                      labelPlacement="outside"
                      placeholder="Select Category"
                      isRequired
                      classNames={{
                        trigger: "bg-white/5 border-white/10 h-14 hover:border-purple-500/30 transition-all focus-within:!border-purple-500/50",
                        label: "text-sm font-medium text-white/50",
                        value: "text-white font-medium"
                      }}
                      {...register("categoryId", { required: true })}
                      items={categories}
                      renderValue={(items) => {
                        return items.map((item) => {
                          const category = categories.find(c => c.id === item.key);
                          return (
                            <div key={item.key} className="flex items-center gap-2">
                              {category?.iconUrl && (
                                <Avatar src={category.iconUrl} className="w-5 h-5" />
                              )}
                              <span>{item.textValue}</span>
                            </div>
                          );
                        });
                      }}
                    >
                      {(category) => (
                        <SelectItem
                          key={category.id}
                          textValue={category.name}
                          startContent={category.iconUrl ? <Avatar src={category.iconUrl} alt="" className="w-5 h-5" /> : undefined}
                        > 
                          {category.name}
                        </SelectItem>
                      )}
                    </Select>
                  </div>
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
                        placeholder="Tell the story behind this clip..."
                        minRows={4}
                        classNames={{
                          inputWrapper: "bg-white/5 border-white/10 hover:border-purple-500/30 transition-all focus-within:!border-purple-500/50",
                          input: "text-white leading-relaxed placeholder:text-white/20",
                          label: "text-sm font-medium text-white/50"
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
                  className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/50">Uploaded By</label>
                    <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-2xl h-14">
                      {isSessionPending ? (
                        <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                      ) : session?.user ? (
                        <>
                          <Avatar src={session.user.image || undefined} size="sm" className="w-8 h-8 rounded-full border border-white/10" />
                          <span className="text-sm text-white font-bold truncate">{session.user.name}</span>
                        </>
                      ) : (
                        <span className="text-sm text-white/40 italic">Not logged in</span>
                      )}
                    </div>
                  </div>

                  <Select
                    label="Participants"
                    variant="bordered"
                    labelPlacement="outside"
                    placeholder="Involved creators"
                    selectionMode="multiple"
                    isRequired
                    isInvalid={!!errors.participants}
                    classNames={{
                      trigger: "bg-white/5 border-white/10 min-h-14 hover:border-purple-500/30 transition-all focus-within:!border-purple-500/50",
                      label: "text-sm font-medium text-white/50",
                      value: "text-white"
                    }}
                    {...register("participants", { required: true })}
                    items={participants}
                    isMultiline
                    renderValue={(items) => (
                      <div className="flex flex-wrap gap-1 py-1">
                        {items.map((item) => (
                          <Chip key={item.key} size="sm" variant="flat" className="bg-purple-500/20 text-purple-300 border border-purple-500/20 text-[10px] font-bold">
                            {item.textValue}
                          </Chip>
                        ))}
                      </div>
                    )}
                  >
                    {(participant) => (
                      <SelectItem key={participant.id} textValue={participant.username}>
                        <div className="flex items-center gap-2">
                          <Avatar size="sm" src={participant.profilePicture || undefined} className={participant.status === 'INVITED' ? 'bg-warning/20' : ''} />
                          <span className="font-normal">{participant.username}</span>
                          {participant.status === 'INVITED' && (
                            <Chip size="sm" variant="flat" color="warning" className="ml-auto h-5 text-[9px] font-bold uppercase">Pending</Chip>
                          )}
                        </div>
                      </SelectItem>
                    )}
                  </Select>
                </motion.div>

                <div className="flex-1" />

                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show: { opacity: 1, y: 0 }
                  }}
                  className="space-y-4 pt-4 border-t border-white/5"
                >
                  <Controller
                    name="createdAt"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <DateInput
                        {...field}
                        label="Event Date (Recorded At)"
                        variant="bordered"
                        labelPlacement="outside"
                        isRequired
                        isReadOnly={!manualDateOverride}
                        isInvalid={!!errors.createdAt}
                        classNames={{
                          inputWrapper: `bg-white/5 border-white/10 h-14 transition-all ${!manualDateOverride ? 'opacity-40 cursor-not-allowed' : 'hover:border-purple-500/30 focus-within:!border-purple-500/50'}`,
                          label: "text-sm font-medium text-white/50"
                        }}
                        value={field.value ? fromDate(field.value, getLocalTimeZone()) : null}
                        onChange={(date) => field.onChange(date ? (date).toDate() : new Date())}
                      />
                    )}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="light"
                    className="text-[10px] text-purple-400 font-bold uppercase tracking-tighter h-auto p-0 min-w-0 hover:text-purple-300 transition-colors"
                    onPress={() => setManualDateOverride(!manualDateOverride)}
                  >
                    {manualDateOverride ? "Reset to Auto-Detection" : "Change manual recorded date"}
                  </Button>
                </motion.div>

                {/* Progress & Actions */}
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show: { opacity: 1, y: 0 }
                  }}
                  className="space-y-6 pt-6"
                >
                  {uploadStatus.stage !== 'idle' && (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="space-y-3 p-5 bg-purple-500/5 rounded-3xl border border-purple-500/10 shadow-[0_0_20px_rgba(168,85,247,0.05)]"
                    >
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                        <span className="text-purple-300">{uploadStatus.message}</span>
                        {uploadStatus.progress !== undefined && (
                          <span className="text-purple-400">{uploadStatus.progress}%</span>
                        )}
                      </div>
                      <Progress
                        aria-label="Upload progress"
                        value={uploadStatus.progress}
                        isIndeterminate={uploadStatus.progress === undefined}
                        classNames={{
                          base: "h-1.5",
                          indicator: "bg-purple-500 shadow-[0_0_10px_#a855f7]",
                          track: "bg-white/5"
                        }}
                      />
                    </motion.div>
                  )}

                  <div className="flex gap-4">
                    <Button
                      color="secondary"
                      size="lg"
                      className="flex-1 font-black h-12 rounded-2xl bg-purple-600 hover:bg-purple-500 shadow-xl shadow-purple-900/30 text-sm uppercase tracking-wider"
                      startContent={<FontAwesomeIcon icon={faFilm} />}
                      onPress={() => handleSubmit(onSubmit)()}
                      isLoading={uploadStatus.stage !== 'idle' && uploadStatus.stage !== 'done' && uploadStatus.stage !== 'error'}
                    >
                      Publish Clip
                    </Button>
                    <Button
                      as={Link}
                      href="/videos"
                      variant="bordered"
                      size="lg"
                      className="px-10 h-12 rounded-2xl border-white/10 text-white hover:bg-white/5 font-bold uppercase text-[10px] tracking-widest"
                    >
                      Cancel
                    </Button>
                  </div>
                </motion.div>
              </motion.form>
            </div>
          </motion.div>
        </div>
      </div>
    </PageShell>
  );
}
