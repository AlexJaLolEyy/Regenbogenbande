"use client"

import { createPicture } from "@/src/app/(content)/pictures/(detail)/upload/actions";
import { getAllCategories, getAllSelectableParticipants } from "@/src/lib/actions/data-fetching";
import { useSession } from "@/src/lib/auth-client";
import { queryKeys } from "@/src/lib/queries/query-keys";
import { formatFileSize } from "@/src/lib/utils/format";
import {
  faCircleUp,
  faImage,
  faInfoCircle,
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
  ModalHeader,
  Progress,
  Select,
  SelectItem,
  Textarea
} from "@heroui/react";
import { fromDate, getLocalTimeZone } from "@internationalized/date";
import { useQueryClient } from "@tanstack/react-query";
import EXIF from 'exif-js';
import { AnimatePresence, motion } from "motion/react";
import NextImage from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import type { Category, PictureUploadForm, User } from "../../../types/types";
import { GlassDropZone } from "../../ui/glass-drop-zone";
import { PageShell } from "../../ui/page-shell";

export default function PictureUpload() {
  const { data: session, isPending: isSessionPending } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<PictureUploadForm>({
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

  const [uploadStats, setUploadStats] = useState<{
    originalSize?: string;
    finalSize?: string;
    sizeReduction?: string;
    formatChanged?: boolean;
  }>({});

  const [imageMetadata, setImageMetadata] = useState<{
    size?: string;
    resolution?: string;
    format?: string;
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


  const handleFileChange = (file: File) => {
    if (file) {
      setPreview(file);

      // Extract basic metadata
      setImageMetadata({
        size: formatFileSize(file.size),
        format: file.type.split('/')[1].toUpperCase(),
      });

      // Extract creation date from EXIF (only for JPEG/JPG)
      if (file.type === "image/jpeg" || file.type === "image/jpg") {
        // @ts-expect-error - EXIF is not typed
        EXIF.getData(file, function () {
          // @ts-expect-error - EXIF is not typed
          const dateStr = EXIF.getTag(this, "DateTimeOriginal");
          if (dateStr) {
            const formattedDate = dateStr.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
            setCreationDate(new Date(formattedDate));
          } else {
            setCreationDate(new Date(file.lastModified))
          }
        });
      } else {
        setCreationDate(new Date(file.lastModified))
      }

      // Get resolution
      const img = new Image();
      img.onload = () => {
        setImageMetadata(prev => ({
          ...prev,
          resolution: `${img.width}x${img.height}`
        }));
      };
      img.src = URL.createObjectURL(file);
      setValue("img", file, { shouldValidate: true });
    }
  };

  const onSubmit: SubmitHandler<PictureUploadForm> = async (data) => {
    if (!preview) return;

    try {
      setUploadStatus({ stage: 'compressing', message: 'Optimizing image...' });

      const formData = new FormData();
      formData.append('image', preview);
      formData.append('title', data.title);
      formData.append('qualityMode', qualityMode.toString());

      const uploadResponse = await fetch('/api/upload-picture', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        setUploadStatus({ stage: 'error', message: 'Image upload failed' });
        return;
      }

      setUploadStatus({ stage: 'uploading', message: 'Uploading to server...', progress: 50 });

      const uploadResult = await uploadResponse.json();
      if (uploadResult.originalSize && uploadResult.finalSize) {
        setUploadStats({
          originalSize: formatFileSize(uploadResult.originalSize),
          finalSize: formatFileSize(uploadResult.finalSize),
          sizeReduction: uploadResult.reductionPercent || '0%',
          formatChanged: uploadResult.formatChanged,
        });
      }

      const imagePath = uploadResult.path;
      const thumbnailPath = uploadResult.thumbnailPath;

      setUploadStatus({ stage: 'saving', message: 'Saving metadata...', progress: 80 });

      const { img: _img, ...metadata } = data;
      const pictureData = { ...metadata, id: "" };

      await createPicture(pictureData, imagePath, thumbnailPath);

      queryClient.invalidateQueries({ queryKey: queryKeys.pictures.all });
      setUploadStatus({ stage: 'done', message: 'Upload complete!', progress: 100 });
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'digest' in error && typeof error.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT')) {
        return;
      }
      setUploadStatus({ stage: 'error', message: 'Error uploading picture' });
    }
  }

  return (
    <PageShell variant="aurora">
      <div className="w-full h-full pt-24 pb-4 md:pb-8 px-4 md:px-8 min-h-screen">

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
            {(onClose: () => void) => (
              <>
                <ModalHeader className="text-white">Image Preview</ModalHeader>
                <ModalBody>
                  <div className="bg-black flex items-center justify-center p-4">
                    {preview && (
                      <NextImage
                        src={URL.createObjectURL(preview)}
                        className="max-w-full max-h-[80vh] object-contain"
                        alt="Preview"
                        width={1920}
                        height={1080}
                      />
                    )}
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

              <div className="relative flex-1 bg-black/40 rounded-3xl overflow-hidden border border-white/5 group/preview flex flex-col min-h-125">
                <AnimatePresence mode="wait">
                  {preview ? (
                    <motion.div
                      key="preview"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full h-full flex flex-col items-center justify-center relative p-4"
                    >
                      <div className="relative w-full h-full flex items-center justify-center">
                        <NextImage
                          src={URL.createObjectURL(preview)}
                          className="max-w-full max-h-125 object-contain shadow-2xl rounded-2xl border border-white/10"
                          alt="Preview"
                          width={800}
                          height={800}
                        />
                        <button
                          onClick={() => setPreview(null)}
                          className="absolute top-4 right-4 w-10 h-10 bg-black/60 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition z-50 backdrop-blur-md border border-white/10 opacity-0 group-hover/preview:opacity-100"
                        >
                          <FontAwesomeIcon icon={faTimes} />
                        </button>
                      </div>

                      <div className="mt-6 flex flex-wrap gap-4 justify-center">
                        <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                          <span className="text-[10px] uppercase tracking-wider text-white/30 font-bold">Size</span>
                          <span className="text-sm text-purple-300 font-mono">{imageMetadata.size}</span>
                        </div>
                        <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                          <span className="text-[10px] uppercase tracking-wider text-white/30 font-bold">Resolution</span>
                          <span className="text-sm text-purple-300 font-mono">{imageMetadata.resolution}</span>
                        </div>
                        <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                          <span className="text-[10px] uppercase tracking-wider text-white/30 font-bold">Format</span>
                          <span className="text-sm text-purple-300 font-mono">{imageMetadata.format}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="flat"
                          className="bg-purple-500/20 text-purple-300 border border-purple-500/20 px-4 h-9 font-bold"
                          onPress={() => setIsPreviewModalOpen(true)}
                        >
                          Fullscreen Preview
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="dropzone"
                      className="w-full h-full"
                    >
                      <GlassDropZone
                        onFileSelect={handleFileChange}
                        accept="image/*"
                        title="Upload Picture"
                        subtitle="PNG, JPEG, WebP (Max 20MB)"
                        icon={faImage}
                        className="w-full h-full border-none bg-transparent hover:bg-white/5 transition-colors"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="bg-[#1A1A1A]/40 backdrop-blur-xl border border-white/10 rounded-4xl p-6 flex flex-col justify-center min-h-35">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0 border border-purple-500/20 text-purple-400">
                  <FontAwesomeIcon icon={faInfoCircle} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">Image Processing</h4>
                  <p className="text-xs text-white/50 leading-relaxed">
                    Images are automatically optimized and converted to modern formats like WebP or high-quality JPEG to ensure fast loading times without quality loss.
                  </p>
                </div>
              </div>

              <div className="pt-2 pl-14">
                <Checkbox
                  isSelected={qualityMode}
                  onValueChange={setQualityMode}
                  size="sm"
                  classNames={{ label: "text-white/70 text-xs font-bold", wrapper: "after:bg-purple-600" }}
                >
                  Enable High Quality Mode (Maximum Detail / Q95)
                </Checkbox>
              </div>
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
                <FontAwesomeIcon icon={faImage} className="text-white/40 text-sm" />
                Image Metadata
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
                className="space-y-8 flex-1 flex flex-col"
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
                          placeholder="e.g. Sunset over the Horizon"
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
                        placeholder="Tell the story behind this image..."
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
                    placeholder="Who is in this picture?"
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
                          <Avatar src={participant.profilePicture || undefined} className="w-6 h-6 border border-white/10" />
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
                        label="Date Taken"
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
                    {manualDateOverride ? "Reset to Auto-Detection" : "Change manual creation date"}
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
                      startContent={<FontAwesomeIcon icon={faCircleUp} />}
                      onPress={() => handleSubmit(onSubmit)()}
                      isLoading={uploadStatus.stage !== 'idle' && uploadStatus.stage !== 'done' && uploadStatus.stage !== 'error'}
                    >
                      Publish Image
                    </Button>
                    <Button
                      as={Link}
                      href="/pictures"
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
