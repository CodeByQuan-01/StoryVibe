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
import { db } from "@/lib/firebase";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
  getPublicIdFromUrl,
} from "@/lib/cloudinary";
import type { Chapter } from "@/lib/types";

export function useChapters() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createChapter = async (
    chapter: Omit<
      Chapter,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "musicUrl"
      | "musicFilename"
      | "musicPublicId"
    >,
    musicFile: File | null
  ) => {
    setLoading(true);
    setError(null);

    try {
      let musicUrl = "";
      let musicFilename = "";
      let musicPublicId = "";

      // Upload music file to Cloudinary if provided
      if (musicFile) {
        const cloudinaryResponse = await uploadToCloudinary(
          musicFile,
          `storyvibe/music/${chapter.storyId}`,
          "video" // Cloudinary uses "video" resource type for audio files
        );
        musicUrl = cloudinaryResponse.url;
        musicPublicId = cloudinaryResponse.publicId;
        musicFilename = musicFile.name;
      }

      // Create chapter document
      const chapterData = {
        ...chapter,
        musicUrl,
        musicPublicId,
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
      let musicUrl = currentChapter.musicUrl || "";
      let musicFilename = currentChapter.musicFilename || "";
      let musicPublicId = currentChapter.musicPublicId || "";

      // Handle music file update
      if (musicFile !== undefined) {
        // If musicFile is null, it means remove the current music
        if (
          musicFile === null &&
          (currentChapter.musicUrl || currentChapter.musicPublicId)
        ) {
          try {
            // Delete from Cloudinary if we have the public ID
            if (currentChapter.musicPublicId) {
              await deleteFromCloudinary(currentChapter.musicPublicId, "video");
            } else if (currentChapter.musicUrl) {
              // Try to extract public ID from URL for legacy audio files
              const publicId = getPublicIdFromUrl(currentChapter.musicUrl);
              if (publicId) {
                await deleteFromCloudinary(publicId, "video");
              }
            }
            musicUrl = "";
            musicFilename = "";
            musicPublicId = "";
          } catch (err) {
            console.error("Error deleting old music file:", err);
          }
        }
        // If a new music file is provided, upload it
        else if (musicFile) {
          // Delete old music from Cloudinary if it exists
          if (currentChapter.musicPublicId) {
            try {
              await deleteFromCloudinary(currentChapter.musicPublicId, "video");
            } catch (err) {
              console.error("Error deleting old music file:", err);
            }
          } else if (currentChapter.musicUrl) {
            // Try to extract public ID from URL for legacy audio files
            const publicId = getPublicIdFromUrl(currentChapter.musicUrl);
            if (publicId) {
              try {
                await deleteFromCloudinary(publicId, "video");
              } catch (err) {
                console.error("Error deleting old music file:", err);
              }
            }
          }

          // Upload new music to Cloudinary
          const cloudinaryResponse = await uploadToCloudinary(
            musicFile,
            `storyvibe/music/${currentChapter.storyId}`,
            "video" // Cloudinary uses "video" resource type for audio files
          );
          musicUrl = cloudinaryResponse.url;
          musicPublicId = cloudinaryResponse.publicId;
          musicFilename = musicFile.name;
        }
      }

      // Update chapter document
      const updatedData = {
        ...chapterData,
        musicUrl,
        musicPublicId,
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

      // Delete music file from Cloudinary if it exists
      if (chapter.musicPublicId) {
        try {
          await deleteFromCloudinary(chapter.musicPublicId, "video");
        } catch (err) {
          console.error("Error deleting music file:", err);
        }
      } else if (chapter.musicUrl) {
        // Try to extract public ID from URL for legacy audio files
        const publicId = getPublicIdFromUrl(chapter.musicUrl);
        if (publicId) {
          try {
            await deleteFromCloudinary(publicId, "video");
          } catch (err) {
            console.error("Error deleting music file:", err);
          }
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
