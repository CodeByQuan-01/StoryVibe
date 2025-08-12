// User type definition
export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  isAdmin: boolean;
  createdAt: number;
}

// Story type definition
export interface Story {
  id: string;
  title: string;
  description: string;
  authorId: string;
  authorName: string;
  coverImage: string;
  coverImagePublicId?: string;
  tags: string[];
  published: boolean;
  createdAt: number;
  updatedAt: number;
  chapterCount: number;
  readCount?: number;
  uniqueReaders?: number;
}

// Chapter type definition
export interface Chapter {
  id: string;
  storyId: string;
  title: string;
  content: string;
  order: number;
  musicUrl?: string;
  musicPublicId?: string;
  musicFilename?: string;
  createdAt: number;
  updatedAt: number;
  readCount?: number;
}

// Audio player state
export interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
}

export interface StoryRead {
  id: string;
  storyId: string;
  userId: string;
  readAt: number;
  chaptersRead: string[];
  lastChapterRead?: string;
  totalReadTime: number;
  isCompleted: boolean;
}

export interface ChapterRead {
  id: string;
  chapterId: string;
  storyId: string;
  userId: string;
  readAt: number;
  readTime: number;
  completed: boolean;
}

export interface ReadingStats {
  totalReads: number;
  uniqueReaders: number;
  averageReadTime: number;
  completionRate: number;
  popularChapters: { chapterId: string; title: string; readCount: number }[];
}
