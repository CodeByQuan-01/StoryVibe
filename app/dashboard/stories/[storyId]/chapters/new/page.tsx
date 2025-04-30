"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/UseAuth";
import { useStories } from "@/lib/hooks/UseStories";
import { useChapters } from "@/lib/hooks/UseChapter";
import { ChapterForm } from "@/components/story/chapter-form";
import { Skeleton } from "@/components/ui/skeleton";
import type { Story } from "@/lib/types";

interface NewChapterPageProps {
  params: {
    storyId: string;
  };
}

export default function NewChapterPage({ params }: NewChapterPageProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { getStory, loading: storyLoading } = useStories();
  const { getChaptersByStory, loading: chaptersLoading } = useChapters();

  const [story, setStory] = useState<Story | null>(null);
  const [nextChapterOrder, setNextChapterOrder] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchStoryAndChapters = async () => {
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

        // Get chapters to determine the next chapter order
        const chapters = await getChaptersByStory(params.storyId);
        setNextChapterOrder(chapters.length + 1);
      } catch (err) {
        console.error("Error fetching story:", err);
        setError(
          "Failed to load story. It may have been removed or is unavailable."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStoryAndChapters();
  }, [params.storyId, user, getStory, getChaptersByStory, router]);

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

  if (error || !story) {
    return (
      <div className="container max-w-screen-xl mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Story Not Found</h1>
          <p className="text-gray-500">
            {error ||
              "This story could not be found or is no longer available."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-screen-xl mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">
          {`Add New Chapter to "{story.title}"`}
        </h1>
        <ChapterForm storyId={story.id} nextChapterOrder={nextChapterOrder} />
      </div>
    </div>
  );
}
