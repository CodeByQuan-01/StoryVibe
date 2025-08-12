"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/UseAuth";
import { useReadTracking } from "@/lib/hooks/UseReadTracking";
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
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Eye,
  Trash,
  ShieldAlert,
  Users,
  BookOpen,
  TrendingUp,
  Clock,
  BarChart3,
} from "lucide-react";
import type { Story, User } from "@/lib/types";

interface PlatformStats {
  totalUsers: number;
  totalStories: number;
  totalReads: number;
  totalUniqueReaders: number;
  averageReadTime: number;
  topStories: Array<Story & { readCount: number; uniqueReaders: number }>;
  recentStories: Story[];
  activeUsers: number;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { getStoryReadingStats } = useReadTracking();

  const [stories, setStories] = useState<Story[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(
    null
  );
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

        const totalUsers = usersData.length;
        const totalStories = storiesData.length;
        const publishedStories = storiesData.filter((story) => story.published);

        // Calculate total reads and unique readers
        let totalReads = 0;
        let totalUniqueReaders = 0;
        let totalReadTime = 0;

        const storiesWithStats = await Promise.all(
          publishedStories.map(async (story) => {
            const stats = await getStoryReadingStats(story.id);
            if (stats) {
              totalReads += stats.totalReads;
              totalUniqueReaders += stats.uniqueReaders;
              totalReadTime += stats.averageReadTime * stats.uniqueReaders;
            }
            return {
              ...story,
              readCount: story.readCount || 0,
              uniqueReaders: story.uniqueReaders || 0,
            };
          })
        );

        // Get top stories by read count
        const topStories = storiesWithStats
          .sort((a, b) => (b.readCount || 0) - (a.readCount || 0))
          .slice(0, 5);

        // Get recent stories
        const recentStories = storiesData
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, 5);

        // Calculate active users (users who have read something in the last 30 days)
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const storyReadsQuery = query(
          collection(db, "storyReads"),
          where("readAt", ">=", thirtyDaysAgo)
        );
        const storyReadsSnapshot = await getDocs(storyReadsQuery);
        const activeUserIds = new Set();
        storyReadsSnapshot.forEach((doc) => {
          activeUserIds.add(doc.data().userId);
        });

        const averageReadTime =
          totalUniqueReaders > 0 ? totalReadTime / totalUniqueReaders : 0;

        setPlatformStats({
          totalUsers,
          totalStories,
          totalReads,
          totalUniqueReaders,
          averageReadTime,
          topStories,
          recentStories,
          activeUsers: activeUserIds.size,
        });
      } catch (err) {
        console.error("Error fetching admin data:", err);
        setError("Failed to load admin data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, getStoryReadingStats]);

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[120px] w-full rounded-md" />
          ))}
        </div>
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
        Platform overview and management tools.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      {platformStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {platformStats.totalUsers}
              </div>
              <p className="text-xs text-muted-foreground">
                {platformStats.activeUsers} active this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Stories
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {platformStats.totalStories}
              </div>
              <p className="text-xs text-muted-foreground">
                {stories.filter((s) => s.published).length} published
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reads</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {platformStats.totalReads}
              </div>
              <p className="text-xs text-muted-foreground">
                {platformStats.totalUniqueReaders} unique readers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg. Read Time
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(platformStats.averageReadTime / 60)}m
              </div>
              <p className="text-xs text-muted-foreground">per session</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full max-w-lg grid-cols-4 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stories">Stories ({stories.length})</TabsTrigger>
          <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Top Stories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {platformStats?.topStories.slice(0, 5).map((story, index) => (
                    <div
                      key={story.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-500">
                          #{index + 1}
                        </span>
                        <div>
                          <p className="font-medium line-clamp-1">
                            {story.title}
                          </p>
                          <p className="text-sm text-gray-500">
                            by {story.authorName}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {story.readCount} reads
                        </p>
                        <p className="text-xs text-gray-500">
                          {story.uniqueReaders} readers
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Stories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {platformStats?.recentStories.map((story) => (
                    <div
                      key={story.id}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium line-clamp-1">
                          {story.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          by {story.authorName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {new Date(story.createdAt).toLocaleDateString()}
                        </p>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            story.published
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {story.published ? "Published" : "Draft"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stories">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stories.map((story) => (
                <Card key={story.id} className="overflow-hidden">
                  <StoryCard story={story} linkWrapper={false} />
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
                            {`This action cannot be undone. This will permanently delete the story "${story.title}" and all its chapters, including any uploaded music files.`}
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
                        <p className="text-xs text-gray-400">
                          Joined {new Date(u.createdAt).toLocaleDateString()}
                        </p>
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

        <TabsContent value="analytics">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Platform Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">
                      {platformStats?.totalReads || 0}
                    </p>
                    <p className="text-sm text-gray-500">Total Story Views</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">
                      {platformStats?.totalUniqueReaders || 0}
                    </p>
                    <p className="text-sm text-gray-500">Unique Readers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-purple-600">
                      {platformStats
                        ? Math.round(
                            (platformStats.totalUniqueReaders /
                              platformStats.totalUsers) *
                              100
                          )
                        : 0}
                      %
                    </p>
                    <p className="text-sm text-gray-500">
                      User Engagement Rate
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Story Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {platformStats?.topStories.map((story, index) => (
                      <div
                        key={story.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-lg font-bold text-gray-400">
                            #{index + 1}
                          </span>
                          <div>
                            <p className="font-medium">{story.title}</p>
                            <p className="text-sm text-gray-500">
                              by {story.authorName}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{story.readCount}</p>
                          <p className="text-xs text-gray-500">reads</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                      <span className="font-medium">
                        Active Users (30 days)
                      </span>
                      <span className="text-xl font-bold text-blue-600">
                        {platformStats?.activeUsers || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                      <span className="font-medium">
                        Total Registered Users
                      </span>
                      <span className="text-xl font-bold text-green-600">
                        {platformStats?.totalUsers || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                      <span className="font-medium">Average Session Time</span>
                      <span className="text-xl font-bold text-purple-600">
                        {platformStats
                          ? Math.round(platformStats.averageReadTime / 60)
                          : 0}
                        m
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
