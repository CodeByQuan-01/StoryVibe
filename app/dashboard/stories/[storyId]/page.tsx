"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/hooks/UseAuth";
import { useStories } from "@/lib/hooks/UseStories";
import { useChapters } from "@/lib/hooks/UseChapter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChapterList } from "@/components/story/chapter-list";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  BookOpen,
  PenSquare,
  Eye,
  Trash,
  Music,
} from "lucide-react";
import type { Story, Chapter } from "@/lib/types";

interface StoryPageProps {
  params: {
    storyId: string;
  };
}

export default function StoryPage({ params }: StoryPageProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const {
    getStory,
    updateStory,
    deleteStory,
    loading: storyLoading,
  } = useStories();
  const { getChaptersByStory, loading: chaptersLoading } = useChapters();

  const [story, setStory] = useState<Story | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
  }, [params.storyId, user, getStory, getChaptersByStory, router]);

  const handleTogglePublish = async () => {
    if (!story) return;

    setIsPublishing(true);

    try {
      const updatedStory = await updateStory(story.id, {
        published: !story.published,
      });

      setStory(updatedStory);
    } catch (err) {
      console.error("Error toggling publish status:", err);
      setError("Failed to update story. Please try again.");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDeleteStory = async () => {
    if (!story) return;

    setIsDeleting(true);

    try {
      await deleteStory(story.id);
      router.push("/dashboard/stories");
    } catch (err) {
      console.error("Error deleting story:", err);
      setError("Failed to delete story. Please try again.");
      setIsDeleting(false);
    }
  };

  if (authLoading || !user || loading) {
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
            <Link href="/dashboard/stories">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Stories
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-screen-xl mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/dashboard/stories">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Stories
          </Link>
        </Button>

        <div className="relative w-full aspect-[21/9] rounded-lg overflow-hidden mb-8">
          {story.coverImage ? (
            <Image
              src={story.coverImage || "/placeholder.svg"}
              alt={story.title}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <BookOpen className="h-12 w-12 text-gray-400" />
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">{story.title}</h1>
            <div className="flex items-center mt-2">
              <Badge variant={story.published ? "default" : "outline"}>
                {story.published ? "Published" : "Draft"}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={`/dashboard/stories/${story.id}/edit`}>
                <PenSquare className="mr-2 h-4 w-4" />
                Edit Story
              </Link>
            </Button>

            <Button
              variant={story.published ? "outline" : "default"}
              onClick={handleTogglePublish}
              disabled={isPublishing || chapters.length === 0}
            >
              <Eye className="mr-2 h-4 w-4" />
              {isPublishing
                ? "Updating..."
                : story.published
                ? "Unpublish"
                : "Publish"}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    your story and all its chapters, including any uploaded
                    music files.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteStory}
                    className="bg-red-500 hover:bg-red-600"
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {story.published && (
              <Button asChild variant="outline">
                <Link href={`/stories/${story.id}`} target="_blank">
                  <Eye className="mr-2 h-4 w-4" />
                  View Public
                </Link>
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {story.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="prose max-w-none mb-8">
          <p className="text-lg">{story.description}</p>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Chapters</h2>
          <Button asChild>
            <Link href={`/dashboard/stories/${story.id}/chapters/new`}>
              <PenSquare className="mr-2 h-4 w-4" />
              Add Chapter
            </Link>
          </Button>
        </div>

        {chaptersLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          <ChapterList chapters={chapters} storyId={story.id} />
        )}

        {chapters.length === 0 && (
          <div className="text-center py-8 border rounded-md mt-4">
            <Music className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">No chapters yet</h3>
            <p className="text-gray-500 mb-6">
              Add chapters to your story and optionally include background
              music.
            </p>
            <Button asChild>
              <Link href={`/dashboard/stories/${story.id}/chapters/new`}>
                Create First Chapter
              </Link>
            </Button>
          </div>
        )}

        {!story.published && chapters.length > 0 && (
          <div className="mt-8 p-4 bg-gray-50 rounded-md border">
            <h3 className="font-medium mb-2">Ready to publish?</h3>
            <p className="text-gray-500 mb-4">
              Your story has {chapters.length}{" "}
              {chapters.length === 1 ? "chapter" : "chapters"} and is ready to
              be published.
            </p>
            <Button onClick={handleTogglePublish} disabled={isPublishing}>
              {isPublishing ? "Publishing..." : "Publish Story"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
