export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  isAdmin?: boolean;
  createdAt: number;
}

export interface Story {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  coverImagePublicId?: string; // Added for Cloudinary
  authorId: string;
  authorName: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  published: boolean;
  chapterCount: number;
}

export interface Chapter {
  id: string;
  storyId: string;
  title: string;
  content: string;
  musicUrl?: string;
  musicPublicId?: string; // Added for Cloudinary
  musicFilename?: string;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export interface Comment {
  id: string;
  storyId: string;
  chapterId?: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: number;
}

// Cloudinary asset interface
export interface CloudinaryAsset {
  url: string;
  publicId: string;
}
