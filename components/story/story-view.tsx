"use client";

import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChapterList } from "@/components/story/chapter-list";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen } from "lucide-react";
import type { Story, Chapter } from "@/lib/types";
import { JsonLd } from "@/components/seo/json-ld";

interface StoryViewProps {
  story: Story;
  chapters: Chapter[];
}

export function StoryView({ story, chapters }: StoryViewProps) {
  // Prepare structured data for SEO
  const structuredData = {
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
    url: `https://storyvibe.example.com/stories/${story.id}`,
    numberOfPages: chapters.length,
  };

  return (
    <>
      <JsonLd data={structuredData} />

      <div className="container max-w-screen-xl mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" asChild className="mb-6">
            <Link href="/stories">
              <ArrowLeft className="mr-2 h-4 w-4" />
              <span>Back to Stories</span>
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
                  <BookOpen
                    className="h-12 w-12 text-gray-400"
                    aria-hidden="true"
                  />
                </div>
              )}
            </div>

            <header>
              <h1 className="text-3xl font-bold mb-2">{story.title}</h1>
              <div className="flex items-center text-gray-500 mb-4">
                <span>By {story.authorName}</span>
                <span className="mx-2" aria-hidden="true">
                  •
                </span>
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

            <section className="mt-8" aria-labelledby="chapters-heading">
              <h2 id="chapters-heading" className="sr-only">
                Chapters
              </h2>
              <ChapterList chapters={chapters} storyId={story.id} />

              {chapters.length > 0 && (
                <div className="mt-6 flex justify-center">
                  <Button asChild>
                    <Link
                      href={`/stories/${story.id}/chapters/${chapters[0].id}`}
                    >
                      <span>Start Reading</span>
                    </Link>
                  </Button>
                </div>
              )}
            </section>
          </article>
        </div>
      </div>
    </>
  );
}
