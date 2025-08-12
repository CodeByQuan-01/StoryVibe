"use client";

import type React from "react";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useStories } from "@/lib/hooks/UseStories";
import { useAuth } from "@/lib/hooks/UseAuth";
import { auth } from "@/lib/firebase";
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
import { AlertCircle, ImagePlus, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Story } from "@/lib/types";

interface StoryFormProps {
  story?: Story;
  isEditing?: boolean;
}

export function StoryForm({ story, isEditing = false }: StoryFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { createStory, updateStory, loading, error } = useStories();

  const [title, setTitle] = useState(story?.title || "");
  const [description, setDescription] = useState(story?.description || "");
  const [tags, setTags] = useState(story?.tags?.join(", ") || "");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string>(
    story?.coverImage || ""
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setFormError("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFormError("Image size should be less than 5MB");
      return;
    }

    setCoverImage(file);
    setCoverImagePreview(URL.createObjectURL(file));
    setFormError(null);
  };

  const handleRemoveCoverImage = () => {
    setCoverImage(null);
    setCoverImagePreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!user) {
      setFormError("You must be logged in to create a story");
      return;
    }

    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      setFormError("Authentication error. Please log in again.");
      return;
    }

    console.log("Current user:", user);
    console.log("Firebase user UID:", firebaseUser.uid);
    console.log("User ID from auth hook:", user.id);

    if (!title.trim()) {
      setFormError("Title is required");
      return;
    }

    if (!description.trim()) {
      setFormError("Description is required");
      return;
    }

    try {
      const tagArray = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      setUploadProgress(10);

      if (isEditing && story) {
        setUploadProgress(30);
        await updateStory(
          story.id,
          {
            title,
            description,
            tags: tagArray,
            published: story.published,
          },
          coverImage
        );
        setUploadProgress(100);

        router.push(`/dashboard/stories/${story.id}`);
        router.refresh();
      } else {
        setUploadProgress(30);
        console.log("Creating story with data:", {
          title,
          description,
          authorId: firebaseUser.uid,
          authorName:
            user.displayName || firebaseUser.displayName || firebaseUser.email,
          tags: tagArray,
          published: false,
        });

        const newStory = await createStory(
          {
            title,
            description,
            authorId: firebaseUser.uid,
            authorName:
              user.displayName ||
              firebaseUser.displayName ||
              firebaseUser.email,
            tags: tagArray,
            published: false,
            coverImage: "", // Will be updated by the createStory
          },
          coverImage
        );
        setUploadProgress(100);

        router.push(`/dashboard/stories/${newStory.id}`);
        router.refresh();
      }
    } catch (err) {
      console.error("Error submitting story:", err);
      setFormError("Failed to save story. Please try again.");
      setUploadProgress(0);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Story" : "Create New Story"}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter story title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter story description"
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="fantasy, adventure, mystery"
            />
          </div>

          <div className="space-y-2">
            <Label>Cover Image</Label>
            <div className="flex flex-col items-center space-y-4">
              {coverImagePreview ? (
                <div className="relative w-full max-w-md aspect-[16/9]">
                  <Image
                    src={coverImagePreview || "/placeholder.svg"}
                    alt="Cover preview"
                    fill
                    className="object-cover rounded-md"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full"
                    onClick={handleRemoveCoverImage}
                    aria-label="Remove cover image"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed rounded-md p-8 w-full max-w-md flex flex-col items-center justify-center cursor-pointer hover:border-[#1A73E8] transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus className="h-10 w-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">
                    Click to upload cover image
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    PNG, JPG, GIF up to 5MB
                  </p>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleCoverImageChange}
                className="hidden"
                accept="image/*"
              />
            </div>
          </div>

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-[#1A73E8] h-2.5 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              ></div>
              <p className="text-xs text-gray-500 mt-1 text-center">
                Uploading... {uploadProgress}%
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
              ? "Update Story"
              : "Create Story"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
