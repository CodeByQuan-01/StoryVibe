import { StoryForm } from "@/components/story/story-form";

export const metadata = {
  title: "Create New Story - StoryVibe",
  description: "Create a new story on StoryVibe.",
};

export default function NewStoryPage() {
  return (
    <div className="container max-w-screen-xl mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Create New Story</h1>
        <StoryForm />
      </div>
    </div>
  );
}
