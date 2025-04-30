"use client";

import type React from "react";

import { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera } from "lucide-react";
import { uploadToCloudinary } from "@/lib/cloudinary";

interface ProfilePhotoUploadProps {
  currentPhotoURL: string | null | undefined;
  displayName: string;
  onPhotoChange: (url: string, publicId: string) => void;
}

export function ProfilePhotoUpload({
  currentPhotoURL,
  displayName,
  onPhotoChange,
}: ProfilePhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentPhotoURL || null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("Image size should be less than 2MB");
      return;
    }

    // Show preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Upload to Cloudinary
    setIsUploading(true);
    try {
      const result = await uploadToCloudinary(
        file,
        "storyvibe/profiles",
        "image"
      );
      onPhotoChange(result.url, result.publicId);
    } catch (error) {
      console.error("Error uploading profile photo:", error);
      alert("Failed to upload photo. Please try again.");
      // Revert to previous photo if upload fails
      setPreviewUrl(currentPhotoURL);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <Avatar className="h-24 w-24">
          <AvatarImage src={previewUrl || ""} alt={displayName} />
          <AvatarFallback className="text-lg">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        <label
          htmlFor="photo-upload"
          className={`absolute bottom-0 right-0 bg-[#1A73E8] text-white p-1 rounded-full cursor-pointer ${
            isUploading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <Camera className="h-4 w-4" />
          <span className="sr-only">Upload photo</span>
        </label>
        <input
          id="photo-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
          ref={fileInputRef}
        />
      </div>
      <p className="text-sm text-gray-500">
        {isUploading
          ? "Uploading..."
          : "Click the camera icon to upload a profile photo"}
      </p>
    </div>
  );
}
