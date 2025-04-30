import Link from "next/link";
import { Music } from "lucide-react";
import type { Chapter } from "@/lib/types";

interface ChapterListProps {
  chapters: Chapter[];
  storyId: string;
}

export function ChapterList({ chapters, storyId }: ChapterListProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-medium">Chapters</h3>
      <div className="border rounded-md divide-y">
        {chapters.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No chapters available yet.
          </div>
        ) : (
          chapters.map((chapter) => (
            <Link
              key={chapter.id}
              href={`/stories/${storyId}/chapters/${chapter.id}`}
              className="block p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{chapter.title}</h4>
                  <p className="text-sm text-gray-500">
                    Chapter {chapter.order}
                  </p>
                </div>
                {chapter.musicUrl && (
                  <div className="flex items-center text-[#1A73E8]">
                    <Music className="h-4 w-4 mr-1" />
                    <span className="text-sm">Music</span>
                  </div>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
