"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AudioPlayer } from "@/components/music-player/audio-player";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Story, Chapter } from "@/lib/types";
import { JsonLd } from "@/components/seo/json-ld";

interface ChapterViewProps {
  story: Story;
  chapter: Chapter;
  prevChapter: Chapter | null;
  nextChapter: Chapter | null;
}

export function ChapterView({
  story,
  chapter,
  prevChapter,
  nextChapter,
}: ChapterViewProps) {
  const [readingTime, setReadingTime] = useState<number>(0);

  useEffect(() => {
    // Calculate estimated reading time
    const wordsPerMinute = 200;
    const wordCount = chapter.content.trim().split(/\s+/).length;
    const time = Math.ceil(wordCount / wordsPerMinute);
    setReadingTime(time);
  }, [chapter.content]);

  // Prepare structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Chapter",
    name: chapter.title,
    isPartOf: {
      "@type": "Book",
      name: story.title,
      url: `https://storyvibe.example.com/stories/${story.id}`,
    },
    author: {
      "@type": "Person",
      name: story.authorName,
    },
    datePublished: new Date(chapter.createdAt).toISOString().split("T")[0],
    dateModified: new Date(chapter.updatedAt).toISOString().split("T")[0],
    position: chapter.order,
    url: `https://storyvibe.example.com/stories/${story.id}/chapters/${chapter.id}`,
    timeRequired: `PT${readingTime}M`,
  };

  return (
    <>
      <JsonLd data={structuredData} />

      <div className="min-h-screen bg-white">
        {/* Navigation Bar */}
        <div className="sticky top-16 z-10 bg-white border-b">
          <div className="container max-w-3xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" asChild>
                <Link href={`/stories/${story.id}`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  <span>Back to Story</span>
                </Link>
              </Button>

              <div className="text-sm text-gray-500">
                <span>
                  Chapter {chapter.order} of {story.chapterCount}
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
                      <span>Previous</span>
                    </Link>
                  </Button>
                )}

                {nextChapter && (
                  <Button size="sm" asChild>
                    <Link
                      href={`/stories/${story.id}/chapters/${nextChapter.id}`}
                    >
                      <span>Next</span>
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
          <nav
            className="mt-12 flex justify-between items-center"
            aria-label="Chapter navigation"
          >
            {prevChapter ? (
              <Button variant="outline" asChild>
                <Link href={`/stories/${story.id}/chapters/${prevChapter.id}`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  <span>Previous Chapter</span>
                </Link>
              </Button>
            ) : (
              <div></div>
            )}

            {nextChapter ? (
              <Button asChild>
                <Link href={`/stories/${story.id}/chapters/${nextChapter.id}`}>
                  <span>Next Chapter</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button variant="outline" asChild>
                <Link href={`/stories/${story.id}`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  <span>Back to Story</span>
                </Link>
              </Button>
            )}
          </nav>
        </article>
      </div>
    </>
  );
}
