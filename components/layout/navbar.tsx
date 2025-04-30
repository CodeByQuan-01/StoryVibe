"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/hooks/UseAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, X, BookOpen, PenSquare, User, LogOut } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    closeMenu();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center">
          <Link
            href="/"
            className="flex items-center space-x-2"
            aria-label="StoryVibe Home"
          >
            <BookOpen className="h-6 w-6 text-[#1A73E8]" aria-hidden="true" />
            <span className="text-xl font-bold">StoryVibe</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav
          className="hidden md:flex items-center space-x-6"
          aria-label="Main navigation"
        >
          <Link
            href="/"
            className={`text-sm font-medium transition-colors hover:text-[#1A73E8] ${
              pathname === "/" ? "text-[#1A73E8]" : "text-[#111111]"
            }`}
          >
            Home
          </Link>
          <Link
            href="/stories"
            className={`text-sm font-medium transition-colors hover:text-[#1A73E8] ${
              pathname === "/stories" ? "text-[#1A73E8]" : "text-[#111111]"
            }`}
          >
            Browse Stories
          </Link>
          {user ? (
            <>
              <Link
                href="/dashboard"
                className={`text-sm font-medium transition-colors hover:text-[#1A73E8] ${
                  pathname === "/dashboard"
                    ? "text-[#1A73E8]"
                    : "text-[#111111]"
                }`}
              >
                Dashboard
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                    aria-label="User menu"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={user.photoURL || ""}
                        alt={user.displayName}
                      />
                      <AvatarFallback>
                        {getInitials(user.displayName)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile">
                      <User className="mr-2 h-4 w-4" aria-hidden="true" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/stories/new">
                      <PenSquare className="mr-2 h-4 w-4" aria-hidden="true" />
                      <span>New Story</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button asChild>
              <Link href="/auth">Sign In</Link>
            </Button>
          )}
        </nav>

        {/* Mobile Navigation Toggle */}
        <button
          className="flex items-center md:hidden"
          onClick={toggleMenu}
          aria-label="Toggle menu"
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
        >
          {isMenuOpen ? (
            <X className="h-6 w-6" aria-hidden="true" />
          ) : (
            <Menu className="h-6 w-6" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div id="mobile-menu" className="md:hidden border-t">
          <nav
            className="container py-4 space-y-4"
            aria-label="Mobile navigation"
          >
            <Link
              href="/"
              className={`block py-2 text-sm font-medium ${
                pathname === "/" ? "text-[#1A73E8]" : "text-[#111111]"
              }`}
              onClick={closeMenu}
            >
              Home
            </Link>
            <Link
              href="/stories"
              className={`block py-2 text-sm font-medium ${
                pathname === "/stories" ? "text-[#1A73E8]" : "text-[#111111]"
              }`}
              onClick={closeMenu}
            >
              Browse Stories
            </Link>
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className={`block py-2 text-sm font-medium ${
                    pathname === "/dashboard"
                      ? "text-[#1A73E8]"
                      : "text-[#111111]"
                  }`}
                  onClick={closeMenu}
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/profile"
                  className={`block py-2 text-sm font-medium ${
                    pathname === "/dashboard/profile"
                      ? "text-[#1A73E8]"
                      : "text-[#111111]"
                  }`}
                  onClick={closeMenu}
                >
                  Profile
                </Link>
                <Link
                  href="/dashboard/stories/new"
                  className={`block py-2 text-sm font-medium ${
                    pathname === "/dashboard/stories/new"
                      ? "text-[#1A73E8]"
                      : "text-[#111111]"
                  }`}
                  onClick={closeMenu}
                >
                  New Story
                </Link>
                <button
                  className="block w-full text-left py-2 text-sm font-medium text-red-500"
                  onClick={handleSignOut}
                >
                  Log out
                </button>
              </>
            ) : (
              <Button asChild className="w-full">
                <Link href="/auth" onClick={closeMenu}>
                  Sign In
                </Link>
              </Button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
