"use client";

import { useState } from "react";
import {
  collection,
  updateDoc,
  doc,
  query,
  where,
  getDocs,
  getDoc,
  increment,
  writeBatch,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import type { StoryRead, ChapterRead, ReadingStats } from "@/lib/types";

export function useReadTracking() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trackStoryView = async (storyId: string) => {
    if (!auth.currentUser) return;

    try {
      const batch = writeBatch(db);

      // Increment story read count
      const storyRef = doc(db, "stories", storyId);
      batch.update(storyRef, {
        readCount: increment(1),
        updatedAt: Date.now(),
      });

      // Check if user has read this story before
      const userReadQuery = query(
        collection(db, "storyReads"),
        where("storyId", "==", storyId),
        where("userId", "==", auth.currentUser.uid)
      );
      const userReadSnapshot = await getDocs(userReadQuery);

      if (userReadSnapshot.empty) {
        // First time reading - increment unique readers
        batch.update(storyRef, {
          uniqueReaders: increment(1),
        });

        // Create story read record
        const storyReadRef = doc(collection(db, "storyReads"));
        batch.set(storyReadRef, {
          storyId,
          userId: auth.currentUser.uid,
          readAt: Date.now(),
          chaptersRead: [],
          totalReadTime: 0,
          isCompleted: false,
        });
      }

      await batch.commit();
    } catch (err) {
      console.error("Error tracking story view:", err);
    }
  };

  const trackChapterRead = async (
    chapterId: string,
    storyId: string,
    readTime = 0,
    completed = true
  ) => {
    if (!auth.currentUser) return;

    setLoading(true);
    setError(null);

    try {
      const batch = writeBatch(db);

      // Increment chapter read count
      const chapterRef = doc(db, "chapters", chapterId);
      batch.update(chapterRef, {
        readCount: increment(1),
      });

      // Create or update chapter read record
      const chapterReadRef = doc(collection(db, "chapterReads"));
      batch.set(chapterReadRef, {
        chapterId,
        storyId,
        userId: auth.currentUser.uid,
        readAt: Date.now(),
        readTime,
        completed,
      });

      // Update story read record
      const userReadQuery = query(
        collection(db, "storyReads"),
        where("storyId", "==", storyId),
        where("userId", "==", auth.currentUser.uid)
      );
      const userReadSnapshot = await getDocs(userReadQuery);

      if (!userReadSnapshot.empty) {
        const storyReadDoc = userReadSnapshot.docs[0];
        const storyReadData = storyReadDoc.data() as StoryRead;

        const updatedChaptersRead = [
          ...new Set([...storyReadData.chaptersRead, chapterId]),
        ];

        batch.update(storyReadDoc.ref, {
          chaptersRead: updatedChaptersRead,
          lastChapterRead: chapterId,
          totalReadTime: (storyReadData.totalReadTime || 0) + readTime,
          readAt: Date.now(),
        });
      }

      await batch.commit();
    } catch (err) {
      console.error("Error tracking chapter read:", err);
      setError("Failed to track reading progress");
    } finally {
      setLoading(false);
    }
  };

  const getUserReadingProgress = async (
    storyId: string
  ): Promise<StoryRead | null> => {
    if (!auth.currentUser) return null;

    try {
      const userReadQuery = query(
        collection(db, "storyReads"),
        where("storyId", "==", storyId),
        where("userId", "==", auth.currentUser.uid)
      );
      const userReadSnapshot = await getDocs(userReadQuery);

      if (!userReadSnapshot.empty) {
        const doc = userReadSnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as StoryRead;
      }

      return null;
    } catch (err) {
      console.error("Error getting user reading progress:", err);
      return null;
    }
  };

  const getStoryReadingStats = async (
    storyId: string
  ): Promise<ReadingStats | null> => {
    try {
      // Get story document for basic stats
      const storyDoc = await getDoc(doc(db, "stories", storyId));
      if (!storyDoc.exists()) return null;

      const storyData = storyDoc.data();

      // Get all story reads
      const storyReadsQuery = query(
        collection(db, "storyReads"),
        where("storyId", "==", storyId)
      );
      const storyReadsSnapshot = await getDocs(storyReadsQuery);

      // Get all chapter reads for this story
      const chapterReadsQuery = query(
        collection(db, "chapterReads"),
        where("storyId", "==", storyId)
      );
      const chapterReadsSnapshot = await getDocs(chapterReadsQuery);

      // Calculate stats
      const totalReads = storyData.readCount || 0;
      const uniqueReaders = storyData.uniqueReaders || 0;

      let totalReadTime = 0;
      let completedReads = 0;

      storyReadsSnapshot.docs.forEach((doc) => {
        const data = doc.data() as StoryRead;
        totalReadTime += data.totalReadTime || 0;
        if (data.isCompleted) completedReads++;
      });

      const averageReadTime =
        uniqueReaders > 0 ? totalReadTime / uniqueReaders : 0;
      const completionRate =
        uniqueReaders > 0 ? (completedReads / uniqueReaders) * 100 : 0;

      // Get popular chapters
      const chapterReadCounts: {
        [key: string]: { count: number; title: string };
      } = {};

      chapterReadsSnapshot.docs.forEach((doc) => {
        const data = doc.data() as ChapterRead;
        if (!chapterReadCounts[data.chapterId]) {
          chapterReadCounts[data.chapterId] = { count: 0, title: "" };
        }
        chapterReadCounts[data.chapterId].count++;
      });

      // Get chapter titles
      const chaptersQuery = query(
        collection(db, "chapters"),
        where("storyId", "==", storyId)
      );
      const chaptersSnapshot = await getDocs(chaptersQuery);

      chaptersSnapshot.docs.forEach((doc) => {
        const chapterData = doc.data();
        if (chapterReadCounts[doc.id]) {
          chapterReadCounts[doc.id].title = chapterData.title;
        }
      });

      const popularChapters = Object.entries(chapterReadCounts)
        .map(([chapterId, data]) => ({
          chapterId,
          title: data.title,
          readCount: data.count,
        }))
        .sort((a, b) => b.readCount - a.readCount)
        .slice(0, 5);

      return {
        totalReads,
        uniqueReaders,
        averageReadTime,
        completionRate,
        popularChapters,
      };
    } catch (err) {
      console.error("Error getting story reading stats:", err);
      return null;
    }
  };

  const markStoryCompleted = async (storyId: string) => {
    if (!auth.currentUser) return;

    try {
      const userReadQuery = query(
        collection(db, "storyReads"),
        where("storyId", "==", storyId),
        where("userId", "==", auth.currentUser.uid)
      );
      const userReadSnapshot = await getDocs(userReadQuery);

      if (!userReadSnapshot.empty) {
        const storyReadDoc = userReadSnapshot.docs[0];
        await updateDoc(storyReadDoc.ref, {
          isCompleted: true,
          readAt: Date.now(),
        });
      }
    } catch (err) {
      console.error("Error marking story completed:", err);
    }
  };

  return {
    loading,
    error,
    trackStoryView,
    trackChapterRead,
    getUserReadingProgress,
    getStoryReadingStats,
    markStoryCompleted,
  };
}
