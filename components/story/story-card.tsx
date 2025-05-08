import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";
import type { Story } from "@/lib/types";

interface StoryCardProps {
  story: Story;
  showAuthor?: boolean;
  linkWrapper?: boolean; // Add this prop to control whether the card should include its own Link
}

export function StoryCard({
  story,
  showAuthor = true,
  linkWrapper = true,
}: StoryCardProps) {
  const CardComponent = (
    <Card className="h-full overflow-hidden transition-all hover:shadow-md">
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        {story.coverImage ? (
          <Image
            src={story.coverImage || "/placeholder.svg"}
            alt={story.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            loading="lazy"
          />
        ) : (
          <Image
            src="/placeholder.svg?height=225&width=400"
            alt={story.title}
            fill
            className="object-cover bg-gray-100"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold line-clamp-1">{story.title}</h3>
        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
          {story.description}
        </p>

        <div className="flex flex-wrap gap-2 mt-3">
          {story.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {story.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{story.tags.length - 3} more
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center text-sm text-gray-500">
        <div className="flex items-center space-x-1">
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          <span>
            {story.chapterCount}{" "}
            {story.chapterCount === 1 ? "chapter" : "chapters"}
          </span>
        </div>

        <div>
          {showAuthor ? (
            <span>by {story.authorName}</span>
          ) : (
            <time dateTime={new Date(story.updatedAt).toISOString()}>
              {formatDistanceToNow(story.updatedAt, { addSuffix: true })}
            </time>
          )}
        </div>
      </CardFooter>
    </Card>
  );

  // Only wrap in Link if linkWrapper is true
  if (linkWrapper) {
    // Import Link at the top level only when needed
    const Link = require("next/link").default;
    return <Link href={`/stories/${story.id}`}>{CardComponent}</Link>;
  }

  return CardComponent;
}
