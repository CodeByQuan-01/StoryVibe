"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStories } from "@/lib/hooks/UseStories";
import { useChapters } from "@/lib/hooks/UseChapter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AudioPlayer } from "@/components/music-player/audio-player";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import type { Story, Chapter } from "@/lib/types";

interface ChapterPageProps {
  params: {
    storyId: string;
    chapterId: string;
  };
}

export default function ChapterPage({ params }: ChapterPageProps) {
  const router = useRouter();
  const { getStory } = useStories();
  const { getChapter, getChaptersByStory } = useChapters();

  const [story, setStory] = useState<Story | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextChapter, setNextChapter] = useState<Chapter | null>(null);
  const [prevChapter, setPrevChapter] = useState<Chapter | null>(null);
  const [readingTime, setReadingTime] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const storyData = await getStory(params.storyId);

        if (!storyData) {
          setError("Story not found");
          setLoading(false);
          return;
        }

        setStory(storyData);

        if (!storyData.published) {
          router.push("/stories");
          return;
        }

        const chapterData = await getChapter(params.chapterId);

        if (!chapterData) {
          setError("Chapter not found");
          setLoading(false);
          return;
        }

        setChapter(chapterData);

        // Calculate reading time
        const wordsPerMinute = 200;
        const wordCount = chapterData.content.trim().split(/\s+/).length;
        const time = Math.ceil(wordCount / wordsPerMinute);
        setReadingTime(time);

        const chaptersData = await getChaptersByStory(params.storyId);
        setChapters(chaptersData);

        // Find current chapter index
        const currentIndex = chaptersData.findIndex(
          (c) => c.id === params.chapterId
        );

        // Set next and previous chapters
        if (currentIndex > 0) {
          setPrevChapter(chaptersData[currentIndex - 1]);
        } else {
          setPrevChapter(null);
        }

        if (currentIndex < chaptersData.length - 1) {
          setNextChapter(chaptersData[currentIndex + 1]);
        } else {
          setNextChapter(null);
        }
      } catch (err) {
        console.error("Error fetching chapter:", err);
        setError(
          "Failed to load chapter. It may have been removed or is unavailable."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [
    params.storyId,
    params.chapterId,
    getStory,
    getChapter,
    getChaptersByStory,
    router,
  ]);

  // Prepare structured data for SEO
  const structuredData =
    story && chapter
      ? {
          "@context": "https://schema.org",
          "@type": "Chapter",
          name: chapter.title,
          isPartOf: {
            "@type": "Book",
            name: story.title,
          },
          author: {
            "@type": "Person",
            name: story.authorName,
          },
          datePublished: new Date(chapter.createdAt)
            .toISOString()
            .split("T")[0],
          dateModified: new Date(chapter.updatedAt).toISOString().split("T")[0],
          position: chapter.order,
          timeRequired: `PT${readingTime}M`,
        }
      : null;

  if (loading) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-12">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-10 w-3/4 mb-6" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-8" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
      </div>
    );
  }

  if (error || !story || !chapter) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Chapter Not Found</h1>
          <p className="text-gray-500 mb-6">
            {error ||
              "This chapter could not be found or is no longer available."}
          </p>
          <Button asChild>
            <Link href={`/stories/${params.storyId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Story
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {structuredData && <JsonLd data={structuredData} />}
      <div className="min-h-screen bg-white">
        {/* Navigation Bar */}
        <div className="sticky top-16 z-10 bg-white border-b">
          <div className="container max-w-3xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" asChild>
                <Link href={`/stories/${story.id}`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Story
                </Link>
              </Button>

              <div className="text-sm text-gray-500">
                <span>
                  Chapter {chapter.order} of {chapters.length}
                </span>
                <span className="ml-2">•</span>
                <span className="ml-2">{readingTime} min read</span>
              </div>

              <div className="flex space-x-2">
                {prevChapter && (
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={`/stories/${story.id}/chapters/${prevChapter.id}`}
                    >
                      <ArrowLeft className="mr-1 h-4 w-4" />
                      Previous
                    </Link>
                  </Button>
                )}

                {nextChapter && (
                  <Button size="sm" asChild>
                    <Link
                      href={`/stories/${story.id}/chapters/${nextChapter.id}`}
                    >
                      Next
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Music Player (if available) */}
        {chapter.musicUrl && (
          <div className="sticky top-[104px] z-10 bg-white border-b">
            <div className="container max-w-3xl mx-auto px-4 py-2">
              <AudioPlayer
                audioUrl={chapter.musicUrl}
                title={chapter.musicFilename || "Chapter Music"}
                autoFade={true}
              />
            </div>
          </div>
        )}

        {/* Chapter Content */}
        <article className="container max-w-3xl mx-auto px-4 py-8">
          <header>
            <h1 className="text-3xl font-bold mb-6">{chapter.title}</h1>
          </header>

          <div className="prose max-w-none font-serif text-lg leading-relaxed">
            {chapter.content
              .split("\n")
              .map((paragraph, index) =>
                paragraph ? <p key={index}>{paragraph}</p> : <br key={index} />
              )}
          </div>

          {/* Chapter Navigation */}
          <nav className="mt-12 flex justify-between items-center">
            {prevChapter ? (
              <Button variant="outline" asChild>
                <Link href={`/stories/${story.id}/chapters/${prevChapter.id}`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous Chapter
                </Link>
              </Button>
            ) : (
              <div></div>
            )}

            {nextChapter ? (
              <Button asChild>
                <Link href={`/stories/${story.id}/chapters/${nextChapter.id}`}>
                  Next Chapter
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button variant="outline" asChild>
                <Link href={`/stories/${story.id}`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Story
                </Link>
              </Button>
            )}
          </nav>
        </article>
      </div>
    </>
  );
}
