// ============================================
// CORE ENTITIES (match Prisma output)
// ============================================

export interface User {
  id: string;
  username: string;
  profilePicture: string | null;
  status: 'INVITED' | 'ACTIVE' | 'DISABLED';
}

export interface Rating {
  userId: string;
  value: number;
}

export interface Comment {
  id: string;
  content: string;
  user: User;
  parentId: string | null;
  replies?: Comment[];
  upvotes: number;
  downvotes: number;
  userVote?: number; // Current user's vote: 1, -1, or undefined
  createdAt: Date;
}



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
  participants: User[];
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
  participants: User[];
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
  isContext: boolean;
}

export interface Quote {
  id: string;
  messages: QuoteMessage[];
  participants: User[];
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
  uploadedAt: Date;
  category: Category;
  uploadedBy: User;
  participants: User[];
  views: number;
  averageRating?: number;
  isSeen?: boolean;
  isPublic?: boolean;
  publishedAt?: Date | null;
}

export interface PictureListItem {
  id: string;
  title: string;
  thumbnailUrl: string;
  createdAt: Date;
  uploadedAt: Date;
  category: Category;
  uploadedBy: User;
  participants: User[];
  views: number;
  averageRating?: number;
  isSeen?: boolean;
  isPublic?: boolean;
  publishedAt?: Date | null;
}

export interface QuoteListItem {
  id: string;
  createdAt: Date;
  uploadedAt: Date;
  uploadedBy: User;
  participants: User[];
  messages: QuoteMessage[];
  views: number;
  averageRating?: number;
  isPublic?: boolean;
  publishedAt?: Date | null;
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

export interface VideoUploadForm {
  id?: string;
  title: string;
  description?: string;
  video: File;
  thumbnail: File;
  uploadedBy: User | string;
  uploadedAt: Date;
  createdAt: Date;
  participants: User[];
  categoryId: string;
  duration?: number;
}

export interface PictureUploadForm {
  id?: string;
  title: string;
  description?: string;
  img: File;
  uploadedBy: User | string;
  uploadedAt: Date;
  createdAt: Date;
  participants: User[];
  categoryId: string;
}

export interface QuoteUploadForm {
  id?: string;
  uploadedBy: User | string;
  uploadedAt: Date;
  createdAt: Date;
  messages: { id: string; userId: string; message: string; isContext?: boolean }[];
  participants: User[];
}
