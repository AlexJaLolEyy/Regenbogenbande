// ============================================
// CORE ENTITIES (match Prisma output)
// ============================================

export interface User {
  id: string;
  username: string;
  profilePicture: string | null;
}

export interface Rating {
  userId: string;
  value: number;
}

export interface ParticipantPlaceholder {
  id: string;
  displayName: string;
  discordId: string | null;
  claimedById: string | null;
}

// Discriminated union for participants (User or Placeholder)
export interface UserParticipant {
  type: "user";
  data: User;
}

export interface PlaceholderParticipant {
  type: "placeholder";
  data: ParticipantPlaceholder;
}

export type Participant = UserParticipant | PlaceholderParticipant;

export interface Category {
  id: string;
  name: string;
  iconUrl: string | null;
}

export interface Video {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  thumbnailUrl: string;
  participants: Participant[];
  uploadedBy: User;
  uploadedAt: Date;
  createdAt: Date;
  views: number;
  category: Category;
  isPublic: boolean;
  publishedAt: Date | null;
  averageRating?: number;
}

export interface Picture {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  thumbnailUrl: string;
  participants: Participant[];
  uploadedBy: User;
  uploadedAt: Date;
  createdAt: Date;
  views: number;
  category: Category;
  isPublic: boolean;
  publishedAt: Date | null;
  averageRating?: number;
}

export interface QuoteMessage {
  id: string;
  message: string;
  user: User;
}

export interface Quote {
  id: string;
  messages: QuoteMessage[];
  participants: Participant[];
  uploadedBy: User;
  uploadedAt: Date;
  createdAt: Date;
  views: number;
  isPublic: boolean;
  publishedAt: Date | null;
  averageRating?: number;
}

// ============================================
// LIST TYPES (for performance - no heavy data)
// ============================================

export interface VideoListItem {
  id: string;
  title: string;
  thumbnailUrl: string;
  createdAt: Date;
  category: Category;
  isSeen?: boolean; // Computed at query time for current user
}

export interface PictureListItem {
  id: string;
  title: string;
  thumbnailUrl: string;
  createdAt: Date;
  category: Category;
  isSeen?: boolean; // Computed at query time for current user
}

export interface QuoteListItem {
  id: string;
  createdAt: Date;
  participants: Participant[];
}

// ============================================
// INPUT TYPES (for create/update actions)
// ============================================

export interface VideoCreateInput {
  title: string;
  description?: string;
  video: File;
  thumbnail: File;
  participantIds: string[];
  createdAt: Date;
  categoryId: string;
}

export interface VideoUpdateInput {
  title?: string;
  description?: string;
  participantIds?: string[];
  categoryId?: string;
}

export interface PictureCreateInput {
  title: string;
  description?: string;
  image: File;
  participantIds: string[];
  createdAt: Date;
  categoryId: string;
}

export interface PictureUpdateInput {
  title?: string;
  description?: string;
  participantIds?: string[];
  categoryId?: string;
}

export interface QuoteMessageInput {
  message: string;
  userId: string;
}

export interface QuoteCreateInput {
  messages: QuoteMessageInput[];
  participantIds: string[];
  createdAt: Date;
}

export interface QuoteUpdateInput {
  messages?: QuoteMessageInput[];
  participantIds?: string[];
}

export interface CategoryCreateInput {
  name: string;
  icon?: File;
}

export interface CategoryUpdateInput {
  name?: string;
  icon?: File;
}

// ============================================
// COMPATIBILITY TYPES (for existing components)
// ============================================

export interface UploadVideo {
  id?: string;
  title: string;
  description?: string;
  video: File;
  thumbnail: File;
  uploadedBy: User;
  uploadedAt: Date;
  createdAt: Date;
  participants: User[];
  categoryId: string;
  duration?: number;
}

export interface UploadPicture {
  id?: string;
  title: string;
  description?: string;
  img: File;
  uploadedBy: User;
  uploadedAt: Date;
  createdAt: Date;
  participants: User[];
  categoryId: string;
}

export interface UploadQuote {
  id?: string;
  title?: string;
  uploadedBy: User;
  uploadedAt: Date;
  createdAt: Date;
  messages: { userId: string; message: string }[];
  participants: User[];
}
