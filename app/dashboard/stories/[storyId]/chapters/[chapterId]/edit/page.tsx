"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/UseAuth";
import { useStories } from "@/lib/hooks/UseStories";
import { useChapters } from "@/lib/hooks/UseChapter";
import { ChapterForm } from "@/components/story/chapter-form";
import { Skeleton } from "@/components/ui/skeleton";
import type { Story, Chapter } from "@/lib/types";

interface EditChapterPageProps {
  params: {
    storyId: string;
    chapterId: string;
  };
}

export default function EditChapterPage({ params }: EditChapterPageProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { getStory, loading: storyLoading } = useStories();
  const { getChapter, loading: chapterLoading } = useChapters();

  const [story, setStory] = useState<Story | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchStoryAndChapter = async () => {
      if (!user) return;

      setLoading(true);
      setError(null);

      try {
        const storyData = await getStory(params.storyId);

        // Check if the user is the author
        if (storyData.authorId !== user.id) {
          router.push("/dashboard");
          return;
        }

        setStory(storyData);

        const chapterData = await getChapter(params.chapterId);

        // Check if the chapter belongs to the story
        if (chapterData.storyId !== params.storyId) {
          router.push(`/dashboard/stories/${params.storyId}`);
          return;
        }

        setChapter(chapterData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(
          "Failed to load chapter. It may have been removed or is unavailable."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStoryAndChapter();
  }, [params.storyId, params.chapterId, user, getStory, getChapter, router]);

  if (authLoading || !user || loading) {
    return (
      <div className="container max-w-screen-xl mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <Skeleton className="h-10 w-1/3 mb-6" />
          <Skeleton className="h-[500px] w-full rounded-md" />
        </div>
      </div>
    );
  }

  if (error || !story || !chapter) {
    return (
      <div className="container max-w-screen-xl mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Chapter Not Found</h1>
          <p className="text-gray-500">
            {error ||
              "This chapter could not be found or is no longer available."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-screen-xl mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">
          {`Edit Chapter "${chapter.title}"`}
        </h1>
        <ChapterForm storyId={story.id} chapter={chapter} isEditing={true} />
      </div>
    </div>
  );
}
