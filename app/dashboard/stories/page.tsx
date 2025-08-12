"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/UseAuth";
import { useStories } from "@/lib/hooks/UseStories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StoryCard } from "@/components/story/story-card";
import { Skeleton } from "@/components/ui/skeleton";
import { PenSquare, Search, BookOpen } from "lucide-react";
import type { Story } from "@/lib/types";

export default function StoriesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { getStoriesByAuthor, loading: storiesLoading } = useStories();

  const [stories, setStories] = useState<Story[]>([]);
  const [filteredStories, setFilteredStories] = useState<Story[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const fetchStories = useCallback(async () => {
    if (!user) return;

    try {
      const userStories = await getStoriesByAuthor(user.id);
      if (isMounted) {
        setStories(userStories);
        setFilteredStories(userStories);
      }
    } catch (err) {
      if (isMounted) {
        console.error("Error fetching stories:", err);
      }
    }
  }, [user, getStoriesByAuthor, isMounted]);

  useEffect(() => {
    if (isMounted) {
      fetchStories();
    }
  }, [fetchStories, isMounted]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredStories(stories);
    } else {
      const filtered = stories.filter(
        (story) =>
          story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          story.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          story.tags.some((tag) =>
            tag.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
      setFilteredStories(filtered);
    }
  }, [searchTerm, stories]);

  if (authLoading || !user) {
    return (
      <div className="container max-w-screen-xl mx-auto px-4 py-12">
        <Skeleton className="h-10 w-1/3 mb-6" />
        <div className="flex justify-between items-center mb-8">
          <Skeleton className="h-10 w-1/4" />
          <Skeleton className="h-10 w-1/4" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-[225px] w-full rounded-md" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-screen-xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Your Stories</h1>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search your stories..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Button asChild>
          <Link href="/dashboard/stories/new">
            <PenSquare className="mr-2 h-4 w-4" />
            Create New Story
          </Link>
        </Button>
      </div>

      {storiesLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-[225px] w-full rounded-md" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : filteredStories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStories.map((story) => (
            <Link key={story.id} href={`/dashboard/stories/${story.id}`}>
              <StoryCard story={story} showAuthor={false} />
            </Link>
          ))}
        </div>
      ) : searchTerm ? (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium mb-2">No stories found</h3>
          <p className="text-gray-500 mb-6">
            {`No results for "${searchTerm}". Try a different search term.`}
          </p>

          <Button variant="outline" onClick={() => setSearchTerm("")}>
            Clear Search
          </Button>
        </div>
      ) : (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium mb-2">No stories yet</h3>
          <p className="text-gray-500 mb-6">
            You haven&apos;t created any stories yet. Start writing your first
            story now!
          </p>
          <Button asChild>
            <Link href="/dashboard/stories/new">Create Your First Story</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
