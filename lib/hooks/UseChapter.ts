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
  increment,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import type { Chapter } from "@/lib/types";

export function useChapters() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createChapter = async (
    chapter: Omit<
      Chapter,
      "id" | "createdAt" | "updatedAt" | "musicUrl" | "musicFilename"
    >,
    musicFile: File | null
  ) => {
    setLoading(true);
    setError(null);

    try {
      let musicUrl = "";
      let musicFilename = "";

      // Upload music file if provided
      if (musicFile) {
        const storageRef = ref(
          storage,
          `music/${chapter.storyId}/${Date.now()}_${musicFile.name}`
        );
        const snapshot = await uploadBytes(storageRef, musicFile);
        musicUrl = await getDownloadURL(snapshot.ref);
        musicFilename = musicFile.name;
      }

      // Create chapter document
      const chapterData = {
        ...chapter,
        musicUrl,
        musicFilename,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const docRef = await addDoc(collection(db, "chapters"), chapterData);

      // Update story chapter count
      await updateDoc(doc(db, "stories", chapter.storyId), {
        chapterCount: increment(1),
        updatedAt: Date.now(),
      });

      return { id: docRef.id, ...chapterData };
    } catch (err) {
      console.error("Error creating chapter:", err);
      setError("Failed to create chapter. Please try again.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateChapter = async (
    chapterId: string,
    chapterData: Partial<
      Omit<Chapter, "id" | "storyId" | "createdAt" | "updatedAt">
    >,
    musicFile?: File | null
  ) => {
    setLoading(true);
    setError(null);

    try {
      const chapterRef = doc(db, "chapters", chapterId);
      const chapterDoc = await getDoc(chapterRef);

      if (!chapterDoc.exists()) {
        throw new Error("Chapter not found");
      }

      const currentChapter = chapterDoc.data() as Chapter;
      let musicUrl = currentChapter.musicUrl;
      let musicFilename = currentChapter.musicFilename;

      // Handle music file update
      if (musicFile !== undefined) {
        // If musicFile is null, it means remove the current music
        if (musicFile === null && currentChapter.musicUrl) {
          try {
            const oldMusicRef = ref(storage, currentChapter.musicUrl);
            await deleteObject(oldMusicRef);
            musicUrl = "";
            musicFilename = "";
          } catch (err) {
            console.error("Error deleting old music file:", err);
          }
        }
        // If a new music file is provided, upload it
        else if (musicFile) {
          // Delete old music if it exists
          if (currentChapter.musicUrl) {
            try {
              const oldMusicRef = ref(storage, currentChapter.musicUrl);
              await deleteObject(oldMusicRef);
            } catch (err) {
              console.error("Error deleting old music file:", err);
            }
          }

          // Upload new music
          const storageRef = ref(
            storage,
            `music/${currentChapter.storyId}/${Date.now()}_${musicFile.name}`
          );
          const snapshot = await uploadBytes(storageRef, musicFile);
          musicUrl = await getDownloadURL(snapshot.ref);
          musicFilename = musicFile.name;
        }
      }

      // Update chapter document
      const updatedData = {
        ...chapterData,
        musicUrl,
        musicFilename,
        updatedAt: Date.now(),
      };

      await updateDoc(chapterRef, updatedData);

      // Update story updatedAt timestamp
      await updateDoc(doc(db, "stories", currentChapter.storyId), {
        updatedAt: Date.now(),
      });

      return { id: chapterId, ...currentChapter, ...updatedData };
    } catch (err) {
      console.error("Error updating chapter:", err);
      setError("Failed to update chapter. Please try again.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteChapter = async (chapterId: string) => {
    setLoading(true);
    setError(null);

    try {
      const chapterRef = doc(db, "chapters", chapterId);
      const chapterDoc = await getDoc(chapterRef);

      if (!chapterDoc.exists()) {
        throw new Error("Chapter not found");
      }

      const chapter = chapterDoc.data() as Chapter;

      // Delete music file if it exists
      if (chapter.musicUrl) {
        try {
          const musicRef = ref(storage, chapter.musicUrl);
          await deleteObject(musicRef);
        } catch (err) {
          console.error("Error deleting music file:", err);
        }
      }

      // Delete chapter document
      await deleteDoc(chapterRef);

      // Update story chapter count and updatedAt timestamp
      await updateDoc(doc(db, "stories", chapter.storyId), {
        chapterCount: increment(-1),
        updatedAt: Date.now(),
      });

      return true;
    } catch (err) {
      console.error("Error deleting chapter:", err);
      setError("Failed to delete chapter. Please try again.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getChapter = async (chapterId: string) => {
    setLoading(true);
    setError(null);

    try {
      const chapterDoc = await getDoc(doc(db, "chapters", chapterId));

      if (!chapterDoc.exists()) {
        throw new Error("Chapter not found");
      }

      return { id: chapterDoc.id, ...chapterDoc.data() } as Chapter;
    } catch (err) {
      console.error("Error getting chapter:", err);
      setError("Failed to load chapter. Please try again.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getChaptersByStory = async (storyId: string) => {
    setLoading(true);
    setError(null);

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
    } catch (err) {
      console.error("Error getting chapters by story:", err);
      setError("Failed to load chapters. Please try again.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createChapter,
    updateChapter,
    deleteChapter,
    getChapter,
    getChaptersByStory,
  };
}
