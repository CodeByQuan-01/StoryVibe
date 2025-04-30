import Link from "next/link";
import { BookOpen } from "lucide-react";

export function Footer() {
  return (
    <footer
      className="w-full border-t bg-white"
      aria-labelledby="footer-heading"
    >
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="container py-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-6 w-6 text-[#1A73E8]" aria-hidden="true" />
              <span className="text-xl font-bold">StoryVibe</span>
            </div>
            <p className="text-sm text-gray-500">
              Immersive storytelling platform where writers can publish stories
              with music to enhance the reading experience.
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Quick Links</h3>
            <nav aria-label="Footer navigation">
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/"
                    className="text-sm text-gray-500 hover:text-[#1A73E8]"
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="/stories"
                    className="text-sm text-gray-500 hover:text-[#1A73E8]"
                  >
                    Browse Stories
                  </Link>
                </li>
                <li>
                  <Link
                    href="/auth"
                    className="text-sm text-gray-500 hover:text-[#1A73E8]"
                  >
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard"
                    className="text-sm text-gray-500 hover:text-[#1A73E8]"
                  >
                    Dashboard
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Legal</h3>
            <nav aria-label="Legal links">
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/terms"
                    className="text-sm text-gray-500 hover:text-[#1A73E8]"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="text-sm text-gray-500 hover:text-[#1A73E8]"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/copyright"
                    className="text-sm text-gray-500 hover:text-[#1A73E8]"
                  >
                    Copyright
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>
        <div className="mt-8 border-t pt-8 text-center">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} StoryVibe. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
