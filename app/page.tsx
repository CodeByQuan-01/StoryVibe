import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { getFeaturedStories } from "@/lib/server-utils";
import { StoryCard } from "@/components/story/story-card";

export default async function Home() {
  // Fetch real featured stories from the database
  const featuredStories = await getFeaturedStories(3);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                  Stories Come Alive with Music
                </h1>
                <p className="max-w-[600px] text-gray-500 md:text-xl">
                  StoryVibe is an immersive storytelling platform where writers
                  can publish stories with music to enhance the reading
                  experience.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="bg-[#1A73E8] hover:bg-[#1558b3]"
                >
                  <Link href="/stories">Explore Stories</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/auth">Start Writing</Link>
                </Button>
              </div>
            </div>
            <div className="mx-auto lg:ml-auto flex items-center justify-center">
              <div className="relative w-full max-w-[500px] aspect-[4/3]">
                <Image
                  src="/placeholder.svg?height=375&width=500"
                  alt="StoryVibe Hero"
                  fill
                  className="object-cover rounded-lg"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="w-full py-12 md:py-24 bg-gray-50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                How StoryVibe Works
              </h2>
              <p className="max-w-[700px] text-gray-500 md:text-xl">
                Enhance your storytelling with music that sets the perfect mood
                for each chapter.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="bg-[#1A73E8] p-3 rounded-full">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  height="24"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                  <path d="M12 18v-6" />
                  <path d="M8 15l4 3 4-3" />
                </svg>
              </div>
              <h3 className="text-xl font-bold">Create Your Story</h3>
              <p className="text-gray-500">
                Write your story, divide it into chapters, and add a captivating
                cover image.
              </p>
            </div>
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="bg-[#1A73E8] p-3 rounded-full">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  height="24"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </div>
              <h3 className="text-xl font-bold">Add Music</h3>
              <p className="text-gray-500">
                Upload background music for each chapter to set the perfect mood
                and atmosphere.
              </p>
            </div>
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="bg-[#1A73E8] p-3 rounded-full">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  height="24"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <h3 className="text-xl font-bold">Immersive Reading</h3>
              <p className="text-gray-500">
                Readers enjoy your story with synchronized music that enhances
                the experience.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Stories Section */}
      <section className="w-full py-12 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                Featured Stories
              </h2>
              <p className="max-w-[700px] text-gray-500 md:text-xl">
                Discover captivating stories enhanced with music from our
                talented writers.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {featuredStories.length > 0 ? (
              featuredStories.map((story) => (
                <StoryCard key={story.id} story={story} />
              ))
            ) : (
              <div className="col-span-3 text-center py-12">
                <p className="text-gray-500">
                  No featured stories available yet. Check back soon!
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-center mt-8">
            <Button asChild variant="outline">
              <Link href="/stories">View All Stories</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-12 md:py-24 bg-[#1A73E8] text-white">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                Ready to Start Your Journey?
              </h2>
              <p className="max-w-[700px] md:text-xl">
                Join StoryVibe today and bring your stories to life with music.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Button asChild size="lg" variant="secondary">
                <Link href="/auth">Create Account</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="text-white border-white hover:bg-white hover:text-[#1A73E8]"
              >
                <Link href="/stories">Explore Stories</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
