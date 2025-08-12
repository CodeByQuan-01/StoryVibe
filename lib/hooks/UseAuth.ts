"use client";

import { useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { User } from "@/lib/types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          await firebaseUser.getIdToken(true);

          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            setUser(userDoc.data() as User);
          } else {
            const newUser: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email || "",
              displayName:
                firebaseUser.displayName ||
                firebaseUser.email?.split("@")[0] ||
                "User",
              photoURL: firebaseUser.photoURL || null,
              isAdmin: false,
              createdAt: Date.now(),
            };

            let retries = 3;
            while (retries > 0) {
              try {
                await setDoc(doc(db, "users", firebaseUser.uid), newUser);
                console.log("User document created successfully");
                break;
              } catch (error) {
                retries--;
                console.error(
                  `Error creating user document (${retries} retries left):`,
                  error
                );
                if (retries === 0) {
                  console.error(
                    "Failed to create user document after all retries"
                  );
                }
                await new Promise((resolve) => setTimeout(resolve, 1000));
              }
            }

            setUser(newUser);
          }
        } catch (error) {
          console.error("Error fetching or creating user document:", error);
          const fallbackUser: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email || "",
            displayName:
              firebaseUser.displayName ||
              firebaseUser.email?.split("@")[0] ||
              "User",
            photoURL: firebaseUser.photoURL || null,
            isAdmin: false,
            createdAt: Date.now(),
          };
          setUser(fallbackUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    displayName: string
  ) => {
    try {
      console.log("Starting signup process...");
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUser = userCredential.user;
      console.log("User created in Firebase Auth:", firebaseUser.uid);

      await firebaseUser.getIdToken(true);

      // Update profile with display name
      await updateProfile(firebaseUser, { displayName });
      console.log("Profile updated with display name");

      // Create user document with retry logic
      const newUser: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || "",
        displayName,
        photoURL: firebaseUser.photoURL || null,
        isAdmin: false,
        createdAt: Date.now(),
      };

      console.log("Creating user document in Firestore...");

      let retries = 3;
      while (retries > 0) {
        try {
          await setDoc(doc(db, "users", firebaseUser.uid), newUser);
          console.log("User document created successfully");
          break;
        } catch (error) {
          retries--;
          console.error(
            `Error creating user document (${retries} retries left):`,
            error
          );
          if (retries === 0) {
            throw new Error(
              "Failed to create user profile. Please try signing in again."
            );
          }
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      return newUser;
    } catch (error: any) {
      console.error("Error in signUp function:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      await userCredential.user.getIdToken(true);
    } catch (error) {
      console.error("Error signing in:", error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      // Create a new provider instance each time
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: "select_account",
      });

      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      await firebaseUser.getIdToken(true);

      // Check if user document exists
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      if (!userDoc.exists()) {
        const newUser: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName: firebaseUser.displayName || "User",
          photoURL: firebaseUser.photoURL || null,
          isAdmin: false,
          createdAt: Date.now(),
        };

        let retries = 3;
        while (retries > 0) {
          try {
            await setDoc(doc(db, "users", firebaseUser.uid), newUser);
            break;
          } catch (error) {
            retries--;
            if (retries === 0) {
              console.error(
                "Failed to create user document after Google sign in"
              );
            }
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
      }
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  return {
    user,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
  };
}
