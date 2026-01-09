"use client"

import { getAllCategories, getAllSelectableParticipants } from "@/src/app/current-storage/storage";
import { useSession } from "@/src/lib/auth-client";
import {
  faArrowUpFromBracket,
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
  Progress,
  Select,
  SelectItem,
  Textarea
} from "@heroui/react";
import { fromDate, getLocalTimeZone } from "@internationalized/date";
import EXIF from 'exif-js';
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import type { Category, Participant, UploadPicture, User } from "../../../types/types";
import { GlassDropZone } from "../../ui/glass-drop-zone";

export default function PictureUpload() {
  const { data: session, isPending: isSessionPending } = useSession();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<UploadPicture>({
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
      };
      setValue('uploadedBy', currentUser);
    }
  }, [session, setValue]);

  const [preview, setPreview] = useState<File | null>(null);
  const [creationDate, setCreationDate] = useState<Date | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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

  const onSubmit: SubmitHandler<UploadPicture> = async (data) => {
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
      
      const { img, ...metadata } = data;
      const pictureData = { ...metadata, id: "" };

      const { createPicture } = await import('@/src/app/(content)/pictures/(detail)/upload/actions');
      await createPicture(pictureData, imagePath, thumbnailPath);
      
      setUploadStatus({ stage: 'done', message: 'Upload complete!', progress: 100 });
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'digest' in error && typeof error.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT')) {
        return;
      }
      setUploadStatus({ stage: 'error', message: 'Error uploading picture' });
    }
  }

  return (
    <div className="w-full h-full px-4 md:px-12">
        
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-[1600px] bg-[#050505]/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-2 overflow-hidden shadow-2xl relative mx-auto"
      >
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="flex flex-col lg:flex-row h-full">
          {/* Left Column: Content Area */}
          <div className="lg:w-[60%] bg-black/40 rounded-[2rem] m-2 relative group overflow-hidden border border-white/5 flex flex-col min-h-[500px]">
            
            <div className="flex-1 flex items-center justify-center p-8 relative">
              <AnimatePresence mode="wait">
                {preview ? (
                  <motion.div 
                    key="preview"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="w-full h-full flex flex-col items-center justify-center relative"
                  >
                    <div className="relative w-full h-full flex items-center justify-center group/preview">
                      <img 
                        src={URL.createObjectURL(preview)} 
                        className="max-w-full max-h-[600px] object-contain shadow-2xl rounded-2xl border border-white/10"
                        alt="Preview"
                      />
                      <button
                        onClick={() => setPreview(null)}
                        className="absolute top-4 right-4 w-10 h-10 bg-black/60 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition z-50 backdrop-blur-md border border-white/10 opacity-0 group-hover/preview:opacity-100"
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                      
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-30">
                        <Chip size="sm" className="bg-black/60 backdrop-blur-md border border-white/10 text-white font-mono">{imageMetadata.size}</Chip>
                        <Chip size="sm" className="bg-black/60 backdrop-blur-md border border-white/10 text-white font-mono">{imageMetadata.resolution}</Chip>
                        <Chip size="sm" className="bg-black/60 backdrop-blur-md border border-white/10 text-white font-mono">{imageMetadata.format}</Chip>
                      </div>
                    </div>
                    
                    <div className="mt-6 text-center">
                      <h2 className="text-xl font-bold text-white mb-1 truncate max-w-md">{preview.name}</h2>
                      <p className="text-white/40 text-sm">Click the preview to change file</p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="dropzone"
                    className="w-full h-full"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <GlassDropZone 
                      onFileSelect={handleFileChange} 
                      accept="image/*"
                      title="Upload Image"
                      subtitle="JPEG, PNG, WebP (Max 50MB)"
                      className="w-full h-full border-none bg-transparent hover:bg-white/5" 
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Column: Metadata form */}
          <div className="lg:w-[40%] p-8 lg:p-10 flex flex-col">
            <div className="flex-1 space-y-4">
              <h2 className="text-2xl font-bold text-white mb-2">Image Details</h2>

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
                        placeholder="Give your picture a title"
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
                        placeholder="Tell the story..."
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
                          value={field.value ? fromDate(field.value, getLocalTimeZone()) as any : null}
                          onChange={(date) => field.onChange(date ? (date as any).toDate(getLocalTimeZone()) : new Date())}
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
                            label="Created At"
                            variant="bordered"
                            labelPlacement="outside"
                            isRequired
                            isReadOnly={!manualDateOverride}
                            isInvalid={!!errors.createdAt}
                            classNames={{ 
                              inputWrapper: `bg-white/5 border-white/10 h-12 ${!manualDateOverride ? 'opacity-50' : ''}`, 
                              label: "text-white/50" 
                            }}
                            value={field.value ? fromDate(field.value, getLocalTimeZone()) as any : null}
                            onChange={(date) => field.onChange(date ? (date as any).toDate(getLocalTimeZone()) : new Date())}
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
                    placeholder="Who is in this picture?"
                    selectionMode="multiple"
                    isRequired
                    isInvalid={!!errors.participants}
                    classNames={{ trigger: "bg-white/5 border-white/10 min-h-12", label: "text-white/50", value: "text-white" }}
                    {...register("participants", { required: true })}
                    items={participants}
                    isMultiline
                  >
                    {(participant) => (
                      <SelectItem key={participant.data.id} textValue={participant.data.username}>
                        <div className="flex items-center gap-2">
                          <Avatar src={participant.data.profilePicture || undefined} size="sm" className={participant.data.status === 'INVITED' ? 'bg-warning/20' : ''} />
                          <span>{participant.data.username}</span>
                          {participant.data.status === 'INVITED' && (
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
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <FontAwesomeIcon icon={faInfoCircle} className="text-primary-400" />
                    <span>Images are automatically optimized (PNG to WebP, JPEG compressed)</span>
                  </div>
                  <Checkbox
                    isSelected={qualityMode}
                    onValueChange={setQualityMode}
                    size="sm"
                    classNames={{ label: "text-white/70 text-xs" }}
                  >
                    Quality Mode (Q95) - better detail for artwork
                  </Checkbox>
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
                    startContent={<FontAwesomeIcon icon={faArrowUpFromBracket} />}
                    onPress={() => handleSubmit(onSubmit)()}
                    isLoading={uploadStatus.stage !== 'idle' && uploadStatus.stage !== 'done' && uploadStatus.stage !== 'error'}
                  >
                    Publish Picture
                  </Button>
                  <Button 
                    as={Link} 
                    href="/pictures" 
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
