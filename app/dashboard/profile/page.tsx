"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/UseAuth";
import { doc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfilePhotoUpload } from "@/components/profile/profile-photo-upload";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [photoPublicId, setPhotoPublicId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }

    if (user) {
      setDisplayName(user.displayName);
      setPhotoURL(user.photoURL || "");
      // We don't have the public ID stored in the user object
      // This would be a good enhancement to add
    }
  }, [user, authLoading, router]);

  const handlePhotoChange = (url: string, publicId: string) => {
    setPhotoURL(url);
    setPhotoPublicId(publicId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Update Firebase Auth profile
      await updateProfile(auth.currentUser!, {
        displayName,
        photoURL,
      });

      // Update Firestore user document
      await updateDoc(doc(db, "users", user.id), {
        displayName,
        photoURL,
      });

      setSuccess("Profile updated successfully");

      // Refresh the page to update the user context
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="container max-w-screen-xl mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <Skeleton className="h-10 w-1/2 mb-6" />
          <Skeleton className="h-[400px] w-full rounded-md" />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-screen-xl mx-auto px-4 py-12">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-6">Your Profile</h1>

        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>Update your profile information</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <ProfilePhotoUpload
                currentPhotoURL={user.photoURL}
                displayName={user.displayName}
                onPhotoChange={handlePhotoChange}
              />

              <div className="space-y-2">
                <Label htmlFor="display-name">Display Name</Label>
                <Input
                  id="display-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={user.email}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500">Email cannot be changed</p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="bg-green-50 border-green-200">
                  <AlertDescription className="text-green-600">
                    {success}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Updating..." : "Save Changes"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
