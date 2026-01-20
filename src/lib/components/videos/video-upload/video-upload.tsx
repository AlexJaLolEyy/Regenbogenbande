"use client"

import { createVideo } from "@/src/app/(content)/videos/(detail)/upload/actions";
import { scrapeMedalClip } from "@/src/app/current-storage/medal-upload/actions";
import { getAllCategories, getAllSelectableParticipants } from "@/src/lib/actions/data-fetching";
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
      uploadedAt: new Date(),
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
      const videoData = { ...metadata, id: "" };

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
    <div className="w-full h-full px-4 md:px-12">

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

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-400 bg-[#050505]/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-2 overflow-hidden shadow-2xl relative mx-auto"
      >
        <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />

        <div className="flex flex-col lg:flex-row h-full">
          {/* Left Column: Upload Zone */}
          <div className="lg:w-[60%] bg-black/40 rounded-4xl m-2 relative group overflow-hidden border border-white/5 flex flex-col min-h-125">

            <div className="absolute top-6 inset-x-6 z-30 flex justify-center">
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
                classNames={{ tabList: "bg-black/80 border border-white/10 backdrop-blur-md", cursor: "bg-white/20", tabContent: "text-white/70 group-data-[selected=true]:text-white" }}
              >
                <Tab key="file" title={<div className="flex items-center gap-2"><FontAwesomeIcon icon={faCloudArrowUp} /><span>File Upload</span></div>} />
                <Tab key="link" title={<div className="flex items-center gap-2"><FontAwesomeIcon icon={faLink} /><span>Medal.tv Link</span></div>} />
              </Tabs>
            </div>

            <div className="flex-1 flex items-center justify-center p-8 relative pt-24">
              <AnimatePresence mode="wait">
                {uploadMode === "file" ? (
                  <motion.div
                    key="file-upload"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="w-full h-full"
                  >
                    {preview ? (
                      <div className="z-20 w-full h-full flex flex-col items-center justify-center animate-in fade-in duration-300">
                        <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 group/preview flex items-center justify-center">
                          <video src={URL.createObjectURL(preview)} controls className="max-w-full max-h-full object-contain" />
                          <button
                            onClick={() => setPreview(null)}
                            className="absolute top-4 right-4 w-8 h-8 bg-black/60 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition z-50 backdrop-blur-md border border-white/10 opacity-0 group-hover/preview:opacity-100"
                          >
                            <FontAwesomeIcon icon={faTimes} />
                          </button>
                          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-30">
                            <Chip size="sm" className="bg-black/60 backdrop-blur-md border border-white/10 text-white font-mono">{videoMetadata.size}</Chip>
                            <Chip size="sm" className="bg-black/60 backdrop-blur-md border border-white/10 text-white font-mono">{videoMetadata.resolution}</Chip>
                            <Chip size="sm" className="bg-black/60 backdrop-blur-md border border-white/10 text-white font-mono">{videoMetadata.duration ? formatDuration(videoMetadata.duration) : '...'}</Chip>
                          </div>
                        </div>
                        <div className="mt-6 text-center">
                          <h2 className="text-xl font-bold text-white mb-1 truncate max-w-md">{preview.name}</h2>
                          <p className="text-white/40 text-sm">Click the preview to change file</p>
                        </div>
                      </div>
                    ) : (
                      <motion.div
                        className="w-full h-full"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <GlassDropZone onFileSelect={handleFileChange} className="w-full h-full border-none bg-transparent hover:bg-white/5" />
                      </motion.div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="link-import"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="w-full max-w-md space-y-6 text-center"
                  >
                    {videoMetadata.videoUrl ? (
                      <div className="space-y-6">
                        <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 group/preview flex items-center justify-center">
                          <video src={videoMetadata.videoUrl} poster={videoMetadata.thumbnailUrl} controls className="max-w-full max-h-full object-contain" />
                          <button
                            onClick={() => setVideoMetadata(prev => ({ ...prev, videoUrl: undefined }))}
                            className="absolute top-4 right-4 w-8 h-8 bg-black/60 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition z-50 backdrop-blur-md border border-white/10"
                          >
                            <FontAwesomeIcon icon={faTimes} />
                          </button>
                        </div>
                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-400 flex items-center justify-center gap-2">
                          <span className="text-sm font-medium">✓ Medal clip imported successfully</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-24 h-24 rounded-full bg-[#FFB000]/10 flex items-center justify-center mx-auto mb-2">
                          <FontAwesomeIcon icon={faLink} className="text-4xl text-[#FFB000]" />
                        </div>
                        <h3 className="text-2xl font-bold text-white">Import from Medal.tv</h3>
                        <p className="text-white/40 text-sm">Paste your clip link below to auto-fill details.</p>
                        <div className="flex gap-2">
                          <Input
                            placeholder="https://medal.tv/clip/..."
                            value={linkUrl}
                            onValueChange={setLinkUrl}
                            classNames={{ inputWrapper: "bg-white/5 border-white/10 h-14", input: "text-white" }}
                          />
                          <Button color="primary" size="lg" onPress={handleImportLink} isLoading={isScraping} className="h-14 px-8 font-bold">
                            Import
                          </Button>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Column: Metadata form */}
          <div className="lg:w-[40%] p-8 lg:p-10 flex flex-col">
            <div className="flex-1 space-y-4">
              <h2 className="text-2xl font-bold text-white mb-2">Video Details</h2>

              <form className="space-y-4">
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
                      placeholder="Give your video a title"
                      isRequired
                      isInvalid={!!errors.title}
                      errorMessage="Title is required"
                      classNames={{ inputWrapper: "bg-white/5 border-white/10 h-12 hover:border-white/20 transition-colors", input: "text-white font-medium", label: "text-white/50" }}
                    />
                  )}
                />

                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      label="Description"
                      variant="bordered"
                      labelPlacement="outside"
                      placeholder="Describe what's happening..."
                      minRows={3}
                      classNames={{ inputWrapper: "bg-white/5 border-white/10 hover:border-white/20 transition-colors", input: "text-white", label: "text-white/50" }}
                    />
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
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
                        classNames={{ inputWrapper: "bg-white/5 border-white/10 h-12 opacity-50", label: "text-white/50" }}
                        value={field.value ? fromDate(field.value, getLocalTimeZone()) : null}
                        onChange={(date) => field.onChange(date ? (date).toDate() : new Date())}
                      />
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Category"
                    variant="bordered"
                    labelPlacement="outside"
                    placeholder="Select Category"
                    isRequired
                    classNames={{ trigger: "bg-white/5 border-white/10 h-12", label: "text-white/50", value: "text-white" }}
                    {...register("categoryId", { required: true })}
                    items={categories}
                  >
                    {(category) => (
                      <SelectItem key={category.id} textValue={category.name}>
                        {category.name}
                      </SelectItem>
                    )}
                  </Select>

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
                          classNames={{
                            inputWrapper: `bg-white/5 border-white/10 h-12 ${!manualDateOverride ? 'opacity-50' : ''}`,
                            label: "text-white/50"
                          }}
                          value={field.value ? fromDate(field.value, getLocalTimeZone()) : null}
                          onChange={(date) => field.onChange(date ? (date).toDate() : new Date())}
                        />
                      )}
                    />
                    <Button
                      size="sm"
                      variant="light"
                      className="text-[10px] text-white/40 h-auto p-0 min-w-0"
                      onPress={() => setManualDateOverride(!manualDateOverride)}
                    >
                      {manualDateOverride ? "Cancel manual override" : "I know the original Date and wanna change it"}
                    </Button>
                  </div>
                </div>

                <Select
                  label="Participants"
                  variant="bordered"
                  labelPlacement="outside"
                  placeholder="Who is in this video?"
                  selectionMode="multiple"
                  isRequired
                  isInvalid={!!errors.participants}
                  classNames={{ trigger: "bg-white/5 border-white/10 min-h-12", label: "text-white/50", value: "text-white" }}
                  {...register("participants", { required: true })}
                  items={participants}
                  isMultiline
                >
                  {(participant) => (
                    <SelectItem key={participant.id} textValue={participant.username}>
                      <div className="flex items-center gap-2">
                        <Avatar src={participant.profilePicture || undefined} size="sm" className={participant.status === 'INVITED' ? 'bg-warning/20' : ''} />
                        <span>{participant.username}</span>
                        {participant.status === 'INVITED' && (
                          <Chip size="sm" variant="flat" color="warning" className="ml-auto h-5 text-[10px]">Pending</Chip>
                        )}
                      </div>
                    </SelectItem>
                  )}
                </Select>
              </form>
            </div>

            {/* Action area fixed at bottom */}
            <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
              {/* Compression Info Panel */}
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                {uploadMode === 'file' ? (
                  <>
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <FontAwesomeIcon icon={faInfoCircle} className="text-primary-400" />
                      <span>Videos are automatically compressed for optimal streaming</span>
                    </div>
                    <Checkbox
                      isSelected={qualityMode}
                      onValueChange={setQualityMode}
                      size="sm"
                      classNames={{ label: "text-white/70 text-xs" }}
                    >
                      High Quality Mode (larger file, better detail)
                    </Checkbox>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <FontAwesomeIcon icon={faInfoCircle} className="text-green-400" />
                    <span>Medal clips are already optimized - no additional compression needed</span>
                  </div>
                )}
              </div>

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

              <div className="flex gap-4">
                <Button
                  color="primary"
                  size="lg"
                  className="flex-1 font-bold h-14 rounded-2xl shadow-lg shadow-primary/20"
                  startContent={<FontAwesomeIcon icon={faFilm} />}
                  onPress={() => handleSubmit(onSubmit)()}
                  isLoading={uploadStatus.stage !== 'idle' && uploadStatus.stage !== 'done' && uploadStatus.stage !== 'error'}
                >
                  Publish Video
                </Button>
                <Button
                  as={Link}
                  href="/videos"
                  variant="bordered"
                  size="lg"
                  className="px-8 h-14 rounded-2xl border-white/10 text-white hover:bg-white/5"
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
