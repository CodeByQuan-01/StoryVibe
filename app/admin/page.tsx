"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/UseAuth";
import {
  collection,
  query,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  where,
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StoryCard } from "@/components/story/story-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Eye, Trash, ShieldAlert } from "lucide-react";
import type { Story, User } from "@/lib/types";

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [stories, setStories] = useState<Story[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingStoryId, setDeletingStoryId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/auth");
        return;
      }

      if (!user.isAdmin) {
        router.push("/dashboard");
        return;
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.isAdmin) return;

      setLoading(true);
      setError(null);

      try {
        // Fetch all stories
        const storiesQuery = query(collection(db, "stories"));
        const storiesSnapshot = await getDocs(storiesQuery);
        const storiesData: Story[] = [];

        storiesSnapshot.forEach((doc) => {
          storiesData.push({ id: doc.id, ...doc.data() } as Story);
        });

        setStories(storiesData);

        // Fetch all users
        const usersQuery = query(collection(db, "users"));
        const usersSnapshot = await getDocs(usersQuery);
        const usersData: User[] = [];

        usersSnapshot.forEach((doc) => {
          usersData.push({ id: doc.id, ...doc.data() } as User);
        });

        setUsers(usersData);
      } catch (err) {
        console.error("Error fetching admin data:", err);
        setError("Failed to load admin data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleDeleteStory = async (storyId: string) => {
    if (!user?.isAdmin) return;

    setDeletingStoryId(storyId);

    try {
      // Get the story to delete
      const storyRef = doc(db, "stories", storyId);
      const storyDoc = await getDocs(
        query(collection(db, "chapters"), where("storyId", "==", storyId))
      );

      // Delete all chapters
      const deleteChapterPromises = storyDoc.docs.map(async (chapterDoc) => {
        const chapter = chapterDoc.data();

        // Delete chapter music if it exists
        if (chapter.musicUrl) {
          try {
            const musicRef = ref(storage, chapter.musicUrl);
            await deleteObject(musicRef);
          } catch (err) {
            console.error("Error deleting chapter music:", err);
          }
        }

        // Delete chapter document
        return deleteDoc(chapterDoc.ref);
      });

      await Promise.all(deleteChapterPromises);

      // Delete story cover image if it exists
      const story = stories.find((s) => s.id === storyId);
      if (story?.coverImage) {
        try {
          const imageRef = ref(storage, story.coverImage);
          await deleteObject(imageRef);
        } catch (err) {
          console.error("Error deleting cover image:", err);
        }
      }

      // Delete story document
      await deleteDoc(storyRef);

      // Update local state
      setStories(stories.filter((s) => s.id !== storyId));
    } catch (err) {
      console.error("Error deleting story:", err);
      setError("Failed to delete story. Please try again.");
    } finally {
      setDeletingStoryId(null);
    }
  };

  const toggleUserAdmin = async (userId: string, isCurrentlyAdmin: boolean) => {
    if (!user?.isAdmin) return;

    try {
      await updateDoc(doc(db, "users", userId), {
        isAdmin: !isCurrentlyAdmin,
      });

      // Update local state
      setUsers(
        users.map((u) =>
          u.id === userId ? { ...u, isAdmin: !isCurrentlyAdmin } : u
        )
      );
    } catch (err) {
      console.error("Error updating user admin status:", err);
      setError("Failed to update user admin status. Please try again.");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container max-w-screen-xl mx-auto px-4 py-12">
        <Skeleton className="h-10 w-1/3 mb-6" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        <Skeleton className="h-[500px] w-full rounded-md" />
      </div>
    );
  }

  if (!user?.isAdmin) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container max-w-screen-xl mx-auto px-4 py-12">
      <div className="flex items-center gap-2 mb-2">
        <ShieldAlert className="h-6 w-6 text-red-500" />
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      </div>
      <p className="text-gray-500 mb-8">
        Manage all stories and users on the platform.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      <Tabs defaultValue="stories" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="stories">Stories ({stories.length})</TabsTrigger>
          <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="stories">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stories.map((story) => (
                <Card key={story.id} className="overflow-hidden">
                  <StoryCard story={story} />
                  <CardFooter className="flex justify-between pt-4">
                    <Button asChild variant="outline" size="sm">
                      <a
                        href={`/stories/${story.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </a>
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete the story "{story.title}" and all its
                            chapters, including any uploaded music files.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteStory(story.id)}
                            className="bg-red-500 hover:bg-red-600"
                            disabled={deletingStoryId === story.id}
                          >
                            {deletingStoryId === story.id
                              ? "Deleting..."
                              : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {stories.length === 0 && (
              <div className="text-center py-12 border rounded-md">
                <h3 className="text-xl font-medium mb-2">No stories found</h3>
                <p className="text-gray-500">
                  There are no stories on the platform yet.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="users">
          <div className="space-y-4">
            {users.map((u) => (
              <Card key={u.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {u.photoURL ? (
                          <img
                            src={u.photoURL || "/placeholder.svg"}
                            alt={u.displayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium">
                            {u.displayName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium">{u.displayName}</h3>
                        <p className="text-sm text-gray-500">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {u.isAdmin && (
                        <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                          Admin
                        </span>
                      )}
                      <Button
                        variant={u.isAdmin ? "destructive" : "outline"}
                        size="sm"
                        onClick={() => toggleUserAdmin(u.id, !!u.isAdmin)}
                        disabled={u.id === user.id} // Can't change own admin status
                      >
                        {u.isAdmin ? "Remove Admin" : "Make Admin"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {users.length === 0 && (
              <div className="text-center py-12 border rounded-md">
                <h3 className="text-xl font-medium mb-2">No users found</h3>
                <p className="text-gray-500">
                  There are no users on the platform yet.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
