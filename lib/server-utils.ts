import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Story, Chapter } from "@/lib/types";

// Server-side function to get a story
export async function getStory(storyId: string): Promise<Story | null> {
  try {
    const storyDoc = await getDoc(doc(db, "stories", storyId));

    if (!storyDoc.exists()) {
      return null;
    }

    return { id: storyDoc.id, ...storyDoc.data() } as Story;
  } catch (error) {
    console.error("Error getting story:", error);
    return null;
  }
}

// Server-side function to get a chapter
export async function getChapter(chapterId: string): Promise<Chapter | null> {
  try {
    const chapterDoc = await getDoc(doc(db, "chapters", chapterId));

    if (!chapterDoc.exists()) {
      return null;
    }

    return { id: chapterDoc.id, ...chapterDoc.data() } as Chapter;
  } catch (error) {
    console.error("Error getting chapter:", error);
    return null;
  }
}

// Server-side function to get chapters by story
export async function getChaptersByStory(storyId: string): Promise<Chapter[]> {
  try {
    const q = query(
      collection(db, "chapters"),
      where("storyId", "==", storyId),
      orderBy("order", "asc")
    );

    const querySnapshot = await getDocs(q);
    const chapters: Chapter[] = [];

    querySnapshot.forEach((doc) => {
      chapters.push({ id: doc.id, ...doc.data() } as Chapter);
    });

    return chapters;
  } catch (error) {
    console.error("Error getting chapters by story:", error);
    return [];
  }
}

// Server-side function to get all published stories
export async function getAllPublishedStories(): Promise<Story[]> {
  try {
    const q = query(
      collection(db, "stories"),
      where("published", "==", true),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    const stories: Story[] = [];

    querySnapshot.forEach((doc) => {
      stories.push({ id: doc.id, ...doc.data() } as Story);
    });

    return stories;
  } catch (error) {
    console.error("Error getting all published stories:", error);
    return [];
  }
}

// Server-side function to get featured stories
export async function getFeaturedStories(count = 3): Promise<Story[]> {
  try {
    // In a real application, you might have a "featured" field to query
    // For now, we'll just get the most recent published stories
    const q = query(
      collection(db, "stories"),
      where("published", "==", true),
      orderBy("createdAt", "desc"),
      limit(count)
    );

    const querySnapshot = await getDocs(q);
    const stories: Story[] = [];

    querySnapshot.forEach((doc) => {
      stories.push({ id: doc.id, ...doc.data() } as Story);
    });

    return stories;
  } catch (error) {
    console.error("Error getting featured stories:", error);
    // Return an empty array instead of throwing to prevent breaking the homepage
    return [];
  }
}
