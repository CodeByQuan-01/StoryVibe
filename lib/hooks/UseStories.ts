"use client";

import { useState } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  limit,
  startAfter,
  type DocumentSnapshot,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import type { Story } from "@/lib/types";

export function useStories() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createStory = async (
    story: Omit<Story, "id" | "createdAt" | "updatedAt" | "chapterCount">,
    coverImageFile: File | null
  ) => {
    setLoading(true);
    setError(null);

    try {
      let coverImageUrl = "";

      // Upload cover image if provided
      if (coverImageFile) {
        const storageRef = ref(
          storage,
          `covers/${Date.now()}_${coverImageFile.name}`
        );
        const snapshot = await uploadBytes(storageRef, coverImageFile);
        coverImageUrl = await getDownloadURL(snapshot.ref);
      }

      // Create story document
      const storyData = {
        ...story,
        coverImage: coverImageUrl,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        chapterCount: 0,
      };

      const docRef = await addDoc(collection(db, "stories"), storyData);
      return { id: docRef.id, ...storyData };
    } catch (err) {
      console.error("Error creating story:", err);
      setError("Failed to create story. Please try again.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateStory = async (
    storyId: string,
    storyData: Partial<Omit<Story, "id" | "createdAt" | "updatedAt">>,
    coverImageFile?: File | null
  ) => {
    setLoading(true);
    setError(null);

    try {
      const storyRef = doc(db, "stories", storyId);
      const storyDoc = await getDoc(storyRef);

      if (!storyDoc.exists()) {
        throw new Error("Story not found");
      }

      const currentStory = storyDoc.data() as Story;
      let coverImageUrl = currentStory.coverImage;

      // Upload new cover image if provided
      if (coverImageFile) {
        // Delete old image if it exists
        if (currentStory.coverImage) {
          try {
            const oldImageRef = ref(storage, currentStory.coverImage);
            await deleteObject(oldImageRef);
          } catch (err) {
            console.error("Error deleting old cover image:", err);
          }
        }

        // Upload new image
        const storageRef = ref(
          storage,
          `covers/${Date.now()}_${coverImageFile.name}`
        );
        const snapshot = await uploadBytes(storageRef, coverImageFile);
        coverImageUrl = await getDownloadURL(snapshot.ref);
      }

      // Update story document
      const updatedData = {
        ...storyData,
        coverImage: coverImageUrl,
        updatedAt: Date.now(),
      };

      await updateDoc(storyRef, updatedData);
      return { id: storyId, ...currentStory, ...updatedData };
    } catch (err) {
      console.error("Error updating story:", err);
      setError("Failed to update story. Please try again.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteStory = async (storyId: string) => {
    setLoading(true);
    setError(null);

    try {
      const storyRef = doc(db, "stories", storyId);
      const storyDoc = await getDoc(storyRef);

      if (!storyDoc.exists()) {
        throw new Error("Story not found");
      }

      const story = storyDoc.data() as Story;

      // Delete cover image if it exists
      if (story.coverImage) {
        try {
          const imageRef = ref(storage, story.coverImage);
          await deleteObject(imageRef);
        } catch (err) {
          console.error("Error deleting cover image:", err);
        }
      }

      // Delete all chapters
      const chaptersQuery = query(
        collection(db, "chapters"),
        where("storyId", "==", storyId)
      );
      const chaptersSnapshot = await getDocs(chaptersQuery);

      const deleteChapterPromises = chaptersSnapshot.docs.map(
        async (chapterDoc) => {
          const chapter = chapterDoc.data();

          // Delete chapter music if it exists
          if (chapter.musicUrl) {
            try {
              const musicRef = ref(storage, chapter.musicUrl);
              await deleteObject(musicRef);
            } catch (err) {
              console.error("Error deleting chapter music:", err);
            }
          }

          // Delete chapter document
          return deleteDoc(chapterDoc.ref);
        }
      );

      await Promise.all(deleteChapterPromises);

      // Delete story document
      await deleteDoc(storyRef);

      return true;
    } catch (err) {
      console.error("Error deleting story:", err);
      setError("Failed to delete story. Please try again.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getStory = async (storyId: string) => {
    setLoading(true);
    setError(null);

    try {
      const storyDoc = await getDoc(doc(db, "stories", storyId));

      if (!storyDoc.exists()) {
        throw new Error("Story not found");
      }

      return { id: storyDoc.id, ...storyDoc.data() } as Story;
    } catch (err) {
      console.error("Error getting story:", err);
      setError("Failed to load story. Please try again.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getStoriesByAuthor = async (authorId: string) => {
    setLoading(true);
    setError(null);

    try {
      const q = query(
        collection(db, "stories"),
        where("authorId", "==", authorId),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const stories: Story[] = [];

      querySnapshot.forEach((doc) => {
        stories.push({ id: doc.id, ...doc.data() } as Story);
      });

      return stories;
    } catch (err) {
      console.error("Error getting stories by author:", err);
      setError("Failed to load stories. Please try again.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getAllPublishedStories = async (
    lastDoc?: DocumentSnapshot,
    pageSize = 10
  ) => {
    setLoading(true);
    setError(null);

    try {
      let q = query(
        collection(db, "stories"),
        where("published", "==", true),
        orderBy("createdAt", "desc"),
        limit(pageSize)
      );

      if (lastDoc) {
        q = query(
          collection(db, "stories"),
          where("published", "==", true),
          orderBy("createdAt", "desc"),
          startAfter(lastDoc),
          limit(pageSize)
        );
      }

      const querySnapshot = await getDocs(q);
      const stories: Story[] = [];

      querySnapshot.forEach((doc) => {
        stories.push({ id: doc.id, ...doc.data() } as Story);
      });

      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

      return {
        stories,
        lastDoc: lastVisible,
        hasMore: querySnapshot.docs.length === pageSize,
      };
    } catch (err) {
      console.error("Error getting all published stories:", err);
      setError("Failed to load stories. Please try again.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const searchStories = async (searchTerm: string) => {
    setLoading(true);
    setError(null);

    try {
      // This is a simple implementation that searches by title
      // For a more robust search, consider using Firebase Extensions like Algolia
      const q = query(
        collection(db, "stories"),
        where("published", "==", true),
        orderBy("title"),
        // Firebase doesn't support direct text search, so we're using startAt and endAt
        // with the search term to find stories that start with the search term
        where("title", ">=", searchTerm),
        where("title", "<=", searchTerm + "\uf8ff")
      );

      const querySnapshot = await getDocs(q);
      const stories: Story[] = [];

      querySnapshot.forEach((doc) => {
        stories.push({ id: doc.id, ...doc.data() } as Story);
      });

      return stories;
    } catch (err) {
      console.error("Error searching stories:", err);
      setError("Failed to search stories. Please try again.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createStory,
    updateStory,
    deleteStory,
    getStory,
    getStoriesByAuthor,
    getAllPublishedStories,
    searchStories,
  };
}
