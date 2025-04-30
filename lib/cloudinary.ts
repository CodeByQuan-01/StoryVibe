/**
 * Cloudinary utility functions for StoryVibe
 * Handles image and audio uploads to Cloudinary
 */

// Function to upload a file to Cloudinary
export async function uploadToCloudinary(
  file: File,
  folder: string,
  resourceType: "image" | "video" | "auto" = "auto"
): Promise<{ url: string; publicId: string }> {
  // Create a FormData instance
  const formData = new FormData();
  formData.append("file", file);
  formData.append(
    "upload_preset",
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "storyvibe"
  );
  formData.append("folder", folder);

  // Determine the correct upload URL based on resource type
  const uploadUrl = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;

  try {
    // Upload the file to Cloudinary
    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed with status: ${response.status}`);
    }

    const data = await response.json();
    return {
      url: data.secure_url,
      publicId: data.public_id,
    };
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    throw error;
  }
}

// Function to delete a file from Cloudinary
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: "image" | "video" | "raw" = "image"
): Promise<boolean> {
  try {
    // For production use, this should be a server-side API call
    // as it requires your API secret. This is a simplified example.
    const response = await fetch("/api/cloudinary/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        publicId,
        resourceType,
      }),
    });

    if (!response.ok) {
      throw new Error(`Delete failed with status: ${response.status}`);
    }

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
    throw error;
  }
}

// Function to generate a Cloudinary URL with transformations
export function getCloudinaryUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: number;
    format?: string;
  } = {}
): string {
  const {
    width,
    height,
    crop = "fill",
    quality = 90,
    format = "auto",
  } = options;

  let transformations = `q_${quality},f_${format}`;

  if (width) transformations += `,w_${width}`;
  if (height) transformations += `,h_${height}`;
  if (width || height) transformations += `,c_${crop}`;

  return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${transformations}/${publicId}`;
}

// Extract public ID from a Cloudinary URL
export function getPublicIdFromUrl(url: string): string | null {
  if (!url) return null;

  try {
    // Extract the public ID from a Cloudinary URL
    const regex = /\/upload\/(?:v\d+\/)?(.+)$/;
    const match = url.match(regex);

    if (match && match[1]) {
      // Remove file extension and any query parameters
      return match[1].replace(/\.[^/.]+$/, "").split("?")[0];
    }

    return null;
  } catch (error) {
    console.error("Error extracting public ID:", error);
    return null;
  }
}
