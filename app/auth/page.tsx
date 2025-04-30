import { AuthForm } from "@/components/auth/auth-form";

export const metadata = {
  title: "Sign In - StoryVibe",
  description: "Sign in to your StoryVibe account or create a new one.",
};

export default function AuthPage() {
  return (
    <div className="container max-w-screen-xl mx-auto px-4 py-12">
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-16rem)]">
        <AuthForm />
      </div>
    </div>
  );
}
