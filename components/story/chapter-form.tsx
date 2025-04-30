"use client";

import type React from "react";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useChapters } from "@/lib/hooks/UseChapter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, Music, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Chapter } from "@/lib/types";

interface ChapterFormProps {
  storyId: string;
  chapter?: Chapter;
  isEditing?: boolean;
  nextChapterOrder?: number;
}

export function ChapterForm({
  storyId,
  chapter,
  isEditing = false,
  nextChapterOrder = 1,
}: ChapterFormProps) {
  const router = useRouter();
  const { createChapter, updateChapter, loading, error } = useChapters();

  const [title, setTitle] = useState(chapter?.title || "");
  const [content, setContent] = useState(chapter?.content || "");
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [musicFileName, setMusicFileName] = useState(
    chapter?.musicFilename || ""
  );
  const [formError, setFormError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMusicFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("audio/")) {
      setFormError("Please upload an audio file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setFormError("Audio file size should be less than 10MB");
      return;
    }

    setMusicFile(file);
    setMusicFileName(file.name);
    setFormError(null);
  };

  const handleRemoveMusicFile = () => {
    setMusicFile(null);
    setMusicFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError("Title is required");
      return;
    }

    if (!content.trim()) {
      setFormError("Content is required");
      return;
    }

    try {
      if (isEditing && chapter) {
        await updateChapter(
          chapter.id,
          {
            title,
            content,
            order: chapter.order,
          },
          musicFile
        );

        router.push(`/dashboard/stories/${storyId}`);
        router.refresh();
      } else {
        await createChapter(
          {
            storyId,
            title,
            content,
            order: nextChapterOrder,
          },
          musicFile
        );

        router.push(`/dashboard/stories/${storyId}`);
        router.refresh();
      }
    } catch (err) {
      console.error("Error submitting chapter:", err);
      setFormError("Failed to save chapter. Please try again.");
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {isEditing ? "Edit Chapter" : "Create New Chapter"}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Chapter Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter chapter title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Chapter Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your chapter content here..."
              rows={15}
              required
              className="font-serif text-lg leading-relaxed"
            />
          </div>

          <div className="space-y-2">
            <Label>Background Music (Optional)</Label>
            <div className="flex flex-col space-y-4">
              {musicFileName ? (
                <div className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center">
                    <Music className="h-5 w-5 text-[#1A73E8] mr-2" />
                    <span className="text-sm truncate max-w-[250px]">
                      {musicFileName}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveMusicFile}
                    aria-label="Remove music file"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed rounded-md p-4 flex flex-col items-center justify-center cursor-pointer hover:border-[#1A73E8] transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Music className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">
                    Click to upload background music
                  </p>
                  <p className="text-xs text-gray-400 mt-1">MP3 up to 10MB</p>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleMusicFileChange}
                className="hidden"
                accept="audio/*"
              />
            </div>
          </div>

          {(formError || error) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formError || error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading
              ? "Saving..."
              : isEditing
              ? "Update Chapter"
              : "Create Chapter"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
