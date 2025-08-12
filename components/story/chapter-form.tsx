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
import { AlertCircle, Music, Upload, X, Play, Pause } from "lucide-react";
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
  const [order, setOrder] = useState(chapter?.order || nextChapterOrder);
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [musicPreview, setMusicPreview] = useState<string>(
    chapter?.musicUrl || ""
  );
  const [removeMusicFlag, setRemoveMusicFlag] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleMusicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("audio/")) {
      setFormError("Please upload an audio file");
      return;
    }

    // Validate file size (max 50MB for audio)
    if (file.size > 50 * 1024 * 1024) {
      setFormError("Audio file size should be less than 50MB");
      return;
    }

    setMusicFile(file);
    setMusicPreview(URL.createObjectURL(file));
    setRemoveMusicFlag(false);
    setFormError(null);
  };

  const handleRemoveMusic = () => {
    setMusicFile(null);
    setMusicPreview("");
    setRemoveMusicFlag(true);
    setIsPreviewPlaying(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const togglePreview = () => {
    if (!audioRef.current || !musicPreview) return;

    if (isPreviewPlaying) {
      audioRef.current.pause();
      setIsPreviewPlaying(false);
    } else {
      audioRef.current.play();
      setIsPreviewPlaying(true);
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

    if (order < 1) {
      setFormError("Chapter order must be at least 1");
      return;
    }

    try {
      setUploadProgress(10);

      if (isEditing && chapter) {
        setUploadProgress(30);

        let musicFileToUpload: File | null | undefined = undefined;

        if (removeMusicFlag) {
          musicFileToUpload = null; // Remove existing music
        } else if (musicFile) {
          musicFileToUpload = musicFile; // Upload new music
        }
        // If neither flag is set, don't change music (undefined)

        await updateChapter(
          chapter.id,
          {
            title,
            content,
            order,
          },
          musicFileToUpload
        );
        setUploadProgress(100);

        router.push(`/dashboard/stories/${storyId}`);
        router.refresh();
      } else {
        setUploadProgress(30);

        const newChapter = await createChapter(
          {
            storyId,
            title,
            content,
            order,
          },
          musicFile
        );
        setUploadProgress(100);

        router.push(`/dashboard/stories/${storyId}`);
        router.refresh();
      }
    } catch (err) {
      console.error("Error submitting chapter:", err);
      setFormError("Failed to save chapter. Please try again.");
      setUploadProgress(0);
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label htmlFor="order">Chapter Order</Label>
              <Input
                id="order"
                type="number"
                min="1"
                value={order}
                onChange={(e) => setOrder(Number.parseInt(e.target.value) || 1)}
                placeholder="Chapter number"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Chapter Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your chapter content here..."
              rows={12}
              className="min-h-[300px]"
              required
            />
            <p className="text-sm text-gray-500">
              Word count:{" "}
              {
                content
                  .trim()
                  .split(/\s+/)
                  .filter((word) => word.length > 0).length
              }
            </p>
          </div>

          <div className="space-y-2">
            <Label>Background Music (Optional)</Label>
            <p className="text-sm text-gray-500 mb-3">
              Add background music to enhance the reading experience. Supports
              MP3, WAV, and other audio formats.
            </p>

            {musicPreview ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                  <div className="flex items-center space-x-3">
                    <Music className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">
                        {musicFile
                          ? musicFile.name
                          : chapter?.musicFilename || "Current music"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {musicFile
                          ? `${(musicFile.size / (1024 * 1024)).toFixed(1)} MB`
                          : "Uploaded"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={togglePreview}
                    >
                      {isPreviewPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleRemoveMusic}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {musicPreview && (
                  <audio
                    ref={audioRef}
                    src={musicPreview}
                    onEnded={() => setIsPreviewPlaying(false)}
                    onPause={() => setIsPreviewPlaying(false)}
                    onPlay={() => setIsPreviewPlaying(true)}
                    className="hidden"
                  />
                )}
              </div>
            ) : (
              <div
                className="border-2 border-dashed rounded-md p-8 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-10 w-10 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 text-center">
                  Click to upload background music
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  MP3, WAV, M4A up to 50MB
                </p>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleMusicChange}
              className="hidden"
              accept="audio/*"
            />
          </div>

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
              <p className="text-xs text-gray-500 mt-1 text-center">
                {uploadProgress < 30
                  ? "Preparing..."
                  : uploadProgress < 90
                  ? "Uploading..."
                  : "Finalizing..."}
              </p>
            </div>
          )}

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
