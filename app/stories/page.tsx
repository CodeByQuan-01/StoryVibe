"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useStories } from "@/lib/hooks/UseStories";
import { StoryCard } from "@/components/story/story-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import type { Story } from "@/lib/types";
import type { DocumentSnapshot } from "firebase/firestore";

export default function StoriesPage() {
  const { getAllPublishedStories, searchStories, loading, error } =
    useStories();
  const [stories, setStories] = useState<Story[]>([]);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | undefined>(
    undefined
  );
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadInitialStories();
  }, []);

  const loadInitialStories = async () => {
    try {
      const result = await getAllPublishedStories();
      setStories(result.stories);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (err) {
      console.error("Error loading stories:", err);
    }
  };

  const loadMoreStories = async () => {
    if (!lastDoc || !hasMore) return;

    try {
      const result = await getAllPublishedStories(lastDoc);
      setStories([...stories, ...result.stories]);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (err) {
      console.error("Error loading more stories:", err);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchTerm.trim()) {
      loadInitialStories();
      return;
    }

    setIsSearching(true);

    try {
      const results = await searchStories(searchTerm);
      setStories(results);
      setHasMore(false);
    } catch (err) {
      console.error("Error searching stories:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    loadInitialStories();
  };

  return (
    <div className="container max-w-screen-xl mx-auto px-4 py-12">
      <div className="flex flex-col space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-4">Browse Stories</h1>
          <form
            onSubmit={handleSearch}
            className="flex w-full max-w-lg space-x-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search stories..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={isSearching || loading}>
              {isSearching ? "Searching..." : "Search"}
            </Button>
            {searchTerm && (
              <Button type="button" variant="outline" onClick={clearSearch}>
                Clear
              </Button>
            )}
          </form>
        </div>

        {error && (
          <div className="text-red-500 p-4 border border-red-200 rounded-md bg-red-50">
            {error}
          </div>
        )}

        {loading && !stories.length ? (
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
        ) : stories.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stories.map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>

            {hasMore && !searchTerm && (
              <div className="flex justify-center mt-8">
                <Button
                  onClick={loadMoreStories}
                  disabled={loading}
                  variant="outline"
                >
                  {loading ? "Loading..." : "Load More"}
                </Button>
              </div>
            )}

            {searchTerm && (
              <div className="text-center mt-4">
                <p className="text-gray-500">
                  {`${stories.length} ${
                    stories.length === 1 ? "result" : "results"
                  } found for "${searchTerm}"`}
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-xl font-medium mb-2">No stories found</h3>
            {searchTerm ? (
              <p className="text-gray-500">
                {`No results for "${searchTerm}". Try a different search term or browse all stories.`}
              </p>
            ) : (
              <p className="text-gray-500">
                There are no published stories yet. Be the first to share your
                story!
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
