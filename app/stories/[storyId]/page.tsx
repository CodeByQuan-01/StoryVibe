"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useStories } from "@/lib/hooks/UseStories";
import { useChapters } from "@/lib/hooks/UseChapter";
import { Button } from "@/components/ui/button";
import { ChapterList } from "@/components/story/chapter-list";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, BookOpen } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import type { Story, Chapter } from "@/lib/types";

interface StoryPageProps {
  params: {
    storyId: string;
  };
}

export default function StoryPage({ params }: StoryPageProps) {
  const router = useRouter();
  const { getStory } = useStories();
  const { getChaptersByStory } = useChapters();

  const [story, setStory] = useState<Story | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStoryAndChapters = async () => {
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

        const chaptersData = await getChaptersByStory(params.storyId);
        setChapters(chaptersData);
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
  }, [params.storyId, getStory, getChaptersByStory, router]);

  // Prepare structured data for SEO
  const structuredData = story
    ? {
        "@context": "https://schema.org",
        "@type": "Book",
        name: story.title,
        description: story.description,
        author: {
          "@type": "Person",
          name: story.authorName,
        },
        datePublished: new Date(story.createdAt).toISOString().split("T")[0],
        dateModified: new Date(story.updatedAt).toISOString().split("T")[0],
        publisher: {
          "@type": "Organization",
          name: "StoryVibe",
        },
        genre: story.tags.join(", "),
        image: story.coverImage || "/og-image.png",
      }
    : null;

  if (loading) {
    return (
      <div className="container max-w-screen-xl mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-[300px] w-full rounded-lg mb-6" />
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-2/3 mb-6" />
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="container max-w-screen-xl mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Story Not Found</h1>
          <p className="text-gray-500 mb-6">
            {error ||
              "This story could not be found or is no longer available."}
          </p>
          <Button asChild>
            <Link href="/stories">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Stories
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {structuredData && <JsonLd data={structuredData} />}
      <div className="container max-w-screen-xl mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" asChild className="mb-6">
            <Link href="/stories">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Stories
            </Link>
          </Button>

          <article>
            <div className="relative w-full aspect-[21/9] rounded-lg overflow-hidden mb-8">
              {story.coverImage ? (
                <Image
                  src={story.coverImage || "/placeholder.svg"}
                  alt={story.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <BookOpen className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>

            <header>
              <h1 className="text-3xl font-bold mb-2">{story.title}</h1>
              <div className="flex items-center text-gray-500 mb-4">
                <span>By {story.authorName}</span>
                <span className="mx-2">•</span>
                <time dateTime={new Date(story.updatedAt).toISOString()}>
                  Updated{" "}
                  {formatDistanceToNow(story.updatedAt, { addSuffix: true })}
                </time>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {story.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </header>

            <div className="prose max-w-none mb-8">
              <p className="text-lg">{story.description}</p>
            </div>

            <div className="mt-8">
              <ChapterList chapters={chapters} storyId={story.id} />

              {chapters.length > 0 && (
                <div className="mt-6 flex justify-center">
                  <Button asChild>
                    <Link
                      href={`/stories/${story.id}/chapters/${chapters[0].id}`}
                    >
                      Start Reading
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </article>
        </div>
      </div>
    </>
  );
}
