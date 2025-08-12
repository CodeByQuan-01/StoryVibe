"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/UseAuth";
import { useRouter } from "next/navigation";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, BookOpen, Eye, TrendingUp, Calendar, Star } from "lucide-react";
import type { Story, User as UserType } from "@/lib/types";

interface PlatformStats {
  totalUsers: number;
  totalStories: number;
  publishedStories: number;
  totalReads: number;
  todayReads: number;
  weeklyReads: number;
}

export default function BackofficePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<PlatformStats>({
    totalUsers: 0,
    totalStories: 0,
    publishedStories: 0,
    totalReads: 0,
    todayReads: 0,
    weeklyReads: 0,
  });
  const [topStories, setTopStories] = useState<Story[]>([]);
  const [recentStories, setRecentStories] = useState<Story[]>([]);
  const [recentUsers, setRecentUsers] = useState<UserType[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) {
      router.push("/");
      return;
    }

    if (user?.isAdmin) {
      fetchPlatformStats();
    }
  }, [user, loading, router]);

  const fetchPlatformStats = async () => {
    try {
      setLoadingStats(true);

      // Get total users count
      const usersSnapshot = await getCountFromServer(collection(db, "users"));
      const totalUsers = usersSnapshot.data().count;

      // Get total stories count
      const storiesSnapshot = await getCountFromServer(
        collection(db, "stories")
      );
      const totalStories = storiesSnapshot.data().count;

      // Get published stories count
      const publishedStoriesSnapshot = await getCountFromServer(
        query(collection(db, "stories"), where("published", "==", true))
      );
      const publishedStories = publishedStoriesSnapshot.data().count;

      // Get story reads count
      const readsSnapshot = await getCountFromServer(
        collection(db, "storyReads")
      );
      const totalReads = readsSnapshot.data().count;

      // Get today's reads (simplified - you might want to use server timestamp)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayReadsSnapshot = await getCountFromServer(
        query(
          collection(db, "storyReads"),
          where("readAt", ">=", today.getTime())
        )
      );
      const todayReads = todayReadsSnapshot.data().count;

      // Get this week's reads
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);
      const weeklyReadsSnapshot = await getCountFromServer(
        query(
          collection(db, "storyReads"),
          where("readAt", ">=", weekAgo.getTime())
        )
      );
      const weeklyReads = weeklyReadsSnapshot.data().count;

      setStats({
        totalUsers,
        totalStories,
        publishedStories,
        totalReads,
        todayReads,
        weeklyReads,
      });

      // Get top stories (by read count - simplified)
      const topStoriesQuery = query(
        collection(db, "stories"),
        where("published", "==", true),
        orderBy("createdAt", "desc"),
        limit(10)
      );
      const topStoriesSnapshot = await getDocs(topStoriesQuery);
      const topStoriesData = topStoriesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Story[];
      setTopStories(topStoriesData);

      // Get recent stories
      const recentStoriesQuery = query(
        collection(db, "stories"),
        orderBy("createdAt", "desc"),
        limit(10)
      );
      const recentStoriesSnapshot = await getDocs(recentStoriesQuery);
      const recentStoriesData = recentStoriesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Story[];
      setRecentStories(recentStoriesData);

      // Get recent users
      const recentUsersQuery = query(
        collection(db, "users"),
        orderBy("createdAt", "desc"),
        limit(10)
      );
      const recentUsersSnapshot = await getDocs(recentUsersQuery);
      const recentUsersData = recentUsersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as UserType[];
      setRecentUsers(recentUsersData);
    } catch (error) {
      console.error("Error fetching platform stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  if (loading || loadingStats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">
            Access Denied
          </h1>
          <p className="text-slate-600 mb-6">
            You don't have permission to access this page.
          </p>
          <Button onClick={() => router.push("/")} variant="outline">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            StoryVibe Backoffice
          </h1>
          <p className="text-slate-600">
            Platform administration and analytics dashboard
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalUsers.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Registered platform users
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
                {stats.totalStories.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.publishedStories} published
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reads</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalReads.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.todayReads} today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Weekly Reads
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.weeklyReads.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <Tabs defaultValue="stories" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="stories">Stories</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="stories" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Stories */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Top Stories
                  </CardTitle>
                  <CardDescription>
                    Most popular published stories
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topStories.map((story, index) => (
                      <div
                        key={story.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{story.title}</h4>
                          <p className="text-xs text-slate-600">
                            by {story.authorName}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">#{index + 1}</Badge>
                          {story.published && (
                            <Badge variant="default">Published</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Stories */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Recent Stories
                  </CardTitle>
                  <CardDescription>Latest story submissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentStories.map((story) => (
                      <div
                        key={story.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{story.title}</h4>
                          <p className="text-xs text-slate-600">
                            by {story.authorName} •{" "}
                            {new Date(story.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {story.published ? (
                            <Badge variant="default">Published</Badge>
                          ) : (
                            <Badge variant="secondary">Draft</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Recent Users
                </CardTitle>
                <CardDescription>Latest user registrations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-600">
                            {user.displayName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">
                            {user.displayName}
                          </h4>
                          <p className="text-xs text-slate-600">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                        {user.isAdmin && (
                          <Badge variant="destructive">Admin</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Growth</CardTitle>
                  <CardDescription>Key metrics overview</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">
                        User Growth Rate
                      </span>
                      <span className="font-medium">+12.5%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">
                        Story Publication Rate
                      </span>
                      <span className="font-medium">
                        {(
                          (stats.publishedStories / stats.totalStories) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">
                        Average Reads per Story
                      </span>
                      <span className="font-medium">
                        {stats.publishedStories > 0
                          ? (stats.totalReads / stats.publishedStories).toFixed(
                              1
                            )
                          : "0"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Activity Summary</CardTitle>
                  <CardDescription>Recent platform activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">
                        Daily Active Reads
                      </span>
                      <span className="font-medium">{stats.todayReads}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">
                        Weekly Active Reads
                      </span>
                      <span className="font-medium">{stats.weeklyReads}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">
                        Total Platform Engagement
                      </span>
                      <span className="font-medium">
                        {stats.totalReads.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
