"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/UseAuth";
import { useStories } from "@/lib/hooks/UseStories";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StoryCard } from "@/components/story/story-card";
import { Skeleton } from "@/components/ui/skeleton";
import { PenSquare, BookOpen } from "lucide-react";
import type { Story } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { getStoriesByAuthor, loading: storiesLoading } = useStories();

  const [stories, setStories] = useState<Story[]>([]);
  const [publishedStories, setPublishedStories] = useState<Story[]>([]);
  const [draftStories, setDraftStories] = useState<Story[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchStories = async () => {
      if (!user) return;

      try {
        const userStories = await getStoriesByAuthor(user.id);
        setStories(userStories);

        setPublishedStories(userStories.filter((story) => story.published));
        setDraftStories(userStories.filter((story) => !story.published));
      } catch (err) {
        console.error("Error fetching stories:", err);
      }
    };

    fetchStories();
  }, [user, getStoriesByAuthor]);

  if (authLoading || !user) {
    return (
      <div className="container max-w-screen-xl mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-10 w-1/3 mb-6" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[200px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-screen-xl mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Welcome, {user.displayName}</h1>
        <p className="text-gray-500 mb-8">
          Manage your stories and chapters from your dashboard.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Create New Story</CardTitle>
              <CardDescription>
                Start writing a new story with chapters and music.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-24">
                <PenSquare className="h-12 w-12 text-gray-300" />
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/dashboard/stories/new">Create Story</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Your Stories</CardTitle>
              <CardDescription>
                You have {stories.length}{" "}
                {stories.length === 1 ? "story" : "stories"} in total.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <p className="text-3xl font-bold">
                    {publishedStories.length}
                  </p>
                  <p className="text-sm text-gray-500">Published</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">{draftStories.length}</p>
                  <p className="text-sm text-gray-500">Drafts</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/stories">View All Stories</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Your Stories</h2>

          {storiesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-[225px] w-full rounded-md" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          ) : stories.length > 0 ? (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="all">All Stories</TabsTrigger>
                <TabsTrigger value="published">Published</TabsTrigger>
                <TabsTrigger value="drafts">Drafts</TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {stories.map((story) => (
                    <Link
                      key={story.id}
                      href={`/dashboard/stories/${story.id}`}
                    >
                      <StoryCard story={story} showAuthor={false} />
                    </Link>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="published">
                {publishedStories.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {publishedStories.map((story) => (
                      <Link
                        key={story.id}
                        href={`/dashboard/stories/${story.id}`}
                      >
                        <StoryCard story={story} showAuthor={false} />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-medium mb-2">
                      No published stories
                    </h3>
                    <p className="text-gray-500 mb-6">
                      You haven&apos;t published any stories yet.
                    </p>
                    <Button asChild>
                      <Link href="/dashboard/stories/new">
                        Create Your First Story
                      </Link>
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="drafts">
                {draftStories.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {draftStories.map((story) => (
                      <Link
                        key={story.id}
                        href={`/dashboard/stories/${story.id}`}
                      >
                        <StoryCard story={story} showAuthor={false} />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <PenSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-medium mb-2">
                      No draft stories
                    </h3>
                    <p className="text-gray-500 mb-6">
                      You don&apos;t have any stories in draft.
                    </p>
                    <Button asChild>
                      <Link href="/dashboard/stories/new">
                        Create New Story
                      </Link>
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium mb-2">No stories yet</h3>
              <p className="text-gray-500 mb-6">
                You haven&apos;t created any stories yet. Start writing your
                first story now!
              </p>
              <Button asChild>
                <Link href="/dashboard/stories/new">
                  Create Your First Story
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
